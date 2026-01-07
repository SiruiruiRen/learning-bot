"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ArrowLeft, BarChart } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedMonitoringAdaptation from "@/components/guided-monitoring-adaptation"

export default function MonitoringAdaptationPage() {
  const router = useRouter()
  const phaseId = 5
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  
  // Load user data on component mount
  useEffect(() => {
    // Load user name from localStorage
    const storedName = localStorage.getItem("solbot_user_name")
    if (storedName) {
      setUserName(storedName)
    }
    
    // Load userId from localStorage
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setUserId(storedUserId)
    }
  }, [])

  const handlePhaseComplete = (nextPhase?: string) => {
    // If no nextPhase provided, default to summary page
    if (!nextPhase) {
      router.push("/summary");
      return;
    }
    
    // If it's an absolute path (starts with /), use it directly
    if (nextPhase.startsWith("/")) {
      router.push(nextPhase);
      return;
    }
    
    // Otherwise, handle relative paths
    if (nextPhase.startsWith("phase")) {
      router.push(`/${nextPhase}`);
    } else {
      router.push(`/phase${nextPhase}`);
    }
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

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={phaseId} />
        
        {/* Fixed Phase Title that stays visible when scrolling */}
        <div className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4" style={{ backgroundColor: "hsl(var(--card) / 0.9)", borderColor: neutralBorder }}>
          <div className="container mx-auto">
            <div className="flex items-center justify-center">
              <BarChart className="h-6 w-6 mr-2" style={{ color: accent }} />
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: accent }}>
                Monitoring & Adaptation
              </h2>
            </div>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="flex justify-between mb-4">
            <Button
              variant="outline"
              style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
              onClick={() => router.push("/phase5")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Phase 5
            </Button>
          </div>
          
          <Card className="shadow-xl mb-6 max-w-4xl mx-auto w-full" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-bold">
                <BarChart className="h-7 w-7" style={{ color: accent }} />
                <span style={{ color: accent }}>
                  Monitoring & Adaptation
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="mb-6" style={{ color: mutedText }}>
                <p>
                  {userName ? `Excellent job, ${userName}!` : "Excellent job!"} In this final phase, we'll create a system for monitoring your progress and adapting your strategy as needed. This will help you stay on track with your learning goals and make adjustments when necessary.
                </p>
              </div>

              <GuidedMonitoringAdaptation 
                userId={userId}
                phase="phase5" 
                height="750px"
                onComplete={handlePhaseComplete}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 