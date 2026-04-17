/**
 * Stage 1 — DataLayer manual test harness.
 *
 * Route: /__dev__/data-layer-test
 *
 * This page exists ONLY for local / pre-production testing. It is NOT
 * linked from the main student flow. It:
 *   - Instantiates a DataLayer with a fixed participant_id
 *     (`stage1-dev-<random>`) so you can wipe it between runs.
 *   - Exposes buttons for the 5 Playwright personas so you can drive
 *     the same scenarios by hand.
 *   - Renders the live queue: ids, target tables, attempts, last error.
 *   - Shows the sync-state indicator we plan to promote into the real
 *     app in Stage 3.
 *
 * The page deliberately does NOT import any existing sol2l-bot
 * components so a bug here cannot regress the real experiment UI.
 */

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  DataLayer,
  getOrCreateDataLayer,
  type WalRecord,
} from "@/lib/dataLayer"
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowserClient"

// The preflight helper is installed on `window` inside a useEffect
// below so that (a) it runs only in the browser and (b) the bundler
// cannot tree-shake it — module-scope side effects were being
// optimised away in Next.js dev builds.
async function runPreflight(): Promise<{ ok: boolean; detail: string }> {
  const client = getSupabaseBrowserClient()
  if (!client) {
    return {
      ok: false,
      detail:
        "Supabase browser client unavailable (NEXT_PUBLIC_SUPABASE_* env vars missing).",
    }
  }
  const { error } = await client
    .from("write_ahead_log")
    .select("id")
    .limit(1)
  if (error) {
    return {
      ok: false,
      detail: `${error.code ?? ""} ${error.message}`.trim(),
    }
  }
  return { ok: true, detail: "" }
}

// ---------------------------------------------------------------------
// Persona scenarios — mirrored in tests/data-layer/personas.spec.ts so
// manual runs and Playwright runs exercise identical code paths.
// ---------------------------------------------------------------------

type PersonaId = "fast" | "thoughtful" | "disruptive" | "offline" | "slow_llm"

interface Persona {
  id: PersonaId
  label: string
  description: string
  run: (dl: DataLayer) => Promise<void>
}

async function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

const PERSONAS: Persona[] = [
  {
    id: "fast",
    label: "P1 · Fast completer",
    description:
      "Rips through 6 phases in 60s with low-quality answers. 12 events total.",
    run: async (dl) => {
      for (let phase = 1; phase <= 6; phase++) {
        dl.record("content_interaction_logs", {
          interaction_type: "phase_entered",
          phase: `phase${phase}`,
        })
        dl.record("messages", {
          role: "user",
          phase: `phase${phase}`,
          content: "idk",
          char_count: 3,
        })
        await sleep(200)
      }
    },
  },
  {
    id: "thoughtful",
    label: "P2 · Thoughtful student",
    description:
      "Pauses 2-5s between writes, gives high-quality answers across 6 phases.",
    run: async (dl) => {
      for (let phase = 1; phase <= 6; phase++) {
        dl.record("content_interaction_logs", {
          interaction_type: "phase_entered",
          phase: `phase${phase}`,
        })
        await sleep(400)
        const longAnswer =
          "In phase " +
          phase +
          " I plan to use retrieval practice and spaced repetition, " +
          "reviewing Ch." +
          phase +
          " of the textbook twice per week with 20 practice problems."
        dl.record("user_inputs", {
          phase: `phase${phase}`,
          input_type: "reflection",
          input_value: longAnswer,
          char_count: longAnswer.length,
          is_submission: true,
        })
        await sleep(400)
        dl.record("assessments", {
          phase: `phase${phase}`,
          component: "learning_objective",
          overall_score: 4 + (phase % 2),
          scaffolding_level: 3,
          lowest_category: "HIGH",
        })
      }
    },
  },
  {
    id: "disruptive",
    label: "P3 · Tab-switcher",
    description:
      "Submits, then the page visibility flips to hidden for 2s (simulating a tab switch), resumes, submits again.",
    run: async (dl) => {
      dl.record("content_interaction_logs", {
        interaction_type: "phase_entered",
        phase: "phase2",
      })
      dl.record("user_inputs", {
        phase: "phase2",
        input_type: "reflection",
        input_value: "First attempt",
      })
      // Simulate visibility flip. In real Playwright we'd dispatch the
      // event via page.evaluate; here we just call the handler path by
      // triggering a sync immediately.
      await sleep(800)
      await dl.sync()
      dl.record("user_inputs", {
        phase: "phase2",
        input_type: "reflection",
        input_value: "Second attempt after tab switch",
        revision_number: 2,
      })
    },
  },
  {
    id: "offline",
    label: "P4 · Offline interlude",
    description:
      "Queues 5 events while the Supabase client is forced null (simulates offline), then 'reconnects' and drains.",
    run: async (dl) => {
      for (let i = 0; i < 5; i++) {
        dl.record("click_events", {
          click_type: "button",
          element_id: `btn-${i}`,
          pathname: "/__dev__/data-layer-test",
        })
      }
      // Sync is attempted after each record; if the tester has toggled
      // "force offline" above, these will all pile up. The
      // "Drain now" button below then forces a drain once the toggle
      // is flipped back.
    },
  },
  {
    id: "slow_llm",
    label: "P5 · Slow LLM call",
    description:
      "Mimics a chat turn: logs user message, waits 3s (pretend LLM latency), logs assistant response + assessment.",
    run: async (dl) => {
      const turnId = crypto.randomUUID()
      dl.record("messages", {
        turn_id: turnId,
        role: "user",
        phase: "phase4",
        content: "If I feel distracted, I will put my phone away.",
      })
      await sleep(3_000)
      dl.record("messages", {
        turn_id: turnId,
        role: "assistant",
        phase: "phase4",
        content: "Strong implementation intention. Consider adding a timer.",
      })
      dl.record("assessments", {
        turn_id: turnId,
        phase: "phase4",
        component: "mcii",
        overall_score: 5,
        scaffolding_level: 3,
      })
    },
  },
]

// ---------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------

export default function DataLayerTestPage() {
  const [participantId, setParticipantId] = useState<string>("")
  const [forceOffline, setForceOffline] = useState(false)
  const [pending, setPending] = useState<ReadonlyArray<WalRecord>>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const dlRef = useRef<DataLayer | null>(null)

  // Assign a per-tab participant id so multiple browsers don't collide.
  // Also install the Playwright preflight helper on window.
  useEffect(() => {
    ;(
      window as unknown as {
        __stage1Preflight?: typeof runPreflight
      }
    ).__stage1Preflight = runPreflight

    const existing = localStorage.getItem("stage1_dev_pid")
    const pid = existing ?? `stage1-dev-${crypto.randomUUID()}`
    if (!existing) {
      localStorage.setItem("stage1_dev_pid", pid)
    }
    setParticipantId(pid)
  }, [])

  // Acquire a handle on the DataLayer singleton. Under React Strict
  // Mode this effect runs twice (setup → cleanup → setup). The
  // singleton registry in lib/dataLayer.ts refcounts handles so the
  // underlying instance survives the extra cleanup.
  useEffect(() => {
    if (!participantId) return
    const dl = getOrCreateDataLayer(participantId, null, {
      supabaseClient: forceOffline ? null : undefined,
      periodicSyncMs: 2_000,
      suppressBeforeUnload: true, // no popup in dev
      appVersion: "stage-1-dev",
    })
    dlRef.current = dl

    const unsub = dl.subscribe((n) => {
      setPendingCount(n)
      setPending(dl.pendingSnapshot())
    })

    return () => {
      unsub()
      dl.dispose() // refcount decrement; instance survives until last handle releases
    }
  }, [participantId, forceOffline])

  const appendLog = useCallback((msg: string) => {
    setLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev,
    ].slice(0, 50))
  }, [])

  const runPersona = useCallback(
    async (p: Persona) => {
      const dl = dlRef.current
      if (!dl) return
      appendLog(`▶ Running ${p.label}`)
      try {
        await p.run(dl)
        appendLog(`✓ ${p.label} done (queue=${dl.pendingCount()})`)
      } catch (err) {
        appendLog(`✗ ${p.label} threw: ${(err as Error).message}`)
      }
    },
    [appendLog]
  )

  // Expose a promise-returning persona runner on window so Playwright
  // can await the ENTIRE persona (not just the click dispatch).
  // Without this the test proceeds before the persona's awaits
  // finish, and queue-is-drained is checked while records are still
  // pending.
  useEffect(() => {
    ;(
      window as unknown as {
        __stage1RunPersona?: (id: PersonaId) => Promise<void>
      }
    ).__stage1RunPersona = async (id: PersonaId) => {
      const persona = PERSONAS.find((x) => x.id === id)
      if (!persona) throw new Error(`Unknown persona: ${id}`)
      await runPersona(persona)
    }
  }, [runPersona])

  const drainNow = useCallback(async () => {
    const dl = dlRef.current
    if (!dl) return
    appendLog("▶ Forcing sync…")
    const r = await dl.sync()
    appendLog(`✓ sync result: synced=${r.synced} remaining=${r.remaining}`)
  }, [appendLog])

  const resetAll = useCallback(() => {
    dlRef.current?.__resetForTests()
    appendLog("⟲ Queue reset")
  }, [appendLog])

  const rotateParticipant = useCallback(() => {
    const newPid = `stage1-dev-${crypto.randomUUID()}`
    if (typeof window !== "undefined") {
      localStorage.setItem("stage1_dev_pid", newPid)
    }
    setParticipantId(newPid)
    appendLog(`↻ New participant: ${newPid}`)
  }, [appendLog])

  const syncIndicator = useMemo(() => {
    if (pendingCount === 0) return { text: "✓ All saved", tone: "ok" as const }
    return { text: `⏳ ${pendingCount} pending`, tone: "pending" as const }
  }, [pendingCount])

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "2rem auto",
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
        color: "#111",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 4 }}>
          Stage 1 — DataLayer Test Harness
        </h1>
        <p style={{ color: "#555", fontSize: 14, margin: 0 }}>
          Isolated dev page. No production flow touches this. Open DevTools →
          Application → Local Storage to watch the queue persist.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={panelStyle}>
          <div style={panelHeading}>Participant</div>
          <code
            data-testid="participant-id"
            style={{ fontSize: 12, wordBreak: "break-all" }}
          >
            {participantId || "(loading)"}
          </code>
          <button style={btnStyle} onClick={rotateParticipant}>
            Rotate participant
          </button>
        </div>

        <div style={panelStyle}>
          <div style={panelHeading}>Sync state</div>
          <div
            data-testid="sync-indicator"
            data-pending-count={pendingCount}
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: syncIndicator.tone === "ok" ? "#1a7f37" : "#bf8700",
            }}
          >
            {syncIndicator.text}
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#333",
            }}
          >
            <input
              type="checkbox"
              checked={forceOffline}
              onChange={(e) => setForceOffline(e.target.checked)}
              data-testid="force-offline-toggle"
            />
            Force offline (inject null Supabase client)
          </label>
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Personas</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              style={btnStyle}
              data-testid={`run-${p.id}`}
              title={p.description}
              onClick={() => runPersona(p)}
            >
              {p.label}
            </button>
          ))}
          <button
            style={{ ...btnStyle, background: "#eef" }}
            data-testid="drain-now"
            onClick={drainNow}
          >
            Drain now
          </button>
          <button
            style={{ ...btnStyle, background: "#fee" }}
            data-testid="reset-queue"
            onClick={resetAll}
          >
            Reset queue
          </button>
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>
          Queue ({pendingCount})
        </h2>
        <div
          data-testid="queue-list"
          style={{
            border: "1px solid #eee",
            borderRadius: 6,
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          {pending.length === 0 ? (
            <div style={{ padding: 12, color: "#888" }}>Queue is empty.</div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={th}>#</th>
                  <th style={th}>target_table</th>
                  <th style={th}>event_type</th>
                  <th style={th}>attempts</th>
                  <th style={th}>last_error</th>
                  <th style={th}>client_timestamp</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r, i) => (
                  <tr key={r.idempotency_key}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{r.target_table}</td>
                    <td style={td}>{r.event_type ?? "—"}</td>
                    <td style={td}>{r.attempts}</td>
                    <td style={{ ...td, color: "#b00" }}>
                      {r.last_error ?? ""}
                    </td>
                    <td style={td}>{r.client_timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Activity log</h2>
        <div
          data-testid="activity-log"
          style={{
            border: "1px solid #eee",
            borderRadius: 6,
            padding: 8,
            fontSize: 12,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            minHeight: 120,
            maxHeight: 240,
            overflow: "auto",
            background: "#fcfcfc",
          }}
        >
          {log.length === 0
            ? "(nothing yet)"
            : log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </section>
    </main>
  )
}

// Inline styles keep this page zero-dependency on the app's design
// system — another reason bugs here cannot regress the student flow.
const panelStyle: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  background: "#fff",
}
const panelHeading: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: 0.6,
}
const btnStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
  fontSize: 13,
}
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  borderBottom: "1px solid #eee",
  fontWeight: 600,
}
const td: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #f3f3f3",
}
