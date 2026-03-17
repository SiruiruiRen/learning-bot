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

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="border shadow-lg"
          style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
        >
          <CardContent className="py-8 text-center">
            <CheckCircle2
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: "#22c55e" }}
            />
            <h3 className="text-xl font-bold mb-2" style={{ color: accent }}>
              Successfully Submitted!
            </h3>
            <p className="text-muted-foreground">
              Your final responses have been saved. You can now proceed to the
              next phase.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const hasResponses = Object.keys(responses).length > 0

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
            <CheckCircle2 className="h-6 w-6" />
            Review & Submit Your Responses
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Please review your answers below. You can edit them or submit your
            final version.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Instruction hint */}
          <div
            className="flex items-start gap-3 p-3 rounded-lg border-l-4"
            style={{
              borderLeftColor: "#d8b26f",
              backgroundColor: "hsl(var(--muted) / 0.25)",
            }}
          >
            <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#d8b26f" }} />
            <p className="text-sm text-muted-foreground">
              You can interact with SoL2LBot multiple times to improve your responses.
              Click <strong>&quot;Edit Responses&quot;</strong> to revise, then submit when you&apos;re ready.
            </p>
          </div>

          {hasResponses ? (
            questionLabels.map(({ id, label }) => (
              <div
                key={id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "hsl(var(--muted) / 0.3)",
                  borderColor: neutralBorder,
                }}
              >
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: accent }}
                >
                  {label}
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {responses[id] || (
                    <span className="italic text-muted-foreground">
                      No response provided
                    </span>
                  )}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>No responses found. Please go back and complete the exercise.</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: neutralBorder }}>
            <Button
              variant="outline"
              className="border"
              style={{ borderColor: neutralBorder, color: mutedText }}
              onClick={onEdit}
              disabled={isSubmitting}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Responses
            </Button>

            {/* Submit with confirmation dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="px-6 py-2 rounded-lg shadow-md font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #b8892e, #96722d)",
                    color: "#fff",
                  }}
                  disabled={isSubmitting || !hasResponses}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Final Version
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Final Version?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Once submitted, your responses will be saved and you&apos;ll proceed
                    to the next phase. Make sure you&apos;re satisfied with your answers.
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
