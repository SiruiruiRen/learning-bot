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
import GuidedLearningObjective from "@/components/guided-learning-objective"

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
  const [useGuidedMode, setUseGuidedMode] = useState(true) // Default to guided mode
  
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

  const handlePhaseComplete = (nextPhase?: string) => {
    // If no nextPhase provided or it already contains "phase", don't add it again
    if (!nextPhase) {
      // Default to next phase if none provided
      router.push(`/phase3`);
      return;
    }
    
    if (nextPhase.startsWith("phase")) {
      router.push(`/${nextPhase}`);
    } else {
      router.push(`/phase${nextPhase}`);
    }
  }

  const toggleMode = () => {
    setUseGuidedMode(!useGuidedMode);
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
                Phase 2: Understand Your Tasks
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
              className="text-teal-400 hover:text-teal-300 hover:bg-slate-800/50"
              onClick={() => router.push("/phase2")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Phase 2
            </Button>
            
            <Button
              variant="outline"
              className="text-teal-400 border-teal-400 hover:text-teal-300 hover:bg-slate-800/50"
              onClick={toggleMode}
            >
              Switch to {useGuidedMode ? "Free Chat" : "Guided"} Mode
            </Button>
          </div>
          
          <Card className="bg-slate-900/60 backdrop-blur-md border border-teal-500/30 shadow-xl mb-6 max-w-4xl mx-auto w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-bold">
                <MessageSquare className="h-7 w-7 text-teal-500" />
                <span className="bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
                  {useGuidedMode ? "Guided Learning Objective Builder" : "Understanding Your Tasks"}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 mb-6">
                <p>
                  {userName ? `Welcome, ${userName}!` : "Welcome!"} {useGuidedMode ? 
                    "I'll guide you through creating a complete learning objective by asking specific questions about what you want to learn, your background, and the resources you'll use." :
                    "Interact with SoLBot to define your learning task and identify resources. Be specific and thoughtful in your responses to create an effective learning plan."}
                </p>
              </div>

              {useGuidedMode ? (
                <GuidedLearningObjective 
                  userId={userId}
                  phase="phase2" 
                  height="750px"
                  onComplete={handlePhaseComplete}
                />
              ) : (
                <SolBotChat
                  height="750px"
                  userId={userId}
                  phase="phase2"
                  useAgent={true}
                  alwaysShowContinue={true}
                  initialMessages={[
                    {
                      id: 1,
                      sender: "bot",
                      content: cleanScoresFromMessage(`# 🎯 Task Analysis & Resource Planning

Welcome to Phase 2! Let's define what you want to learn and what resources you'll need.`),
                      timestamp: new Date(),
                    },
                    {
                      id: 3,
                      sender: "bot",
                      content: cleanScoresFromMessage(`## What you'll do in this phase:
- Define a **specific, measurable learning objective**
- Connect your objective to your **existing knowledge**
- Identify **resources** that will support your learning journey`),
                      timestamp: new Date(),
                    },
                    {
                      id: 4,
                      sender: "bot",
                      content: cleanScoresFromMessage(`## What makes a good task analysis:
- You can refine your answers as many times as needed
- Focus on quality rather than speed - take your time to develop your best work`),
                      timestamp: new Date(),
                    },
                    {
                      id: 5,
                      sender: "bot",
                      content: cleanScoresFromMessage(`Think of this like planning an expedition:
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
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 