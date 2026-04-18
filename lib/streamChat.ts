/**
 * streamChat — consume an SSE-streamed /api/chat/stream response.
 *
 * The backend endpoint (backend/routes/chat.py :: process_chat_stream)
 * emits three kinds of SSE events, all wrapped in `data: {json}\n\n`:
 *
 *   {"type":"text",    "delta":"..."}              — incremental text chunk
 *   {"type":"complete","content":"...","evaluation":{...},"model":"..."}
 *   {"type":"error",   "error":"..."}
 *
 * This utility reads the response body with a ReadableStream reader
 * (EventSource doesn't support POST bodies, so we can't use that), parses
 * each SSE message, and fires the right callback on `handlers`.
 *
 * USAGE (example from a guided component):
 *
 *   let accumulated = "";
 *   const botMessageId = uuidv4();
 *   setMessages(prev => [...prev, { id: botMessageId, sender: "bot",
 *                                    content: "", type: "evaluation" }]);
 *
 *   await streamChat(`${BACKEND_URL}/api/chat/stream`, {
 *     session_id, message, phase, component,
 *     is_submission: true, attempt_number: 1,
 *   }, {
 *     onText: (delta) => {
 *       accumulated += delta;
 *       setMessages(prev => prev.map(m =>
 *         m.id === botMessageId ? { ...m, content: accumulated } : m));
 *     },
 *     onComplete: (content, evaluation, model) => {
 *       setMessages(prev => prev.map(m =>
 *         m.id === botMessageId ? { ...m, content, evaluation } : m));
 *       // ... emit feedback_delivered WAL event here ...
 *     },
 *     onError: (err) => { console.error(err); },
 *   });
 *
 * The utility itself does NOT touch React state or the WAL. That's the
 * caller's responsibility — keeps this function usable from any context.
 */

export interface StreamChatHandlers {
  /** Called once per text delta as tokens stream in. */
  onText: (delta: string) => void
  /** Called once when the stream finishes successfully. `content` is the
   *  cleaned final text (with the `<!-- INSTRUCTOR_METADATA -->` block
   *  already stripped server-side). `evaluation` is the parsed rubric
   *  metadata dict, or null. `model` is the actual model ID used. */
  onComplete: (
    content: string,
    evaluation: Record<string, unknown> | null,
    model: string
  ) => void
  /** Called if the backend emits an `error` event, or if any JSON/network
   *  error happens while reading the stream. The caller decides whether
   *  to retry or surface to the user. */
  onError: (message: string) => void
}

export interface StreamChatBody {
  session_id: string
  message: string
  phase: string
  component: string
  is_submission?: boolean
  attempt_number?: number
  [key: string]: unknown
}

/**
 * Hide any in-progress `<!-- INSTRUCTOR_METADATA ... -->` block from
 * the displayed chat content while the stream is still arriving.
 *
 * The main chatbot's prompt asks Claude to emit structured rubric scores
 * inside an HTML-comment block at the END of the response (so a regex
 * extractor can parse them server-side). During streaming, students
 * would briefly see `<!-- INSTRUCTOR_METADATA` then `Overall_Score: 2`
 * etc. appear token by token before the `onComplete` callback swaps in
 * the cleaned content. That flash is ugly and confusing ("why is the
 * bot leaking its notes?").
 *
 * Truncating the displayed content at the first `<!--` keeps the
 * student-facing view clean throughout the stream. The full, unclipped
 * content is still sent to `onComplete` for evaluation extraction.
 *
 * Floating chatbot responses don't contain these blocks (different
 * prompt, no rubric), so this helper is a no-op for them.
 */
export function stripPendingMetadata(content: string): string {
  const idx = content.indexOf("<!--")
  if (idx < 0) return content
  return content.slice(0, idx).trimEnd()
}

/**
 * POST to an SSE chat endpoint and dispatch events as they stream in.
 * Resolves when the stream finishes (either `complete` or `error`).
 */
export async function streamChat(
  url: string,
  body: StreamChatBody,
  handlers: StreamChatHandlers,
  init: { signal?: AbortSignal } = {}
): Promise<void> {
  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: init.signal,
    })
  } catch (err) {
    handlers.onError(
      err instanceof Error ? err.message : "Network error starting stream"
    )
    return
  }

  if (!response.ok || !response.body) {
    handlers.onError(`HTTP ${response.status} ${response.statusText}`)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  // SSE messages are separated by a blank line (\n\n). We accumulate raw
  // chunks in `buffer` and only dispatch when we find a complete message.
  let buffer = ""
  let completed = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Normalize CRLF (some proxies insert \r) so the split below works.
      const normalized = buffer.replace(/\r\n/g, "\n")
      const messages = normalized.split("\n\n")
      // Keep the trailing partial chunk for the next read.
      buffer = messages.pop() ?? ""

      for (const msg of messages) {
        // An SSE message may contain multiple "data:" lines; concatenate
        // them per the spec. (The backend only emits one per event, but
        // robustness is cheap.)
        const dataLines: string[] = []
        for (const line of msg.split("\n")) {
          if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart())
          }
          // Ignore other SSE lines (event:, id:, retry:, comments)
        }
        if (dataLines.length === 0) continue
        const raw = dataLines.join("\n")
        if (!raw) continue

        let event: {
          type?: string
          delta?: string
          content?: string
          evaluation?: Record<string, unknown> | null
          model?: string
          error?: string
        }
        try {
          event = JSON.parse(raw)
        } catch (parseErr) {
          // A corrupted frame shouldn't abort the stream — log and skip.
          console.error("[streamChat] failed to parse SSE frame:", raw, parseErr)
          continue
        }

        if (event.type === "text" && typeof event.delta === "string") {
          handlers.onText(event.delta)
        } else if (event.type === "complete") {
          handlers.onComplete(
            typeof event.content === "string" ? event.content : "",
            (event.evaluation ?? null) as Record<string, unknown> | null,
            typeof event.model === "string" ? event.model : "unknown"
          )
          completed = true
        } else if (event.type === "error") {
          handlers.onError(event.error ?? "Unknown stream error")
          completed = true
        }
      }
    }
  } catch (err) {
    handlers.onError(
      err instanceof Error ? err.message : "Stream read error"
    )
    return
  }

  // If the connection closed without a terminal event, surface that.
  if (!completed) {
    handlers.onError("Stream ended unexpectedly without a complete event")
  }
}
