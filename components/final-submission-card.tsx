"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, Edit3, Send, Lightbulb, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { captureToWAL } from "@/lib/dataLayerInstrument"

interface QuestionLabel {
  id: string
  label: string
}

interface FinalSubmissionCardProps {
  /** Phase number as string, e.g. "2", "4", "phase5" */
  phase: string
  /** Phase number for display and completion flag, e.g. 2, 4, 5 */
  phaseNumber: number
  /** Component name used in localStorage key */
  componentName: string
  /** Mapping of question IDs to display labels */
  questionLabels: QuestionLabel[]
  /** Called when user clicks "Edit" to go back */
  onEdit: () => void
  /** Called after successful final submission */
  onSubmit: () => void
}

/**
 * Final Submission Card — shown after guided component completion.
 * Displays a summary of all user responses and requires explicit "Submit Final Version"
 * before allowing navigation to the next phase.
 */
export default function FinalSubmissionCard({
  phase,
  phaseNumber,
  componentName,
  questionLabels,
  onEdit,
  onSubmit,
}: FinalSubmissionCardProps) {
  const [responses, setResponses] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const accent = "var(--accent-text)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"

  // Load responses from localStorage
  useEffect(() => {
    try {
      const storageKey = `solbot_temp_responses_${componentName}_${phase}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setResponses(JSON.parse(saved))
      }
    } catch (error) {
      console.warn("Could not load responses for final submission:", error)
    }
  }, [componentName, phase])

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const sessionId = localStorage.getItem("session_id")
      const userId = localStorage.getItem("user_id")

      // Stage 2 safety net: final submission is one of the MOST
      // research-critical events. Capture it to WAL before both
      // backend writes so even if both /api/events and /api/user-data
      // fail, the submission is durable in localStorage and will
      // sync when connectivity returns.
      captureToWAL("phase_completion_analytics", {
        event_type: "final_submission",
        phase: `phase${phaseNumber}`,
        component: componentName,
        responses,
        response_count: Object.keys(responses).length,
      }, { sessionId, participantId: userId ?? undefined, eventType: "final_submission" })

      if (sessionId) {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: "final_submission",
            phase: `phase${phaseNumber}`,
            component: componentName,
            metadata: {
              responses,
              response_count: Object.keys(responses).length,
              timestamp: new Date().toISOString(),
            },
          }),
        }).catch((err) => console.error("Failed to log final_submission:", err))
      }

      localStorage.setItem(`solbot_phase${phaseNumber}_completed`, "true")

      if (userId) {
        fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            dataType: `phase${phaseNumber}_completed`,
            value: "true",
            metadata: {
              phase: phaseNumber,
              timestamp: new Date().toISOString(),
            },
          }),
        }).catch(() => {})
      }

      try {
        localStorage.removeItem(`solbot_temp_responses_${componentName}_${phase}`)
      } catch {
        // Silently fail
      }

      setSubmitted(true)
      onSubmit()
    } catch (error) {
      console.error("Error during final submission:", error)
      setIsSubmitting(false)
    }
  }

  const hasResponses = Object.keys(responses).length > 0
  const submittedAt = submitted ? new Date().toLocaleString() : ""

  // ------------------------------------------------------------
  // AFTER-SUBMIT view: now shows the student's ACTUAL final answer
  // so they get a visual receipt of what was recorded. Previously
  // this was just "Successfully Submitted!" with no answer echo.
  // ------------------------------------------------------------
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card
          className="border-2 shadow-xl"
          style={{
            backgroundColor: neutralSurface,
            borderColor: "#22c55e",
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
              >
                <CheckCircle2
                  className="h-10 w-10"
                  style={{ color: "#22c55e" }}
                />
              </motion.div>
              <CardTitle
                className="text-2xl md:text-3xl font-bold"
                style={{ color: "#22c55e" }}
              >
                Your Answer Is Saved
              </CardTitle>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Submitted at {submittedAt} · You can now proceed to the next phase.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ECHO: show EXACTLY what the student submitted, clearly
                labeled per question. This is the "receipt" they were
                missing before. */}
            <div className="space-y-4">
              {questionLabels
                .map(({ id, label }) => ({ id, label, value: responses[id] }))
                .filter((r) => r.value)
                .map(({ id, label, value }) => (
                  <div
                    key={id}
                    className="p-4 rounded-lg border-l-4"
                    style={{
                      borderLeftColor: "#22c55e",
                      backgroundColor: "hsl(var(--muted) / 0.3)",
                    }}
                  >
                    {label ? (
                      <p
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: accent }}
                      >
                        {label}
                      </p>
                    ) : null}
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {value}
                    </p>
                  </div>
                ))}
            </div>

            <div
              className="text-center text-xs text-muted-foreground pt-3 border-t"
              style={{ borderColor: neutralBorder }}
            >
              These responses have been permanently recorded. Click the next
              button at the bottom of the page when you&apos;re ready to move on.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ------------------------------------------------------------
  // BEFORE-SUBMIT view: make the "Submit Final Version" action the
  // clear primary CTA. Changes from the previous layout:
  //   - Submit button is now FULL WIDTH, prominently centered, with
  //     a subtle pulsing glow to draw the eye.
  //   - The edit action is secondary (smaller outline button,
  //     above the submit).
  //   - Header copy is sharper ("This is your final answer").
  // ------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className="border shadow-lg"
        style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className="flex items-center justify-center gap-2 text-xl md:text-2xl font-bold"
            style={{ color: accent }}
          >
            <Send className="h-6 w-6" />
            Ready to Submit Your Final Answer?
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            This version will be saved as your final response for this phase.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Preview of current answer */}
          {hasResponses ? (
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "hsl(var(--muted) / 0.3)",
                borderColor: neutralBorder,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: mutedText }}
              >
                Your Current Answer
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {questionLabels
                  .map(({ id }) => responses[id])
                  .filter(Boolean)
                  .join("\n\n")}
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>No responses found. Please go back and complete the exercise.</p>
            </div>
          )}

          {/* Instruction hint */}
          <div
            className="flex items-start gap-3 p-3 rounded-lg border-l-4"
            style={{
              borderLeftColor: "#d8b26f",
              backgroundColor: "hsl(var(--muted) / 0.25)",
            }}
          >
            <Lightbulb
              className="h-5 w-5 mt-0.5 shrink-0"
              style={{ color: "#d8b26f" }}
            />
            <p className="text-sm text-muted-foreground">
              Not satisfied? Click{" "}
              <strong>&quot;Edit Responses&quot;</strong> below to revise and
              get fresh AI feedback. Otherwise, submit your final version.
            </p>
          </div>

          {/* Secondary action — edit */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="border"
              style={{ borderColor: neutralBorder, color: mutedText }}
              onClick={onEdit}
              disabled={isSubmitting}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Responses
            </Button>
          </div>

          {/* Primary CTA — large, centered, attention-grabbing */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="w-full rounded-xl">
                <Button
                  className="w-full py-6 text-base md:text-lg rounded-xl shadow-lg font-bold ring-4 ring-amber-400/30 hover:ring-amber-400/60 transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, #b8892e, #96722d)",
                    color: "#fff",
                  }}
                  disabled={isSubmitting || !hasResponses}
                  data-testid="submit-final-version"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Final Version
                    </>
                  )}
                </Button>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Submit this as your final answer?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Once you submit, your responses will be permanently saved and
                  recorded as your final answer for this phase. You can still
                  review them on the next screen, but you won&apos;t be able to
                  edit them here.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>
                  Yes, Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </motion.div>
  )
}
