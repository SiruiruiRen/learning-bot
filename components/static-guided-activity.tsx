"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { CheckCircle2, ChevronRight, BookOpen, Edit3, Send } from "lucide-react"
import { captureToWAL, newTurnId } from "@/lib/dataLayerInstrument"

/**
 * StaticGuidedActivity — Control condition replacement for AI chatbot.
 *
 * Renders the same guided questions as the Bot condition, but instead of
 * AI feedback, shows a pre-written sample answer for each question.
 * Users write their own answer, then view the sample, then proceed.
 *
 * Data collection: logs the same event types to /api/events so that
 * research queries work identically across conditions.
 */

interface GuidedQuestion {
  id: string
  prompt: string
  placeholder: string
  sampleAnswer: string
}

interface StaticGuidedActivityProps {
  userId: string
  phase: string
  phaseNumber: number
  component?: string
  questions: GuidedQuestion[]
  onComplete: () => void
  height?: string
}

export default function StaticGuidedActivity({
  userId,
  phase,
  phaseNumber,
  component,
  questions,
  onComplete,
  height = "100%",
}: StaticGuidedActivityProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [showingSample, setShowingSample] = useState(false)
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const sessionId = useRef<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const componentName = component || `static_activity_phase${phaseNumber}`

  // Storage key for persistence
  const storageKey = `solbot_static_responses_${componentName}_${phase}`

  useEffect(() => {
    sessionId.current = localStorage.getItem("session_id")
    // Restore saved responses
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setResponses(parsed.responses || {})
        setCompletedQuestions(new Set(parsed.completed || []))
      }
    } catch { /* ignore */ }
  }, [storageKey])

  // Save responses to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        responses,
        completed: Array.from(completedQuestions),
      }))
    } catch { /* ignore */ }
  }, [responses, completedQuestions, storageKey])

  const logEvent = (eventType: string, metadata: Record<string, any>) => {
    if (!sessionId.current) return
    // Stage 2 safety net.
    const walTable =
      eventType.includes("submit") || eventType.includes("submission") || eventType.includes("final")
        ? (eventType.includes("final") ? "phase_completion_analytics" : "user_inputs")
        : eventType.includes("revision")
        ? "user_revision_tracking"
        : eventType.includes("evaluation") || eventType.includes("assessment") || eventType.includes("feedback_style")
        ? "assessments"
        : eventType.includes("chat") || eventType.includes("message")
        ? "messages"
        : "content_interaction_logs"
    captureToWAL(walTable, {
      event_type: eventType,
      phase,
      component: componentName,
      ...metadata,
      condition: "static",
      timestamp: new Date().toISOString(),
    }, { sessionId: sessionId.current, eventType })
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId.current,
        event_type: eventType,
        phase,
        component: componentName,
        metadata: { ...metadata, condition: "static", timestamp: new Date().toISOString() },
      }),
    }).catch(() => {})
  }

  const currentQ = questions[currentStep]
  const currentResponse = responses[currentQ?.id] || ""
  const allCompleted = completedQuestions.size === questions.length

  const handleWriteResponse = (value: string) => {
    setResponses(prev => ({ ...prev, [currentQ.id]: value }))
  }

  const handleViewSample = () => {
    if (!currentResponse.trim()) return
    setShowingSample(true)
    logEvent("sample_answer_viewed", {
      question_id: currentQ.id,
      user_response_length: currentResponse.length,
    })
  }

  const handleCompleteQuestion = () => {
    setCompletedQuestions(prev => new Set([...prev, currentQ.id]))
    setShowingSample(false)
    logEvent("static_question_completed", {
      question_id: currentQ.id,
      user_response_length: currentResponse.length,
    })
    // Move to next incomplete question or stay
    const nextIncomplete = questions.findIndex((q, i) => i > currentStep && !completedQuestions.has(q.id))
    if (nextIncomplete >= 0) {
      setCurrentStep(nextIncomplete)
    }
  }

  const handleFinalSubmit = () => {
    const totalTime = Math.round((Date.now() - startTimeRef.current) / 1000)
    logEvent("final_submission", {
      responses: Object.fromEntries(
        questions.map(q => [q.id, responses[q.id] || ""])
      ),
      response_count: questions.length,
      total_time_seconds: totalTime,
    })
    setSubmitted(true)
    onComplete()
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4" style={{ height }}>
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <p className="text-lg font-medium">Activity Complete!</p>
        <p className="text-sm text-muted-foreground">Your responses have been saved.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" style={{ height }}>
      {/* Progress indicator */}
      <div className="flex gap-2 items-center px-2">
        {questions.map((q, i) => (
          <div key={q.id} className="flex items-center gap-1">
            <button
              onClick={() => { setCurrentStep(i); setShowingSample(false) }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${completedQuestions.has(q.id)
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : i === currentStep
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ring-2 ring-amber-400"
                    : "bg-muted text-muted-foreground"
                }`}
            >
              {completedQuestions.has(q.id) ? "✓" : i + 1}
            </button>
            {i < questions.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {completedQuestions.size}/{questions.length} completed
        </span>
      </div>

      {/* Current question */}
      <Card className="p-4 flex-1 flex flex-col gap-4 overflow-auto">
        <div className="flex items-start gap-2">
          <Edit3 className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
          <p className="font-medium">{currentQ.prompt}</p>
        </div>

        <Textarea
          value={currentResponse}
          onChange={e => handleWriteResponse(e.target.value)}
          placeholder={currentQ.placeholder}
          className="flex-1 min-h-[120px] resize-none"
          disabled={showingSample}
        />

        {!showingSample ? (
          <Button
            onClick={handleViewSample}
            disabled={!currentResponse.trim()}
            className="self-end"
            variant="outline"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Sample Answer
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                📖 Sample Answer
              </p>
              <p className="text-sm whitespace-pre-wrap">{currentQ.sampleAnswer}</p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Compare your answer with the sample above. You may edit your response, then mark this question as done.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowingSample(false)}
              >
                Edit My Answer
              </Button>
              <Button
                size="sm"
                onClick={handleCompleteQuestion}
                style={{
                  backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
                  color: "#fff",
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Done
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Final submit */}
      {allCompleted && (
        <Button
          onClick={handleFinalSubmit}
          className="self-center px-8"
          style={{
            backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
            color: "#fff",
          }}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Final Version
        </Button>
      )}
    </div>
  )
}
