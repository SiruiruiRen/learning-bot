"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import SolBotChat from "@/components/solbot-chat"
import { getNextPhase } from "@/lib/phase-data"

// Add a message cleaning function to strip any possible score text
const cleanScoresFromMessage = (message: string): string => {
  if (!message || typeof message !== 'string') return message || '';
  
  // Remove evaluation scores in square brackets
  const patterns = [
    /\[\s*(?:Note|Evaluation)[^\]]+\]/g,
    /\[\s*(?:Alignment|Timeframe|Measurability|Average Score|Overall Score)[^\]]+\]/g,
    /\[\s*(?:score|Score|evaluation|Evaluation|support level|SUPPORT|HIGH|MEDIUM|LOW)[^\]]+\]/gi,
    /\[.*?\d+\.\d+.*?\]/g, // Catch anything with a decimal number in brackets
    /\[.*?(?:providing|Providing).*?support.*?\]/gi
  ];
  
  let cleanedMessage = message;
  patterns.forEach(pattern => {
    cleanedMessage = cleanedMessage.replace(pattern, '');
  });
  
  return cleanedMessage.trim();
};

export default function Phase5ChatContent() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  
  // Load user data on component mount
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem("userId")
      if (storedUserId) {
        setUserId(storedUserId)
      } else {
        // Generate a fallback ID if not in localStorage
        const fallbackId: string = `user-${Math.random().toString(36).substring(2, 9)}`
        setUserId(fallbackId)
        localStorage.setItem("userId", fallbackId)
      }
      
      const storedName = localStorage.getItem("solbot_user_name")
      if (storedName) {
        setUserName(storedName)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      // Generate a temporary ID that won't be persisted
      setUserId(`temp-${Math.random().toString(36).substring(2, 9)}` as any)
    }
  }, [])

  // Send message handler
  const onSendMessage = (message: string) => {
    console.log("Message sent:", message);
  }

  const handlePhaseComplete = (nextPhase: string) => {
    // If nextPhase already contains "phase", don't add it again
    if (nextPhase.startsWith("phase")) {
      router.push(`/${nextPhase}`);
    } else {
      router.push(`/phase${nextPhase}`);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white py-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect with amber tone */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={5} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-amber-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <LineChart className="h-7 w-7 text-amber-500 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
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
          <Card className="bg-gray-900/60 backdrop-blur-md border border-amber-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <LineChart className="h-8 w-8 text-amber-500" />
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Monitor Progress & Adapt Strategies
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* SolBot Chat Component */}
              <div className="mt-4">
                <SolBotChat
                  height="600px"
                  userId={userId as any}
                  phase="phase5"
                  component="progress_monitoring"
                  useAgent={true}
                  initialMessages={[
                    {
                      id: 1,
                      sender: "bot",
                      content: cleanScoresFromMessage(`# 📊 Monitor Progress & Adapt Strategies

Welcome to Phase 5! This is where we'll develop your ability to track progress and refine your approach.`),
                      timestamp: new Date(),
                    },
                    {
                      id: 2,
                      sender: "bot",
                      content: cleanScoresFromMessage(`## What you'll do in this phase:
- Create a **monitoring system** to track your learning progress
- Learn to **assess effectiveness** of your current strategies
- Develop **adaptation techniques** to overcome learning plateaus`),
                      timestamp: new Date(),
                    },
                    {
                      id: 3,
                      sender: "bot",
                      content: cleanScoresFromMessage(`## How excellence works:
- You can refine your answers as many times as needed
- Focus on quality rather than speed - take your time to develop your best work`),
                      timestamp: new Date(),
                    },
                    {
                      id: 4,
                      sender: "bot",
                      content: cleanScoresFromMessage(`Let's start by discussing how you're currently tracking your learning progress. How do you feel your current approach is serving your goals?`),
                      timestamp: new Date(),
                    }
                  ]}
                  onSendMessage={onSendMessage}
                  onPhaseComplete={handlePhaseComplete}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Add subtle animated gradient background */}
      <div className="fixed inset-0 -z-20 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-yellow-900/20 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>
    </div>
  )
} 