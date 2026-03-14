"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo, ChevronLeft, ChevronRight } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedShortTermGoal from "@/components/guided-short-term-goal"

export default function ShortTermGoalPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

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
    if (!completedTasks.includes('short_term_goals')) {
      completedTasks.push('short_term_goals');
      localStorage.setItem("solbot_phase4_completed_tasks", JSON.stringify(completedTasks));
    }
    setIsComplete(true);
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
                <ListTodo className="h-8 w-8" style={{ color: accent }} />
                <span>Set Your SMART Objectives</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[620px] p-3 text-sm" style={{ color: mutedText }}>
              {userId ? (
                <GuidedShortTermGoal
                  userId={userId}
                  phase="4"
                  component="short_term_goals"
                  onComplete={handleComplete}
                  height="100%"
                />
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
          
          {isComplete && (
            <div className="flex justify-center mt-6">
              <Button
                className="px-8 py-3 rounded-lg font-semibold"
                style={primaryButtonStyle}
                onClick={() => router.push('/phase4/tasks')}
              >
                Continue to Next Task <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

