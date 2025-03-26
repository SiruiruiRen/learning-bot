"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Target,
  MessageSquare,
  ArrowLeft,
  BrainCircuit,
} from "lucide-react"
import ModuleBar from "@/components/module-bar"
import SolBotChat, { Message } from "@/components/solbot-chat"

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

export default function Phase2ChatPage() {
  const router = useRouter()
  const phaseId = 2
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
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={phaseId} />
        
        {/* Fixed Phase Title that stays visible when scrolling */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-teal-500/20 py-3 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center">
              <Target className="h-6 w-6 text-teal-500 mr-2" />
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text">
                Task Analysis & Resource Identification
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
          <div className="flex justify-start mb-4">
            <Button
              variant="ghost"
              className="text-teal-400 hover:text-teal-300 hover:bg-slate-800/50"
              onClick={() => router.push("/phase2")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Phase 2
            </Button>
          </div>
          
          <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-bold">
                <MessageSquare className="h-7 w-7 text-teal-500" />
                <span className="bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
                  Task Analysis Chat
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 mb-6">
                <p>
                  {userName ? `Welcome, ${userName}!` : "Welcome!"} Interact with SoLBot to define your learning task and identify resources. 
                  Be specific and thoughtful in your responses to create an effective learning plan.
                </p>
              </div>

              {/* SolBot Chat Component */}
              <div className="mt-4">
                <SolBotChat
                  height="650px"
                  userId={userId}
                  phase="phase2"
                  useAgent={true}
                  alwaysShowContinue={true}
                  initialMessages={[
                    {
                      id: 1,
                      sender: "bot",
                      content: cleanScoresFromMessage(`# 🎯 Task Analysis & Resource Planning

Welcome to Phase 2! This is where we'll define your learning objective and align resources.

## What you'll do in this phase:
- Define a **specific, measurable learning objective**
- Connect your objective to your **existing knowledge**
- Identify **resources** that will support your learning journey

## How excellence works:
- You can refine your answers as many times as needed
- Your responses are evaluated on a quality scale (0-3)
- Once you reach excellence level (≥2.5), you'll move to the next phase
- Focus on quality rather than speed - take your time to develop your best work

Think of this like planning an expedition:
\`\`\`
1. DESTINATION: Where do you want to go? (Learning objective)
2. STARTING POINT: Where are you now? (Current knowledge)
3. EQUIPMENT: What will you need? (Learning resources)
\`\`\`

Let's start by defining what you want to learn. Could you share the specific topic or skill you want to develop?`),
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
    </div>
  );
} 