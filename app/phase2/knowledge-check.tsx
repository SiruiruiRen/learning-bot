"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, HelpCircle, ArrowRight } from "lucide-react"
import { usePathname } from "next/navigation"

interface KnowledgeCheckProps {
  questionNumber: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  onComplete: () => void
  totalQuestions?: number
}

export default function KnowledgeCheck({
  questionNumber,
  question,
  options,
  correctAnswer,
  explanation,
  onComplete,
  totalQuestions = 3,
}: KnowledgeCheckProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const pathname = usePathname()
  const isFinalQuestion = questionNumber === totalQuestions
  const questionStartTime = useRef<number>(Date.now())
  const firstInteractionTime = useRef<number | null>(null)
  const answerChanges = useRef<Array<{timestamp: string, answer: string}>>([])
  
  // Detect phase from pathname
  const phaseMatch = pathname.match(/\/phase(\d+)/)
  const phase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"
  
  // Get session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id")
    if (storedSessionId) {
      setSessionId(storedSessionId)
      
      // Log quiz started on first question
      if (questionNumber === 1) {
        logQuizEvent('quiz_started', {})
      }
    }
  }, [questionNumber])
  
  // Track first interaction
  useEffect(() => {
    if (selectedOption && !firstInteractionTime.current) {
      firstInteractionTime.current = Date.now()
    }
    
    // Track answer changes
    if (selectedOption && submitted === false) {
      const lastChange = answerChanges.current[answerChanges.current.length - 1]
      if (!lastChange || lastChange.answer !== selectedOption) {
        answerChanges.current.push({
          timestamp: new Date().toISOString(),
          answer: selectedOption
        })
      }
    }
  }, [selectedOption, submitted])

  const logQuizEvent = async (eventType: string, metadata: any) => {
    if (!sessionId) return
    
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          phase: phase,
          component: 'knowledge_check',
          metadata: metadata
        })
      })
    } catch (error) {
      console.error(`Failed to log ${eventType}:`, error)
    }
  }

  const handleSubmit = async () => {
    if (!selectedOption) return

    const correct = selectedOption === correctAnswer
    setIsCorrect(correct)
    setSubmitted(true)
    
    // Calculate timing metrics
    const timeToAnswer = Math.round((Date.now() - questionStartTime.current) / 1000)
    const timeToFirstInteraction = firstInteractionTime.current 
      ? Math.round((firstInteractionTime.current - questionStartTime.current) / 1000)
      : null
    
    // Log question answer
    await logQuizEvent('quiz_question_answered', {
      question_id: `question_${questionNumber}`,
      question_text: question,
      question_type: 'multiple_choice',
      attempt_number: 1,
      selected_answer: selectedOption,
      correct_answer: correctAnswer,
      is_correct: correct,
      time_to_answer_seconds: timeToAnswer,
      time_to_first_interaction_seconds: timeToFirstInteraction,
      answer_changed: answerChanges.current.length > 1,
      answer_changes: answerChanges.current,
      options_shown: options,
      explanation_viewed: false, // Will be updated if user views explanation
      retry_count: 0
    })
    
    // If this is the final question and correct, log quiz completion
    if (isFinalQuestion && correct) {
      // Note: You may want to track total quiz stats separately
      // For now, we log individual questions
    }
  }

  const handleTryAgain = async () => {
    setSelectedOption(null)
    setSubmitted(false)
    questionStartTime.current = Date.now()
    firstInteractionTime.current = null
    answerChanges.current = []
  }

  const handleManualComplete = async () => {
    // If this is the final question, log quiz completion
    if (isFinalQuestion && isCorrect) {
      await logQuizEvent('quiz_completed', {
        total_questions: totalQuestions,
        // Note: You may need to track these across all questions
        // For now, we log per-question data
      })
    }
    onComplete()
  }
  
  // Reset tracking when question changes
  useEffect(() => {
    questionStartTime.current = Date.now()
    firstInteractionTime.current = null
    answerChanges.current = []
  }, [questionNumber])

  return (
    <Card className="bg-[hsl(var(--card)_/_0.7)] border border-[hsl(var(--border))]">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-[var(--accent-text)]" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Knowledge Check {questionNumber}</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        <p className="text-foreground mb-6">{question}</p>

        <RadioGroup
          value={selectedOption || ""}
          onValueChange={setSelectedOption}
          className="space-y-3"
          disabled={submitted}
        >
          {options.map((option, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 rounded-lg border p-3 transition-colors ${
                submitted && option === correctAnswer
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : submitted && option === selectedOption
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-[hsl(var(--border))] hover:border-[#b8892e80] hover:bg-[hsl(var(--primary)_/_0.08)]"
              }`}
            >
              <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor={`option-${index}`}
                  className={`text-sm font-medium ${
                    submitted && option === correctAnswer
                      ? "text-emerald-400"
                      : submitted && option === selectedOption
                        ? "text-red-400"
                        : "text-foreground/80"
                  }`}
                >
                  {option}
                </Label>
              </div>
              {submitted && option === correctAnswer && (
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              )}
              {submitted && option === selectedOption && option !== correctAnswer && (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </RadioGroup>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-6 p-4 rounded-lg ${
              isCorrect ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-red-500/20 border border-red-500/30"
            }`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h4 className={`font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                  {isCorrect ? "Correct!" : "Not quite right"}
                </h4>
                <p className="text-foreground/80 mt-1">{explanation}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div>
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption}
                className="shadow-lg disabled:opacity-50 text-white"
                style={{ background: "linear-gradient(135deg, #b8892e, #96722d)" }}
              >
                Submit Answer
              </Button>
            ) : !isCorrect ? (
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="border-[hsl(var(--border))] text-[var(--accent-text)] hover:bg-[hsl(var(--primary)_/_0.1)]"
              >
                Try Again
              </Button>
            ) : null}
          </div>

          {/* Show Continue button for ALL correct answers */}
          {submitted && isCorrect && (
            <Button
              onClick={handleManualComplete}
              className="text-white flex items-center gap-2 shadow-lg"
              style={{ background: "linear-gradient(135deg, #b8892e, #96722d)" }}
            >
              {isFinalQuestion ? "Complete & Continue" : "Next Question"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

