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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={phaseId} />
        
        {/* Fixed Phase Title that stays visible when scrolling */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-indigo-500/20 py-3 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center">
              <Target className="h-6 w-6 text-indigo-500 mr-2" />
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text">
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
              variant="ghost"
              className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/50"
              onClick={() => router.push("/phase5")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Phase 5
            </Button>
          </div>
          
          <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6 max-w-4xl mx-auto w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-bold">
                <BarChart className="h-7 w-7 text-indigo-500" />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                  Monitoring & Adaptation
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 mb-6">
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