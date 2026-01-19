"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import ModuleBar from "@/components/module-bar"
import GuidedMonitoring from "@/components/guided-monitoring"
import InstructionGuide from "@/components/instruction-guide"
import PostTaskAssessment from "@/components/post-task-assessment"
import { phaseInstructions, comprehensivePostTaskQuestions, sampleAnswers } from "@/lib/post-task-questions"

export default function Phase5ChatContent() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const [isComplete, setIsComplete] = useState(false)
  const [showInstruction, setShowInstruction] = useState(true)
  const [chatComplete, setChatComplete] = useState(false)
  const [showPostTask, setShowPostTask] = useState(false)
  
  // Load user data on component mount
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem("user_id")
      const storedSessionId = localStorage.getItem("session_id")
      
      if (storedUserId && storedSessionId) {
        setUserId(storedUserId)
      } else {
        // If there's no session, redirect to intro
        console.warn("No session found, redirecting to intro.")
        router.push('/intro')
        return
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      // Handle cases where localStorage might be blocked or unavailable.
      router.push('/intro')
    }
  }, [router])

  const handlePhaseComplete = (nextPhase?: string) => {
    setIsComplete(true);
    setChatComplete(true);
    setShowPostTask(true);
  }
  
  const handlePostTaskComplete = (answers: { [questionId: string]: string }) => {
    router.push("/summary")
  }
  
  const handleStartChat = () => {
    setShowInstruction(false)
  }

  const accent = "#d8b26f"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.8)"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: `linear-gradient(135deg, ${accent}, #e6c98c)`,
    color: "#1f1408",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{ background: canvasGradient, color: "hsl(var(--foreground))" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(140%_120%_at_80%_20%,rgba(0,0,0,0.04),transparent),radial-gradient(160%_140%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={5} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4" style={{ backgroundColor: "hsl(var(--card) / 0.9)", borderColor: neutralBorder }}>
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <LineChart className="h-7 w-7 mr-2" style={{ color: accent }} />
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: accent }}>
              Monitor Progress & Adapt Strategies
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <LineChart className="h-8 w-8" style={{ color: accent }} />
                <span style={{ color: accent }}>
                  Create Your Monitoring System
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="min-h-[700px] p-2">
              {userId ? (
                <>
                  {showInstruction && !chatComplete && (
                    <div className="space-y-4">
                      <InstructionGuide
                        title={phaseInstructions.phase5.title}
                        instructions={phaseInstructions.phase5.instructions}
                        tips={phaseInstructions.phase5.tips}
                        examples={phaseInstructions.phase5.examples}
                        phase="phase5"
                      />
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={handleStartChat}
                          style={primaryButtonStyle}
                        >
                          Start Monitoring Exercise
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {!showInstruction && !showPostTask && (
                    <GuidedMonitoring
                      userId={userId}
                      phase="phase5"
                      component="progress_monitoring"
                      onComplete={handlePhaseComplete}
                      height="100%"
                    />
                  )}
                  {showPostTask && (
                    <PostTaskAssessment
                      questions={comprehensivePostTaskQuestions.filter(q => 
                        ['q8_monitoring_integration', 'q9_adaptation_transfer', 'q10_integration', 'q11_strategy_combination', 'q12_metacognition'].includes(q.id)
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
              style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
              onClick={() => router.push('/phase5')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Instructions
            </Button>
          </div>
          
          {/* Centered Continue Button */}
          {chatComplete && !showPostTask && (
            <div className="flex justify-center mt-6">
              <Button
                className="px-8 py-3 rounded-lg font-semibold"
                style={primaryButtonStyle}
                onClick={() => setShowPostTask(true)}
              >
                Continue to Post-Task Assessment <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 