"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { HelpCircle, ArrowRight, BookOpen, CheckCircle } from "lucide-react"
import { usePathname } from "next/navigation"

interface PostTaskQuestion {
  id: string
  question: string
  hint?: string
  placeholder?: string
  required: boolean
  category: 'application' | 'reflection' | 'synthesis' | 'metacognition'
}

interface PostTaskAssessmentProps {
  questions: PostTaskQuestion[]
  onComplete: (answers: { [questionId: string]: string }) => void
  showSampleAnswers?: boolean // For control group: show sample answers
  sampleAnswers?: { [questionId: string]: string } // Sample answers for comparison
}

export default function PostTaskAssessment({
  questions,
  onComplete,
  showSampleAnswers = false,
  sampleAnswers = {}
}: PostTaskAssessmentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({})
  const [showSample, setShowSample] = useState<{ [questionId: string]: boolean }>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const pathname = usePathname()
  const questionStartTime = useRef<number>(Date.now())
  
  // Detect phase from pathname
  const phaseMatch = pathname.match(/\/phase(\d+)/)
  const phase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"
  
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const allRequiredAnswered = questions
    .filter(q => q.required)
    .every(q => answers[q.id] && answers[q.id].trim().length > 0)
  
  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id")
    if (storedSessionId) {
      setSessionId(storedSessionId)
      
      // Log assessment started
      if (currentQuestionIndex === 0) {
        logAssessmentEvent('post_task_assessment_started', {})
      }
    }
  }, [currentQuestionIndex])
  
  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [currentQuestionIndex])
  
  const logAssessmentEvent = async (eventType: string, metadata: any) => {
    if (!sessionId) return
    
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          phase: phase,
          component: 'post_task_assessment',
          metadata: {
            ...metadata,
            show_sample_answers: showSampleAnswers
          }
        })
      })
    } catch (error) {
      console.error(`Failed to log ${eventType}:`, error)
    }
  }
  
  const handleNext = async () => {
    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000)
    
    await logAssessmentEvent('post_task_question_answered', {
      question_id: currentQuestion.id,
      question_text: currentQuestion.question,
      question_category: currentQuestion.category,
      answer_length: answers[currentQuestion.id]?.length || 0,
      time_spent_seconds: timeSpent,
      has_sample_answer: showSampleAnswers && sampleAnswers[currentQuestion.id] ? true : false,
      viewed_sample: showSample[currentQuestion.id] || false
    })
    
    if (isLastQuestion) {
      // All questions completed
      await logAssessmentEvent('post_task_assessment_completed', {
        total_questions: questions.length,
        answered_questions: Object.keys(answers).length,
        total_time_seconds: timeSpent
      })
      onComplete(answers)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  const handleViewSample = async (questionId: string) => {
    setShowSample(prev => ({ ...prev, [questionId]: true }))
    
    await logAssessmentEvent('sample_answer_viewed', {
      question_id: questionId,
      time_spent_seconds: Math.round((Date.now() - questionStartTime.current) / 1000)
    })
  }
  
  const accent = "#d8b26f"
  const neutralSurface = "hsl(var(--card) / 0.9)"
  const neutralBorder = "hsl(var(--border) / 0.75)"
  const foreground = "hsl(var(--foreground))"
  const mutedText = "hsl(var(--muted-foreground))"
  
  const categoryLabels = {
    application: 'Application',
    reflection: 'Reflection',
    synthesis: 'Synthesis',
    metacognition: 'Metacognitive Thinking'
  }
  
  const categoryColors = {
    application: "hsl(142 71% 45%)",
    reflection: "hsl(217 91% 60%)",
    synthesis: "hsl(35 91% 55%)",
    metacognition: "hsl(280 67% 60%)"
  }
  
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
                Post-Task Assessment {currentQuestionIndex + 1}
              </h3>
              <p className="text-sm" style={{ color: mutedText }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-2">
          <span 
            className="text-xs px-2 py-1 rounded font-medium"
            style={{ 
              backgroundColor: `${categoryColors[currentQuestion.category]}20`,
              color: categoryColors[currentQuestion.category],
              border: `1px solid ${categoryColors[currentQuestion.category]}40`
            }}
          >
            {categoryLabels[currentQuestion.category]}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-base font-medium mb-2" style={{ color: foreground, lineHeight: '1.6' }}>
            {currentQuestion.question}
          </p>
          {currentQuestion.hint && (
            <p className="text-sm italic" style={{ color: mutedText }}>
              💡 {currentQuestion.hint}
            </p>
          )}
        </div>

        <Textarea
          value={answers[currentQuestion.id] || ""}
          onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
          placeholder={currentQuestion.placeholder || "Type your answer here..."}
          className="min-h-[150px] mb-4"
          style={{
            backgroundColor: "hsl(var(--card))",
            borderColor: neutralBorder,
            color: foreground
          }}
        />
        
        {currentQuestion.required && !answers[currentQuestion.id]?.trim() && (
          <p className="text-xs mb-4" style={{ color: "hsl(0 84% 60%)" }}>
            * This question is required
          </p>
        )}
        
        {/* Show sample answer option (for control group or after user answers) */}
        {showSampleAnswers && sampleAnswers[currentQuestion.id] && (
          <div className="mb-4">
            {!showSample[currentQuestion.id] ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSample(currentQuestion.id)}
                style={{ borderColor: accent, color: accent }}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                View Sample Answer
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: "hsl(var(--muted) / 0.3)", 
                  borderColor: accent 
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 mt-0.5" style={{ color: accent }} />
                  <h4 className="text-sm font-semibold" style={{ color: accent }}>
                    Sample Answer
                  </h4>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: foreground }}>
                  {sampleAnswers[currentQuestion.id]}
                </p>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: neutralBorder }}>
                  <p className="text-xs font-medium mb-2" style={{ color: foreground }}>
                    Compare your answer:
                  </p>
                  <Textarea
                    value={answers[`${currentQuestion.id}_comparison`] || ""}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [`${currentQuestion.id}_comparison`]: e.target.value }))}
                    placeholder="How does your answer compare to the sample? What did you include or miss?"
                    className="min-h-[80px] text-sm"
                    style={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: neutralBorder,
                      color: foreground
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <div>
            {currentQuestionIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                style={{ borderColor: neutralBorder, color: foreground }}
              >
                Previous
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleNext}
            disabled={currentQuestion.required && !answers[currentQuestion.id]?.trim()}
            style={{
              background: `linear-gradient(135deg, ${accent}, #e6c98c)`,
              color: "#1f1408",
              opacity: (currentQuestion.required && !answers[currentQuestion.id]?.trim()) ? 0.5 : 1
            }}
            className="flex items-center gap-2"
          >
            {isLastQuestion ? 'Complete Assessment' : 'Next Question'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
