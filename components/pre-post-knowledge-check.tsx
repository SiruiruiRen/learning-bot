"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, HelpCircle, ArrowRight, BookOpen } from "lucide-react"
import { usePathname } from "next/navigation"
import type { KnowledgeCheckQuestion } from "@/lib/knowledge-check-questions"
import { captureToWAL } from "@/lib/dataLayerInstrument"

interface PrePostKnowledgeCheckProps {
  questions: KnowledgeCheckQuestion[]
  testType: 'post' // Only post-tests now
  onComplete: (answers: { [questionId: number]: string | string[] }, allCorrect: boolean) => void
  onSkipVideo?: () => void // Kept for interface compatibility but not used
}

export default function PrePostKnowledgeCheck({
  questions,
  testType,
  onComplete,
  onSkipVideo
}: PrePostKnowledgeCheckProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: string | string[] }>({})
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set())
  const [questionResults, setQuestionResults] = useState<{ [questionId: number]: boolean }>({})
  const [hasCompleted, setHasCompleted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const pathname = usePathname()
  const questionStartTime = useRef<number>(Date.now())
  const firstInteractionTime = useRef<number | null>(null)
  
  // Detect phase from pathname
  const phaseMatch = pathname.match(/\/phase(\d+)/)
  const phase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"
  
  // Safety check: ensure questions array exists and is not empty
  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No questions available. Please refresh the page.</p>
      </div>
    )
  }

  // Initialize sessionId
  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id")
    if (storedSessionId) {
      setSessionId(storedSessionId)
    }
  }, [])
  
  // Compute safe values - do this INSIDE the render to avoid initialization issues
  const safeIndex = Math.max(0, Math.min(currentQuestionIndex, questions.length - 1))
  const currentQuestion = questions[safeIndex]
  
  if (!currentQuestion) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Question not found. Please refresh the page.</p>
      </div>
    )
  }
  
  // All derived values computed directly without useMemo to avoid initialization order issues
  const isLastQuestion = safeIndex === questions.length - 1
  const isSelectAll = currentQuestion.isSelectAll || false
  const allQuestionsAnswered = questions.every(q => {
    const answer = selectedAnswers[q.id]
    if (q.isSelectAll) {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== ""
  })
  const allQuestionsCorrect = questions.length > 0 && questions.every(q => questionResults[q.id] === true)
  
  // Define logQuizEvent using useCallback
  const logQuizEvent = useCallback(async (eventType: string, metadata: any, sessionIdParam?: string | null) => {
    const currentSessionId = sessionIdParam || sessionId || localStorage.getItem("session_id")
    if (!currentSessionId) return

    // Stage 2 safety net: map the high-level event to the right WAL
    // target table so the row is replay-ready into Supabase's
    // specialised analytics tables.
    //   question_answered / question_changed → knowledge_check_attempts
    //   quiz_started / quiz_completed         → quiz_session_summary
    //   anything else                          → content_interaction_logs
    const walTable =
      eventType === "question_answered" || eventType === "question_changed"
        ? "knowledge_check_attempts"
        : eventType === "quiz_started" || eventType === "quiz_completed"
          ? "quiz_session_summary"
          : "content_interaction_logs"
    captureToWAL(walTable, {
      event_type: eventType,
      phase,
      component: "knowledge_check",
      test_type: testType,
      ...metadata,
    }, { sessionId: currentSessionId, eventType })

    // Existing analytics path.
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          event_type: eventType,
          phase: phase,
          component: 'knowledge_check',
          metadata: {
            test_type: testType,
            ...metadata
          }
        })
      })
    } catch (error) {
      console.error(`Failed to log ${eventType}:`, error)
    }
  }, [sessionId, phase, testType])

  // Log quiz start
  useEffect(() => {
    if (sessionId && currentQuestionIndex === 0 && questions.length > 0) {
      // Only log start once
      // We rely on sessionId being set, which happens after mount
      // and we only log if it's the first question
      const hasStarted = sessionStorage.getItem(`quiz_started_${phase}_${testType}`)
      if (!hasStarted) {
        logQuizEvent('quiz_started', {
          test_type: testType
        }, sessionId)
        sessionStorage.setItem(`quiz_started_${phase}_${testType}`, 'true')
      }
    }
  }, [sessionId, phase, testType, questions.length, logQuizEvent])
  
  // Reset timer when question changes
  useEffect(() => {
    if (questions.length > 0) {
      const validIndex = Math.max(0, Math.min(currentQuestionIndex, questions.length - 1))
      if (validIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(validIndex)
        return
      }
      questionStartTime.current = Date.now()
      firstInteractionTime.current = null
    }
  }, [currentQuestionIndex, questions.length])
  
  // Track first interaction
  useEffect(() => {
    if (!currentQuestion) return
    const questionId = currentQuestion.id
    if (selectedAnswers[questionId] && !firstInteractionTime.current) {
      firstInteractionTime.current = Date.now()
    }
  }, [selectedAnswers, currentQuestion])
  
  const handleSubmit = async () => {
    const answer = selectedAnswers[currentQuestion.id]
    if (!answer || (isSelectAll && (!Array.isArray(answer) || answer.length === 0))) return
    
    console.log('📝 Quiz answer submitted:', {
      questionId: currentQuestion.id,
      questionType: currentQuestion.questionType,
      answer: answer
    })
    
    // Check correctness
    let isCorrect: boolean
    if (isSelectAll) {
      const correctAnswers = Array.isArray(currentQuestion.correctAnswer) 
        ? currentQuestion.correctAnswer 
        : [currentQuestion.correctAnswer]
      const selectedArray = Array.isArray(answer) ? answer : [answer]
      isCorrect = correctAnswers.every(ca => selectedArray.includes(ca)) && 
                  selectedArray.every(sa => correctAnswers.includes(sa))
    } else {
      isCorrect = answer === currentQuestion.correctAnswer
    }
    
    setQuestionResults(prev => ({ ...prev, [currentQuestion.id]: isCorrect }))
    setSubmittedQuestions(prev => {
      const newSet = new Set(prev)
      newSet.add(currentQuestion.id)
      return newSet
    })
    
    const timeToAnswer = Math.round((Date.now() - questionStartTime.current) / 1000)
    const timeToFirstInteraction = firstInteractionTime.current 
      ? Math.round((firstInteractionTime.current - questionStartTime.current) / 1000)
      : null
    
    await logQuizEvent('quiz_question_answered', {
      question_id: currentQuestion.id,
      question_text: currentQuestion.question,
      question_type: currentQuestion.questionType,
      test_type: testType,
      is_select_all: isSelectAll,
      selected_answer: selectedAnswers[currentQuestion.id],
      correct_answer: currentQuestion.correctAnswer,
      is_correct: isCorrect,
      time_to_answer_seconds: timeToAnswer,
      time_to_first_interaction_seconds: timeToFirstInteraction
    }, sessionId)
    
    console.log(`${isCorrect ? '✅' : '❌'} Answer is ${isCorrect ? 'correct' : 'incorrect'}. Logged to database.`)
  }
  
  const handleNext = () => {
    if (isLastQuestion) {
      const allCorrect = questions.length > 0 && questions.every(q => questionResults[q.id] === true)
      const correctCount = questions.filter(q => questionResults[q.id] === true).length
      const incorrectCount = questions.length - correctCount
      
      logQuizEvent('quiz_completed', {
        test_type: testType,
        total_questions: questions.length,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        all_correct: allCorrect,
        total_time_seconds: Math.round((Date.now() - questionStartTime.current) / 1000)
      }, sessionId)
      
      onComplete(selectedAnswers, allCorrect)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  // Auto-complete when last question is submitted
  useEffect(() => {
    if (!currentQuestion) return
    const questionId = currentQuestion.id
    if (isLastQuestion && submittedQuestions.has(questionId) && questionResults[questionId] !== undefined && !hasCompleted) {
      const timer = setTimeout(() => {
        if (hasCompleted) return
        
        const allCorrect = questions.length > 0 && questions.every(q => questionResults[q.id] === true)
        const correctCount = questions.filter(q => questionResults[q.id] === true).length
        const incorrectCount = questions.length - correctCount
        
        setHasCompleted(true)
        
        logQuizEvent('quiz_completed', {
          test_type: testType,
          total_questions: questions.length,
          correct_answers: correctCount,
          incorrect_answers: incorrectCount,
          all_correct: allCorrect,
          total_time_seconds: Math.round((Date.now() - questionStartTime.current) / 1000)
        }, sessionId)
        
        onComplete(selectedAnswers, allCorrect)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isLastQuestion, submittedQuestions, currentQuestion, questionResults, testType, questions, selectedAnswers, onComplete, hasCompleted, logQuizEvent, sessionId])
  
  const isSubmitted = submittedQuestions.has(currentQuestion.id)
  const isCorrect = questionResults[currentQuestion.id] === true
  const selectedAnswer = selectedAnswers[currentQuestion.id]
  const selectedAnswerArray = isSelectAll && Array.isArray(selectedAnswer) ? selectedAnswer : []
  const selectedAnswerString = !isSelectAll && typeof selectedAnswer === 'string' ? selectedAnswer : ''
  const wrongAnswerFeedback = currentQuestion.feedbackForWrongAnswers?.[selectedAnswerString || '']
  
  const accent = "var(--accent-text)"
  const neutralSurface = "hsl(var(--card) / 0.78)"
  const neutralBorder = "hsl(var(--border) / 0.75)"
  const foreground = "hsl(var(--foreground))"
  const mutedText = "hsl(var(--muted-foreground))"
  
  return (
    <Card style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}>
              <HelpCircle className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: foreground }}>
                Knowledge Check {currentQuestionIndex + 1}
              </h3>
              <p className="text-sm" style={{ color: mutedText }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-2">
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "hsl(var(--muted) / 0.3)", color: mutedText }}>
            {currentQuestion.questionType === 'definition' ? 'Definition' : 'Scenario'}
          </span>
        </div>

        <p className="mb-6" style={{ color: foreground, lineHeight: '1.6' }}>{currentQuestion.question}</p>

        {isSelectAll ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = Array.isArray(selectedAnswer) && selectedAnswer.includes(option)
              const correctAnswers = Array.isArray(currentQuestion.correctAnswer) 
                ? currentQuestion.correctAnswer 
                : [currentQuestion.correctAnswer]
              const isCorrectOption = correctAnswers.includes(option)
              const showCorrect = isSubmitted && isCorrectOption
              const showWrong = isSubmitted && isSelected && !isCorrectOption
              
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-2 rounded-lg border p-3 transition-colors ${
                    showCorrect
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : showWrong
                        ? "border-red-500/50 bg-red-500/10"
                        : "hover:bg-[hsl(var(--muted)_/_0.25)]"
                  }`}
                  style={{
                    borderColor: isSubmitted ? undefined : neutralBorder,
                    backgroundColor: isSubmitted ? undefined : "hsl(var(--card) / 0.78)",
                  }}
                >
                  <Checkbox
                    id={`option-${index}`}
                    checked={isSelected}
                    disabled={isSubmitted}
                    onCheckedChange={(checked) => {
                      if (isSubmitted) return
                      const current = Array.isArray(selectedAnswers[currentQuestion.id]) 
                        ? selectedAnswers[currentQuestion.id] as string[]
                        : []
                      if (checked) {
                        setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: [...current, option] }))
                      } else {
                        setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: current.filter(a => a !== option) }))
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`option-${index}`}
                      className={`text-sm font-medium ${
                        showCorrect
                          ? "text-emerald-500"
                          : showWrong
                            ? "text-red-500"
                            : "opacity-80"
                      }`}
                      style={!isSubmitted ? { color: foreground } : undefined}
                    >
                      {option}
                    </Label>
                  </div>
                  {showCorrect && (
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  )}
                  {showWrong && (
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <RadioGroup
            value={selectedAnswerString || ""}
            onValueChange={(value) => {
              setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
            }}
            className="space-y-3"
            disabled={isSubmitted}
          >
            {currentQuestion.options.map((option, index) => {
              const isSelected = option === selectedAnswerString
              const isCorrectOption = option === currentQuestion.correctAnswer
              const showCorrect = isSubmitted && isCorrectOption
              const showWrong = isSubmitted && isSelected && !isCorrectOption
              
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-2 rounded-lg border p-3 transition-colors ${
                    showCorrect
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : showWrong
                        ? "border-red-500/50 bg-red-500/10"
                        : "hover:bg-[hsl(var(--muted)_/_0.25)]"
                  }`}
                  style={{
                    borderColor: isSubmitted ? undefined : neutralBorder,
                    backgroundColor: isSubmitted ? undefined : "hsl(var(--card) / 0.78)",
                  }}
                >
                  <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor={`option-${index}`}
                      className={`text-sm font-medium ${
                        showCorrect
                          ? "text-emerald-500"
                          : showWrong
                            ? "text-red-500"
                            : "opacity-80"
                      }`}
                      style={!isSubmitted ? { color: foreground } : undefined}
                    >
                      {option}
                    </Label>
                  </div>
                  {showCorrect && (
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  )}
                  {showWrong && (
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </RadioGroup>
        )}

        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              border: `1px solid ${isCorrect ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}
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
                <p className="text-muted-foreground mt-1">
                  {isCorrect ? currentQuestion.explanation : (wrongAnswerFeedback || currentQuestion.explanation)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isSubmitted && isLastQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-4 p-4 rounded-lg text-center"
            style={{
              backgroundColor: "hsl(var(--muted) / 0.3)",
              border: `1px solid ${neutralBorder}`
            }}
          >
            <CheckCircle className="h-6 w-6 mx-auto mb-2" style={{ color: accent }} />
            <p className="font-semibold" style={{ color: accent }}>✓ All questions completed!</p>
            <p className="text-sm" style={{ color: mutedText }}>
              {allQuestionsCorrect ? "Perfect score! Great work!" : "Review feedback above to improve your understanding."}
            </p>
          </motion.div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div>
            {!isSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer || (isSelectAll && selectedAnswerArray.length === 0)}
                className="font-medium"
                title="Submit your answer"
                style={{
                  background: "linear-gradient(135deg, #d8b26f, #e6c98c)",
                  color: "#fff",
                  opacity: (!selectedAnswer || (isSelectAll && selectedAnswerArray.length === 0)) ? 0.5 : 1
                }}
              >
                Submit Answer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              !isLastQuestion && (
                <Button
                  onClick={handleNext}
                  className="font-medium"
                  title="Go to the next question"
                  style={{
                    background: "linear-gradient(135deg, #d8b26f, #e6c98c)",
                    color: "#fff"
                  }}
                >
                  Next Question <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
