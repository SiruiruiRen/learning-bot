"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft, Trophy, ArrowRight } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import SolBotChat from "@/components/solbot-chat"

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

export default function ContingencyStrategiesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [score, setScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  
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

      // Load task progress
      const savedProgress = localStorage.getItem("solbot_phase4_progress")
      if (savedProgress) {
        const progress = JSON.parse(savedProgress)
        if (progress.contingencyStrategies) {
          setScore(progress.contingencyStrategies)
          setIsCompleted(progress.contingencyStrategies >= 2.5)
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      setUserId(`temp-${Math.random().toString(36).substring(2, 9)}` as any)
    }
  }, [])

  // Send message handler
  const onSendMessage = (message: string) => {
    console.log("Message sent:", message)
  }

  // Handle task completion
  const handleTaskComplete = (nextPhase: string) => {
    // Extract score from nextPhase string if it contains a score value
    let scoreValue = 0
    try {
      // Check if nextPhase contains a score value
      if (nextPhase.includes('score:')) {
        scoreValue = parseFloat(nextPhase.split('score:')[1])
      } else {
        // If not, set a default excellent score
        scoreValue = 2.5
      }
    } catch (error) {
      console.error("Error parsing score:", error)
      scoreValue = 2.5 // Default to excellent score on error
    }

    // Save progress to localStorage
    try {
      const savedProgress = localStorage.getItem("solbot_phase4_progress")
      let progress = savedProgress ? JSON.parse(savedProgress) : {
        longTermGoals: 0,
        shortTermGoals: 0,
        contingencyStrategies: 0
      }
      
      progress.contingencyStrategies = scoreValue
      localStorage.setItem("solbot_phase4_progress", JSON.stringify(progress))
    } catch (error) {
      console.error("Error saving progress:", error)
    }

    // Update the state regardless of the score
    setScore(scoreValue)
    setIsCompleted(scoreValue >= 2.5)

    // Only redirect if the user clicks the continue button
    // The redirect will be handled by the continueToNextPhase function
  }

  // Return to main phase page
  const returnToPhase = () => {
    router.push('/phase4')
  }

  // Continue to next phase
  const continueToNextPhase = () => {
    router.push('/phase5')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white py-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={4} />

      {/* Fixed Title Header with Back Button */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-orange-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-950/30 p-2"
              onClick={returnToPhase}
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span>Back</span>
            </Button>
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-orange-500 mr-2" />
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                Contingency Strategies
              </h1>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
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
          <Card className="bg-gray-900/60 backdrop-blur-md border border-orange-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-center">
                <Sparkles className="h-7 w-7 text-orange-500" />
                <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Task 3: Contingency Strategies
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 space-y-4 mb-4">
                <p>
                  Prepare contingency strategies to overcome potential obstacles in your learning journey. These "if-then" plans will help you maintain momentum when challenges arise.
                </p>
              </div>

              {/* SolBot Chat Component */}
              <div className="mt-4">
                <SolBotChat
                  height="500px"
                  userId={userId as any}
                  phase="phase4"
                  component="contingency_strategies"
                  useAgent={true}
                  initialMessages={[
                    {
                      id: 1,
                      sender: "bot",
                      content: cleanScoresFromMessage(`# IF-THEN Contingency Planning

Now let's create specific contingency plans for challenges you might face while working toward your goals. These IF-THEN plans help you prepare for obstacles and maintain progress even when things get difficult.

## What makes excellent IF-THEN plans?
- Specific triggers (the "IF" part)
- Clear, actionable responses (the "THEN" part)
- Realistic strategies that address common challenges
- Proactive rather than reactive approaches

## Example format:
**IF** I miss a scheduled study session due to unexpected work demands,  
**THEN** I will reschedule it immediately for the next available time slot and add 15 extra minutes to make up for lost time.

Please create 1 specific IF-THEN plan that address potential challenges to your learning goals. You can add more than one IF-THEN plan if you think it's necessary.`),
                      timestamp: new Date(),
                    }
                  ]}
                  onSendMessage={onSendMessage}
                  onPhaseComplete={handleTaskComplete}
                />
              </div>
              
              {isCompleted && (
                <div className="text-center mt-6">
                  <p className="text-green-400 mb-4">You've successfully created excellent contingency strategies!</p>
                  <Button 
                    onClick={continueToNextPhase}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2 rounded-full"
                  >
                    Continue to Phase 5
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Add subtle animated gradient background */}
      <div className="fixed inset-0 -z-20 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-amber-900/20 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>
    </div>
  )
} 