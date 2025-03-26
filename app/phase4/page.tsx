"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Target, Sparkles, Trophy, CheckCircle, ArrowRight, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button" 
import ModuleBar from "@/components/module-bar"

// Replace the existing MCIIStrategyGuide component with a more engaging and visual version
const MCIIStrategyGuide = () => {
  return (
    <div className="bg-slate-800/50 p-5 rounded-lg border border-amber-500/20 mb-6">
      <h3 className="text-xl font-medium text-amber-300 mb-3 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-amber-900/60 flex items-center justify-center">
          <span className="text-amber-400">🧠</span>
        </div>
        MCII: Your Psychological Superpower
      </h3>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-4 rounded-lg border border-amber-500/30">
          <p className="text-white/90 text-sm leading-relaxed">
            <span className="text-amber-300 font-medium">Mental Contrasting with Implementation Intentions (MCII)</span> is a powerful 
            evidence-based strategy shown to <span className="text-amber-200">double or triple your chances of achieving your goals</span>. 
            It works by harnessing both your imagination and practical planning abilities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 group-hover:from-amber-500/20 group-hover:to-amber-600/20 rounded-lg transition-all duration-300"></div>
            <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30 relative z-10 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold">1</div>
                <h4 className="text-amber-300 font-medium">Mental Contrasting</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="text-amber-400 mt-0.5 flex-shrink-0">✨</div>
                  <p className="text-white/80 text-sm"><span className="text-amber-200 font-medium">First, visualize success</span> - Imagine achieving your goal in vivid detail. How would it feel? What benefits would you enjoy?</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-amber-400 mt-0.5 flex-shrink-0">🧗‍♂️</div>
                  <p className="text-white/80 text-sm"><span className="text-amber-200 font-medium">Then, identify obstacles</span> - What specific challenges might prevent you from reaching this goal?</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-amber-400 mt-0.5 flex-shrink-0">🔄</div>
                  <p className="text-white/80 text-sm">This mental contrast creates motivational energy and helps you focus on what truly matters.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10 group-hover:from-orange-500/20 group-hover:to-orange-600/20 rounded-lg transition-all duration-300"></div>
            <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-500/30 relative z-10 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs font-bold">2</div>
                <h4 className="text-orange-300 font-medium">Implementation Intentions</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="text-orange-400 mt-0.5 flex-shrink-0">🎯</div>
                  <p className="text-white/80 text-sm">Create specific <span className="text-orange-200 font-medium">"if-then" plans</span> for each obstacle you identified.</p>
                </div>
                <div className="p-2 bg-slate-800/70 rounded border border-orange-500/20 text-sm">
                  <p className="text-white/90 italic mb-1 text-center">Formula:</p>
                  <p className="text-white/90 text-center font-medium">"If <span className="text-orange-300">[obstacle occurs]</span>, then I will <span className="text-green-300">[specific action]</span>"</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-orange-400 mt-0.5 flex-shrink-0">🧠</div>
                  <p className="text-white/80 text-sm">This creates an automatic mental link that triggers your planned response when you face obstacles.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-500/30">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
            <div className="text-blue-300">💡</div>
            Example: Applying MCII to Your Learning
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">1</div>
              <p className="text-white/80">
                <span className="text-blue-200 font-medium">Visualize success:</span> Imagine mastering difficult concepts in your challenging course and feeling confident during exams.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">2</div>
              <p className="text-white/80">
                <span className="text-blue-200 font-medium">Identify obstacles:</span> You often get distracted by social media when studying.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">3</div>
              <p className="text-white/80">
                <span className="text-blue-200 font-medium">Create implementation intention:</span> "If I feel the urge to check social media, then I will put my phone in another room and focus for 25 minutes."
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
              <div className="text-green-400 text-xl">🚀</div>
            </div>
            <div>
              <h4 className="text-green-300 font-medium mb-1">Your Learning Plan Journey</h4>
              <p className="text-white/80 text-sm">
                In the next three tasks, you'll apply MCII to create your strategic learning plan. <span className="text-green-200 font-medium">Start with Task 1 below</span> to define your long-term learning goals!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Phase4Content() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [taskProgress, setTaskProgress] = useState({
    longTermGoals: 0,
    shortTermGoals: 0,
    contingencyStrategies: 0
  })
  
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
        setTaskProgress(JSON.parse(savedProgress))
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      // Generate a temporary ID that won't be persisted
      setUserId(`temp-${Math.random().toString(36).substring(2, 9)}` as any)
    }
  }, [])

  useEffect(() => {
    // Save task progress
    localStorage.setItem("solbot_phase4_progress", JSON.stringify(taskProgress))
  }, [taskProgress])

  // Navigate to specific task
  const navigateToTask = (task: string) => {
    router.push(`/phase4/${task}`)
  }

  // Check if all tasks are complete
  const allTasksComplete = Object.values(taskProgress).every(score => score >= 2.5)

  // Continue to next phase if all tasks are complete
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

        {/* Nebula effect with orange tone */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={4} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-orange-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <ListTodo className="h-7 w-7 text-orange-500 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Strategic Learning Plan
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
          <Card className="bg-gray-900/60 backdrop-blur-md border border-orange-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <ListTodo className="h-8 w-8 text-orange-500" />
                <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Strategic Learning Plan
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 space-y-4 mb-6">
                <p>
                  {userName ? `Welcome ${userName}!` : "Welcome!"} In this phase, you'll develop a comprehensive learning plan through three strategic tasks:
                </p>
                
                {/* Add MCII component here first */}
                <MCIIStrategyGuide />
                
                <div className="bg-gray-800/50 p-4 rounded-lg border border-orange-500/20 space-y-6">
                  {/* Long-term Goals Task Card */}
                  <div 
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                      taskProgress.longTermGoals >= 2.5 
                        ? "bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-500/40" 
                        : "bg-gradient-to-r from-gray-900/40 to-gray-800/40 border border-orange-500/20 hover:border-orange-400/40"
                    }`}
                    onClick={() => navigateToTask('long-term-goals')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${taskProgress.longTermGoals >= 2.5 ? "bg-green-800/50" : "bg-orange-900/50"}`}>
                          <Sparkles className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">Task 1: Long-term Learning Goals</h3>
                          <p className="text-sm text-white/70">Define your aspirational learning targets</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {taskProgress.longTermGoals >= 2.5 ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : (
                          <ArrowRight className="h-5 w-5 text-orange-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Short-term Goals Task Card */}
                  <div 
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                      taskProgress.shortTermGoals >= 2.5 
                        ? "bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-500/40" 
                        : "bg-gradient-to-r from-gray-900/40 to-gray-800/40 border border-orange-500/20 hover:border-orange-400/40"
                    }`}
                    onClick={() => navigateToTask('short-term-goals')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${taskProgress.shortTermGoals >= 2.5 ? "bg-green-800/50" : "bg-orange-900/50"}`}>
                          <Target className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">Task 2: SMART Objectives</h3>
                          <p className="text-sm text-white/70">Create specific, measurable short-term goals</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {taskProgress.shortTermGoals >= 2.5 ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : (
                          <ArrowRight className="h-5 w-5 text-orange-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contingency Strategies Task Card */}
                  <div 
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                      taskProgress.contingencyStrategies >= 2.5 
                        ? "bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-500/40" 
                        : "bg-gradient-to-r from-gray-900/40 to-gray-800/40 border border-orange-500/20 hover:border-orange-400/40"
                    }`}
                    onClick={() => navigateToTask('contingency-strategies')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${taskProgress.contingencyStrategies >= 2.5 ? "bg-green-800/50" : "bg-orange-900/50"}`}>
                          <Sparkles className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">Task 3: Contingency Strategies</h3>
                          <p className="text-sm text-white/70">Prepare obstacle-handling techniques</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {taskProgress.contingencyStrategies >= 2.5 ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : (
                          <ArrowRight className="h-5 w-5 text-orange-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {allTasksComplete && (
                  <div className="mt-8 text-center">
                    <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 p-4 rounded-lg border border-green-500/40 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy className="h-6 w-6 text-amber-400" />
                        <h3 className="font-bold text-lg text-white">All Tasks Complete!</h3>
                      </div>
                      <p className="text-white/80">You've successfully created a comprehensive strategic learning plan.</p>
                    </div>
                    <Button 
                      onClick={continueToNextPhase}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2 rounded-full"
                    >
                      Continue to Phase 5
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="bg-gray-900/60 border border-orange-500/30 p-3 rounded-lg mt-4 flex items-start gap-3">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-900/60 flex items-center justify-center text-orange-400 animate-pulse">
                    ↑
                  </div>
                  <p className="text-white/80 text-sm">
                    <span className="text-amber-300 font-medium">Ready to get started?</span> Click the <span className="text-orange-300 font-semibold">Task 1: Long-term Learning Goals</span> card above to begin your learning plan journey!
                  </p>
                </div>
              </div>
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

