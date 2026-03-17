"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import ModuleBar from "@/components/module-bar"
import GuidedMonitoring from "@/components/guided-monitoring"
import InstructionGuide from "@/components/instruction-guide"
import { PhaseNavigationButton } from "@/components/phase-navigation-button"
import { phaseInstructions } from "@/lib/post-task-questions"

export default function Phase5ChatContent() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const [showInstruction, setShowInstruction] = useState(true)
  const [chatComplete, setChatComplete] = useState(false)

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem("user_id")
      const storedSessionId = localStorage.getItem("session_id")

      if (storedUserId && storedSessionId) {
        setUserId(storedUserId)
      } else {
        console.warn("No session found, redirecting to intro.")
        router.push('/intro')
        return
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      router.push('/intro')
    }
  }, [router])

  const accent = "var(--accent-text)"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
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

      <ModuleBar currentPhase={5} />

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
                  {showInstruction && (
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
                          onClick={() => setShowInstruction(false)}
                          style={primaryButtonStyle}
                          title="Start the monitoring exercise"
                        >
                          Start Monitoring Exercise
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {!showInstruction && (
                    <>
                    <div
                      className="flex items-start gap-3 p-3 mb-3 rounded-lg border-l-4"
                      style={{
                        borderLeftColor: "#d8b26f",
                        backgroundColor: "hsl(var(--muted) / 0.25)",
                      }}
                    >
                      <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#d8b26f" }} />
                      <p className="text-sm text-muted-foreground">
                        Complete each guided question, then click <strong>&quot;Get AI Score &amp; Feedback&quot;</strong> to receive your score.
                        You can revise your answers and request feedback as many times as you like.
                        When you&apos;re satisfied, click <strong>&ldquo;Submit Final Version&rdquo;</strong> to continue.
                      </p>
                    </div>
                    <GuidedMonitoring
                      userId={userId}
                      phase="phase5"
                      phaseNumber={5}
                      component="progress_monitoring"
                      onComplete={() => setChatComplete(true)}
                      height="calc(100% - 80px)"
                    />
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Loading session...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 mt-4">
            {!chatComplete && !showInstruction && (
              <Button
                variant="outline"
                style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                onClick={() => { if (window.confirm('Go back? Any unsaved progress will be lost.')) router.push('/phase5'); }}
                title="Return to the instructions page"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Instructions
              </Button>
            )}
            {chatComplete && (
              <PhaseNavigationButton
                nextPhase={6}
                onNavigate={() => router.push('/phase6')}
                style={primaryButtonStyle}
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
