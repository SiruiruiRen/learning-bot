"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ChevronLeft, ChevronRight } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedLearningObjective from "@/components/guided-learning-objective"
import { PhaseNavigationButton } from "@/components/phase-navigation-button"
import { phaseInstructions } from "@/lib/post-task-questions"

export default function Phase2ChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [chatComplete, setChatComplete] = useState(false)
  // const [showPostTask, setShowPostTask] = useState(false) - Removed

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

  const handlePhaseComplete = () => {
    setChatComplete(true)
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
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
                  Define Your Learning Objective
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[700px] p-2">
              {userId ? (
                <>
                  <GuidedLearningObjective
                    userId={userId}
                    phase="2"
                    onComplete={handlePhaseComplete}
                    height="100%"
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Loading session...</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="outline"
              className="border"
              style={{ borderColor: neutralBorder, color: mutedText }}
              onClick={() => router.push('/phase2')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Instructions
            </Button>
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