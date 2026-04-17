"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ChevronLeft, Lightbulb } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedLearningObjective from "@/components/guided-learning-objective"
import StaticGuidedActivity from "@/components/static-guided-activity"
import { PhaseNavigationButton } from "@/components/phase-navigation-button"
import { useCondition } from "@/hooks/useCondition"
import { PHASE2_STATIC_QUESTIONS } from "@/lib/static-condition-data"

export default function Phase2ChatPage() {
  const router = useRouter()
  const condition = useCondition()
  const [userId, setUserId] = useState<string | null>(null)
  const [chatComplete, setChatComplete] = useState(false)

  const accent = "var(--accent-text)"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
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
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
                  Define Your Learning Objective
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[420px] p-2">
              <div
                className="flex items-start gap-3 p-3 mb-3 rounded-lg border-l-4"
                style={{
                  borderLeftColor: "#d8b26f",
                  backgroundColor: "hsl(var(--muted) / 0.25)",
                }}
              >
                <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#d8b26f" }} />
                <p className="text-sm text-muted-foreground">
                  {condition === "bot" ? (
                    <>Complete each guided question, then click <strong>&quot;Get AI Score &amp; Feedback&quot;</strong> to receive your score. You can revise your answers and request feedback as many times as you like. When you&apos;re satisfied, click <strong>&ldquo;Submit Final Version&rdquo;</strong> to continue.</>
                  ) : (
                    <>Answer each question in your own words first, then view the sample answer to compare. Mark each question as done when you&apos;re satisfied, then submit.</>
                  )}
                </p>
              </div>
              {userId ? (
                condition === "bot" ? (
                  <GuidedLearningObjective
                    userId={userId}
                    phase="2"
                    phaseNumber={2}
                    onComplete={() => setChatComplete(true)}
                    height="100%"
                  />
                ) : (
                  <StaticGuidedActivity
                    userId={userId}
                    phase="phase2"
                    phaseNumber={2}
                    component="learning_objectives"
                    questions={PHASE2_STATIC_QUESTIONS}
                    onComplete={() => setChatComplete(true)}
                    height="100%"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Loading session...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 mt-4">
            {!chatComplete && (
              <Button
                variant="outline"
                size="sm"
                className="border text-xs opacity-75 hover:opacity-100"
                style={{ borderColor: neutralBorder, color: mutedText }}
                onClick={() => { if (window.confirm('Go back? Any unsaved progress will be lost.')) router.push('/phase2'); }}
                title="Return to the instructions page"
              >
                <ChevronLeft className="h-3 w-3 mr-2" />
                Back to Instructions
              </Button>
            )}
            {chatComplete && (
              <PhaseNavigationButton
                nextPhase={3}
                onNavigate={() => router.push('/phase3')}
                style={primaryButtonStyle}
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
