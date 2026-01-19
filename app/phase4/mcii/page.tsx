"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ChevronLeft, ChevronRight } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedMCII from "@/components/guided-mcii"
import InstructionGuide from "@/components/instruction-guide"
import PostTaskAssessment from "@/components/post-task-assessment"
import { phaseInstructions, comprehensivePostTaskQuestions, sampleAnswers } from "@/lib/post-task-questions"

export default function MCIIPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
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
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      console.warn("No user_id found, redirecting to intro.")
      router.push('/intro')
    }
  }, [router])

  const handleComplete = () => {
    const savedProgress = localStorage.getItem("solbot_phase4_completed_tasks");
    const completedTasks = savedProgress ? JSON.parse(savedProgress) : [];
    if (!completedTasks.includes('mcii')) {
      completedTasks.push('mcii');
      localStorage.setItem("solbot_phase4_completed_tasks", JSON.stringify(completedTasks));
    }
    setIsComplete(true);
    setChatComplete(true);
    setShowPostTask(true);
  }
  
  const handlePostTaskComplete = (answers: { [questionId: string]: string }) => {
    router.push("/phase5")
  }
  
  const handleStartChat = () => {
    setShowInstruction(false)
  }

  return (
    <div className="min-h-screen text-foreground" style={{ background: canvasGradient }}>
      <div className="container mx-auto px-4 py-8">
        <ModuleBar currentPhase={4} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-4xl mx-auto mt-10"
        >
          <Card className="shadow-sm" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Target className="h-8 w-8" style={{ color: accent }} />
                <span>MCII: Mental Contrasting with Implementation Intentions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[620px] p-3 text-sm" style={{ color: mutedText }}>
              {userId ? (
                <>
                  {showInstruction && !chatComplete && (
                    <div className="space-y-4">
                      <InstructionGuide
                        title={phaseInstructions.phase4.title}
                        instructions={phaseInstructions.phase4.instructions}
                        tips={phaseInstructions.phase4.tips}
                        examples={phaseInstructions.phase4.examples}
                        phase="phase4"
                      />
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={handleStartChat}
                          style={primaryButtonStyle}
                        >
                          Start MCII Exercise
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {!showInstruction && !showPostTask && (
                    <GuidedMCII
                      userId={userId}
                      phase="4"
                      component="mcii"
                      onComplete={handleComplete}
                      height="100%"
                    />
                  )}
                  {showPostTask && (
                    <PostTaskAssessment
                      questions={comprehensivePostTaskQuestions.filter(q => 
                        ['q6_goal_setting', 'q7_mcii'].includes(q.id)
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
              style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
              onClick={() => router.push('/phase4/tasks')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </div>
          
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
