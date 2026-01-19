"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ChevronLeft, ChevronRight } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedLearningObjective from "@/components/guided-learning-objective"
import InstructionGuide from "@/components/instruction-guide"
import PostTaskAssessment from "@/components/post-task-assessment"
import { phaseInstructions, comprehensivePostTaskQuestions, sampleAnswers } from "@/lib/post-task-questions"

export default function Phase2ChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [showInstruction, setShowInstruction] = useState(true)
  const [chatComplete, setChatComplete] = useState(false)
  const [showPostTask, setShowPostTask] = useState(false)

  const accent = "#d8b26f"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.8)"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: `linear-gradient(135deg, ${accent}, #e6c98c)`,
    color: "#1f1408",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id")
    const storedSessionId = localStorage.getItem("session_id")
    
    if (storedUserId && storedSessionId) {
      setUserId(storedUserId)
    } else {
      console.warn("No session found, redirecting to intro.")
      router.push('/intro')
    }
  }, [router])

  const handlePhaseComplete = () => {
    setChatComplete(true)
    setShowPostTask(true)
  }
  
  const handlePostTaskComplete = (answers: { [questionId: string]: string }) => {
    // Log completion and proceed to next phase
    router.push("/phase3")
  }
  
  const handleStartChat = () => {
    setShowInstruction(false)
  }

  return (
    <div
      className="min-h-screen text-foreground py-8"
      style={{ background: canvasGradient }}
    >
      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={2} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <Card className="border shadow-xl mb-6" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Target className="h-8 w-8" style={{ color: accent }} />
                <span className="bg-gradient-to-r from-[#d8b26f] to-[#e6c98c] bg-clip-text text-transparent">
                  Define Your Learning Objective
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[700px] p-2">
              {userId ? (
                <>
                  {showInstruction && !chatComplete && (
                    <div className="space-y-4">
                      <InstructionGuide
                        title={phaseInstructions.phase2.title}
                        instructions={phaseInstructions.phase2.instructions}
                        tips={phaseInstructions.phase2.tips}
                        examples={phaseInstructions.phase2.examples}
                        phase="phase2"
                      />
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={handleStartChat}
                          style={primaryButtonStyle}
                        >
                          Start Chat with SoL2LBot
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {!showInstruction && !showPostTask && (
                    <GuidedLearningObjective
                      userId={userId}
                      phase="2"
                      onComplete={handlePhaseComplete}
                      height="100%"
                    />
                  )}
                  {showPostTask && (
                    <PostTaskAssessment
                      questions={comprehensivePostTaskQuestions.filter(q => 
                        ['q1_task_analysis', 'q2_resources'].includes(q.id)
                      )}
                      onComplete={handlePostTaskComplete}
                      showSampleAnswers={false}
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Loading session...</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between mt-4">
             <Button
              variant="outline"
              className="border"
              style={{ borderColor: neutralBorder, color: mutedText }}
              onClick={() => router.push('/phase2')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Instructions
            </Button>
          </div>
          {chatComplete && !showPostTask && (
            <div className="flex justify-center mt-6">
              <Button
                className="font-semibold"
                style={primaryButtonStyle}
                onClick={() => setShowPostTask(true)}
              >
                Continue to Post-Task Assessment
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 