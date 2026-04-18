"use client"

/**
 * useTextareaTelemetry — Ch4 research instrumentation for <Textarea>
 * engagement traces.
 *
 * Returns a set of event handlers you can spread onto a <Textarea> so
 * every focus/blur/paste/copy gets captured to the WAL with consistent
 * shape across the guided components + floating chatbot.
 *
 * Events emitted (target_table = "content_interaction_logs"):
 *   - textarea_focused   — user started editing the field
 *   - textarea_blurred   — user left the field; includes
 *                          time_on_field_seconds
 *   - textarea_paste     — user pasted text into the field. Captures
 *                          the pasted content (up to 4000 chars).
 *                          CRITICAL for Ch4 Indicator 6 (Feedback
 *                          Integration): a paste is the clearest
 *                          possible signal of "direct adoption" of
 *                          chatbot feedback. Downstream pipeline can
 *                          compare pasted_text against
 *                          feedback_delivered.feedback_text.
 *   - textarea_copy      — user copied selected text FROM the field.
 *
 * The hook accepts getters (not plain values) for context that may
 * change across renders (current field name, active feedback cycle
 * id). This lets us avoid re-memoizing handlers on every keystroke.
 *
 * Usage:
 *   const tele = useTextareaTelemetry({
 *     phase,
 *     component,
 *     getFieldName: () => interactionState === 'guiding'
 *       ? OBJECTIVE_QUESTIONS[currentQuestionIndex].id
 *       : 'chat_revision_input',
 *     getFeedbackCycleId: () => feedbackCycleIdRef.current,
 *   });
 *
 *   <Textarea
 *     value={userInput}
 *     onChange={...}
 *     onFocus={tele.onFocus}
 *     onBlur={tele.onBlur}
 *     onPaste={tele.onPaste}
 *     onCopy={tele.onCopy}
 *   />
 */

import type React from "react"
import { useRef } from "react"
import { captureToWAL } from "@/lib/dataLayerInstrument"

interface TextareaTelemetryOptions {
  phase: string
  component: string
  /** Resolver for the logical field name. Evaluated at event time,
   *  so the same hook instance can cover a Textarea whose identity
   *  depends on current interaction state (e.g. guiding → question id,
   *  chatting → generic revision input). */
  getFieldName: () => string
  /** Optional resolver for the active feedback_cycle_id. Lets events
   *  be JOIN-able with the owning R→feedback→R cycle. */
  getFeedbackCycleId?: () => string | null
  /** Optional session id override. Defaults to localStorage.session_id
   *  at event time. */
  getSessionId?: () => string | null
}

/** Hard cap on how much clipboard content we persist per event. 4000
 * chars comfortably covers the longest expected chatbot feedback
 * narrative without blowing up localStorage. */
const CLIPBOARD_CAPTURE_LIMIT = 4000

function truncate(s: string, max: number): { text: string; truncated: boolean } {
  if (s.length <= max) return { text: s, truncated: false }
  return { text: s.slice(0, max), truncated: true }
}

function readSessionIdFromStorage(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("session_id")
    return raw && raw.trim() ? raw.trim() : null
  } catch {
    return null
  }
}

export function useTextareaTelemetry(opts: TextareaTelemetryOptions) {
  const focusedAtRef = useRef<number | null>(null)

  const getSid = (): string | null =>
    opts.getSessionId?.() ?? readSessionIdFromStorage()

  const baseContext = () => ({
    phase: opts.phase,
    component: opts.component,
    field_name: opts.getFieldName(),
    feedback_cycle_id: opts.getFeedbackCycleId?.() ?? null,
  })

  const onFocus = () => {
    const sessionId = getSid()
    focusedAtRef.current = Date.now()
    if (!sessionId) return
    captureToWAL(
      "content_interaction_logs",
      {
        event_type: "textarea_focused",
        ...baseContext(),
        timestamp: new Date().toISOString(),
      },
      { sessionId, eventType: "textarea_focused" }
    )
  }

  const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const sessionId = getSid()
    const focusedAt = focusedAtRef.current
    focusedAtRef.current = null
    if (!sessionId) return
    const timeOnFieldSec = focusedAt ? (Date.now() - focusedAt) / 1000 : null
    captureToWAL(
      "content_interaction_logs",
      {
        event_type: "textarea_blurred",
        ...baseContext(),
        time_on_field_seconds: timeOnFieldSec,
        current_length: e.currentTarget.value.length,
        timestamp: new Date().toISOString(),
      },
      { sessionId, eventType: "textarea_blurred" }
    )
  }

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const sessionId = getSid()
    // NB: we do NOT preventDefault — the paste should still proceed.
    const pasted = e.clipboardData?.getData("text/plain") ?? ""
    if (!sessionId) return
    const { text, truncated } = truncate(pasted, CLIPBOARD_CAPTURE_LIMIT)
    captureToWAL(
      "content_interaction_logs",
      {
        event_type: "textarea_paste",
        ...baseContext(),
        pasted_length: pasted.length,
        pasted_text: text,
        pasted_text_truncated: truncated,
        // e.currentTarget.value is the value BEFORE the paste lands.
        field_length_before_paste: e.currentTarget.value.length,
        timestamp: new Date().toISOString(),
      },
      { sessionId, eventType: "textarea_paste" }
    )
  }

  const onCopy = (_e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const sessionId = getSid()
    if (!sessionId) return
    // window.getSelection() can return null (e.g. in detached frames);
    // also chain optionally through toString() so we land on "" in any
    // failure mode instead of crashing the page.
    const selected =
      typeof window !== "undefined"
        ? (window.getSelection()?.toString() ?? "")
        : ""
    const { text, truncated } = truncate(selected, CLIPBOARD_CAPTURE_LIMIT)
    captureToWAL(
      "content_interaction_logs",
      {
        event_type: "textarea_copy",
        ...baseContext(),
        copied_length: selected.length,
        copied_text: text,
        copied_text_truncated: truncated,
        timestamp: new Date().toISOString(),
      },
      { sessionId, eventType: "textarea_copy" }
    )
  }

  return { onFocus, onBlur, onPaste, onCopy }
}
