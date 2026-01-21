"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, HelpCircle, ArrowRight, BookOpen } from "lucide-react"
import { usePathname } from "next/navigation"
import type { KnowledgeCheckQuestion } from "@/lib/knowledge-check-questions"

interface PrePostKnowledgeCheckProps {
  questions: KnowledgeCheckQuestion[]
  testType: 'pre' | 'post'
  onComplete: (answers: { [questionId: number]: string }, allCorrect: boolean) => void
  onSkipVideo?: () => void // For pre-test: if 2/2 correct, can skip video
}

export default function PrePostKnowledgeCheck({
  questions,
  testType,
  onComplete,
  onSkipVideo
}: PrePostKnowledgeCheckProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: string }>({})
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set())
  const [questionResults, setQuestionResults] = useState<{ [questionId: number]: boolean }>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const pathname = usePathname()
  const questionStartTime = useRef<number>(Date.now())
  const firstInteractionTime = useRef<number | null>(null)
  
  // Detect phase from pathname
  const phaseMatch = pathname.match(/\/phase(\d+)/)
  const phase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"
  
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const allQuestionsAnswered = questions.every(q => selectedAnswers[q.id])
  const allQuestionsCorrect = questions.length > 0 && questions.every(q => questionResults[q.id] === true)
  
  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id")
    if (storedSessionId) {
      setSessionId(storedSessionId)
      
      // Log test started
      if (currentQuestionIndex === 0) {
        logQuizEvent('quiz_started', {
          test_type: testType
        })
      }
    }
  }, [currentQuestionIndex, testType])
  
  useEffect(() => {
    questionStartTime.current = Date.now()
    firstInteractionTime.current = null
  }, [currentQuestionIndex])
  
  useEffect(() => {
    if (selectedAnswers[currentQuestion.id] && !firstInteractionTime.current) {
      firstInteractionTime.current = Date.now()
    }
  }, [selectedAnswers, currentQuestion.id])
  
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
          metadata: {
            test_type: testType,
            ...metadata
          }
        })
      })
    } catch (error) {
      console.error(`Failed to log ${eventType}:`, error)
    }
  }
  
  const handleSubmit = async () => {
    if (!selectedAnswers[currentQuestion.id]) return
    
    const isCorrect = selectedAnswers[currentQuestion.id] === currentQuestion.correctAnswer
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
      selected_answer: selectedAnswers[currentQuestion.id],
      correct_answer: currentQuestion.correctAnswer,
      is_correct: isCorrect,
      time_to_answer_seconds: timeToAnswer,
      time_to_first_interaction_seconds: timeToFirstInteraction
    })
    
    // If this is pre-test and 2/2 correct, offer to skip video
    if (testType === 'pre' && isLastQuestion && allQuestionsCorrect && isCorrect) {
      // Wait a moment to show feedback, then check if all correct
      setTimeout(() => {
        if (questions.every(q => questionResults[q.id] === true)) {
          // All questions correct - can skip video
        }
      }, 1000)
    }
  }
  
  const handleNext = () => {
    if (isLastQuestion) {
      // All questions completed
      const allCorrect = questions.length > 0 && questions.every(q => questionResults[q.id] === true)
      
      // Log quiz completion with correct event type
      const correctCount = questions.filter(q => questionResults[q.id] === true).length
      const incorrectCount = questions.length - correctCount
      
      logQuizEvent('quiz_completed', {
        test_type: testType,
        total_questions: questions.length,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        all_correct: allCorrect,
        total_time_seconds: Math.round((Date.now() - questionStartTime.current) / 1000)
      })
      
      // Only call onComplete if not skipping video (skip video will be handled separately)
      if (!(testType === 'pre' && allCorrect && onSkipVideo)) {
        onComplete(selectedAnswers, allCorrect)
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  const handleSkipVideoAndComplete = () => {
    const allCorrect = questions.length > 0 && questions.every(q => questionResults[q.id] === true)
    if (onSkipVideo) {
      onSkipVideo()
    }
    onComplete(selectedAnswers, allCorrect)
  }
  
  const handleWatchVideoAnyway = () => {
    const allCorrect = questions.length > 0 && questions.every(q => questionResults[q.id] === true)
    onComplete(selectedAnswers, allCorrect)
  }
  
  const isSubmitted = submittedQuestions.has(currentQuestion.id)
  const isCorrect = questionResults[currentQuestion.id] === true
  const selectedAnswer = selectedAnswers[currentQuestion.id]
  const wrongAnswerFeedback = currentQuestion.feedbackForWrongAnswers?.[selectedAnswer || '']
  
  const accent = "#d8b26f"
  const neutralSurface = "hsl(var(--card) / 0.9)"
  const neutralBorder = "hsl(var(--border) / 0.75)"
  const foreground = "hsl(var(--foreground))"
  const mutedText = "hsl(var(--muted-foreground))"
  
  return (
    <Card style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}>
              {testType === 'pre' ? <BookOpen className="h-5 w-5" style={{ color: accent }} /> : <HelpCircle className="h-5 w-5" style={{ color: accent }} />}
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: foreground }}>
                {testType === 'pre' ? 'Pre-Test' : 'Knowledge Check'} {currentQuestionIndex + 1}
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

        <RadioGroup
          value={selectedAnswer || ""}
          onValueChange={(value) => {
            setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
          }}
          className="space-y-3"
          disabled={isSubmitted}
        >
          {currentQuestion.options.map((option, index) => {
            const isSelected = option === selectedAnswer
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
                      : "border-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                }`}
                style={{
                  borderColor: showCorrect 
                    ? "hsl(142 71% 45% / 0.5)" 
                    : showWrong 
                      ? "hsl(0 84% 60% / 0.5)"
                      : neutralBorder,
                  backgroundColor: showCorrect
                    ? "hsl(142 71% 45% / 0.1)"
                    : showWrong
                      ? "hsl(0 84% 60% / 0.1)"
                      : "transparent"
                }}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor={`option-${index}`}
                    className={`text-sm font-medium cursor-pointer ${
                      showCorrect
                        ? "text-emerald-700 dark:text-emerald-400"
                        : showWrong
                          ? "text-red-700 dark:text-red-400"
                          : "text-foreground"
                    }`}
                    style={{ color: showCorrect ? "hsl(142 71% 35%)" : showWrong ? "hsl(0 84% 50%)" : foreground }}
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
              <div className="flex-1">
                <h4 className={`font-bold mb-2 ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                  {isCorrect ? "Correct!" : "Not quite right"}
                </h4>
                {wrongAnswerFeedback && (
                  <p className="text-sm mb-2" style={{ color: foreground, opacity: 0.9 }}>
                    <strong>Why this answer isn't quite right:</strong> {wrongAnswerFeedback}
                  </p>
                )}
                <p className="text-sm" style={{ color: foreground, opacity: 0.9 }}>
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div>
            {!isSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                style={{
                  background: `linear-gradient(135deg, ${accent}, #e6c98c)`,
                  color: "#1f1408",
                  opacity: selectedAnswer ? 1 : 0.5
                }}
              >
                Submit Answer
              </Button>
            ) : null}
          </div>
          
          {isSubmitted && (
            <Button
              onClick={handleNext}
              style={{
                background: `linear-gradient(135deg, ${accent}, #e6c98c)`,
                color: "#1f1408"
              }}
              className="flex items-center gap-2"
            >
              {isLastQuestion
                ? (testType === 'pre' && allQuestionsCorrect && onSkipVideo ? 'Skip Video & Continue' : 'Complete')
                : 'Next Question'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Show skip video option for pre-test if all questions correct */}
        {testType === 'pre' && isLastQuestion && isSubmitted && allQuestionsCorrect && onSkipVideo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: `1px solid ${accent}`,
              backgroundColor: "hsl(var(--muted) / 0.3)"
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: foreground }}>
              🎉 Great job! You got all questions correct!
            </p>
            <p className="text-sm mb-3" style={{ color: mutedText }}>
              Since you already understand these concepts, you can skip the video and go straight to the next section, or watch it anyway for a review.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSkipVideoAndComplete}
                variant="outline"
                style={{ borderColor: accent, color: accent }}
              >
                Skip Video
              </Button>
              <Button
                onClick={handleWatchVideoAnyway}
                style={{
                  background: `linear-gradient(135deg, ${accent}, #e6c98c)`,
                  color: "#1f1408"
                }}
              >
                Watch Video Anyway
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
