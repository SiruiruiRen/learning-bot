"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Target, Sparkles, Trophy, CheckCircle, ArrowRight, ListTodo, ChevronRight, ChevronLeft } from "lucide-react"
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0) // Track the current card

  // Define the cards for easy reference
  const cards = [
    { id: "intro", title: "Strategic Planning" },
    { id: "mcii", title: "MCII: Your Psychological Superpower" },
    { id: "tasks", title: "Your Learning Planning Tasks" },
  ]

  // Function to navigate to the next card
  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      // If we're on the last card, go to the first task
      navigateToTask("long_term_goals")
    }
  }

  // Function to navigate to the previous card
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }
  
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
    // Convert underscores to hyphens to match folder structure
    const formattedTask = task.replace(/_/g, '-')
    router.push(`/phase4/${formattedTask}`)
  }

  // Check if all tasks are complete
  const allTasksComplete = Object.values(taskProgress).every(score => score >= 2.5) && 
    taskProgress.longTermGoals >= 2.5 && 
    taskProgress.shortTermGoals >= 2.5 && 
    taskProgress.contingencyStrategies >= 2.5

  // Continue to next phase if all tasks are complete
  const continueToNextPhase = () => {
    router.push('/phase5')
  }

  // Reset task progress (for testing purposes)
  const resetProgress = () => {
    const resetValues = {
      longTermGoals: 0,
      shortTermGoals: 0,
      contingencyStrategies: 0
    }
    
    setTaskProgress(resetValues)
    localStorage.setItem("solbot_phase4_progress", JSON.stringify(resetValues))
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
            <Target className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text">
              Strategic Planning
            </h2>
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
          {/* Intro Card */}
          {currentCardIndex === 0 && (
            <Card className="bg-gray-900/60 backdrop-blur-md border border-orange-500/30 shadow-xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                  <Target className="h-8 w-8 text-orange-500" />
                  <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Strategic Planning
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-white/80 space-y-4 mb-6">
                  <p className="text-center text-lg">
                    {userName ? `Welcome, ${userName} Ren!` : "Welcome!"} In Phase 4, you'll create a strategic learning plan that connects your goals to effective action steps.
                  </p>
                  
                  <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 p-4 rounded-lg border border-orange-500/30">
                    <p className="text-white/90 text-base">
                      You'll learn about the powerful <span className="text-orange-300 font-medium">MCII (Mental Contrasting with Implementation Intentions)</span> approach to goal setting and planning, which has been shown to <span className="text-orange-200 font-medium">double or triple goal achievement rates</span>.
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-orange-500/20">
                    <h3 className="text-orange-300 font-medium mb-3">In This Phase You'll Create:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Target className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span>Long-term learning goals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ListTodo className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span>Short-term SMART objectives</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span>Contingency strategies for obstacles</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <div></div> {/* Empty div for spacing */}
                <Button 
                  onClick={nextCard}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* MCII Card */}
          {currentCardIndex === 1 && (
            <Card className="bg-gray-900/60 backdrop-blur-md border border-orange-500/30 shadow-xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                  <span className="text-orange-400 text-2xl">🧠</span>
                  <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    MCII: Your Psychological Superpower
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 p-4 rounded-lg border border-orange-500/30">
                    <p className="text-white/90 text-sm leading-relaxed">
                      <span className="text-orange-300 font-medium">Mental Contrasting with Implementation Intentions (MCII)</span> is a powerful 
                      evidence-based strategy shown to <span className="text-orange-200">double or triple your chances of achieving your goals</span>. 
                      It works by harnessing both your imagination and practical planning abilities.
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/60 p-4 rounded-lg border border-orange-500/20">
                    <div className="mb-4">
                      <h4 className="text-orange-300 font-medium mb-2 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs font-bold">1</div>
                        Mental Contrasting
                      </h4>
                      <ul className="space-y-2 text-sm pl-8">
                        <li className="list-disc text-orange-400">
                          <span className="text-white/80"><span className="text-orange-200 font-medium">First, visualize success</span> - Imagine achieving your goal in vivid detail. How would it feel? What benefits would you enjoy?</span>
                        </li>
                        <li className="list-disc text-orange-400">
                          <span className="text-white/80"><span className="text-orange-200 font-medium">Then, identify obstacles</span> - What specific challenges might prevent you from reaching this goal?</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-orange-300 font-medium mb-2 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-orange-600 to-orange-700 text-white text-xs font-bold">2</div>
                        Implementation Intentions
                      </h4>
                      <div className="p-3 bg-slate-800/70 rounded border border-orange-500/20 text-sm mb-2">
                        <p className="text-white/90 italic mb-1 text-center">Formula:</p>
                        <p className="text-white/90 text-center font-medium">"If <span className="text-orange-300">[obstacle occurs]</span>, then I will <span className="text-green-300">[specific action]</span>"</p>
                      </div>
                      <p className="text-white/80 text-sm pl-8">This creates an automatic mental link that triggers your planned response when you face obstacles.</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-500/30 p-4">
                    <h4 className="text-blue-300 font-medium mb-2">Example: Applying MCII to Your Learning</h4>
                    <ol className="space-y-2 text-sm pl-5">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">1</span>
                        <span className="text-white/80"><span className="text-blue-200 font-medium">Visualize success:</span> Imagine mastering difficult concepts and feeling confident during exams.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">2</span>
                        <span className="text-white/80"><span className="text-blue-200 font-medium">Identify obstacles:</span> You often get distracted by social media when studying.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">3</span>
                        <span className="text-white/80"><span className="text-blue-200 font-medium">Create implementation intention:</span> "If I feel the urge to check social media, then I will put my phone in another room and focus for 25 minutes."</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <Button 
                  onClick={prevCard}
                  variant="outline" 
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-950/50"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={nextCard}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Tasks Card */}
          {currentCardIndex === 2 && (
            <Card className="bg-gray-900/60 backdrop-blur-md border border-orange-500/30 shadow-xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                  <ListTodo className="h-8 w-8 text-orange-500" />
                  <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Your Learning Planning Tasks
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-5">
                  <p className="text-white/80 text-center">
                    You'll complete three tasks to create your strategic learning plan:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative overflow-hidden group rounded-lg">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-600/10 group-hover:from-amber-500/20 group-hover:to-orange-600/20 rounded-lg transition-all duration-300"></div>
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-orange-500/30 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-900/60 flex items-center justify-center text-orange-400 text-xl">1</div>
                          <div>
                            <h3 className="text-orange-300 font-medium text-lg mb-1">Long-term Learning Goals</h3>
                            <p className="text-white/80 text-sm">Define your big-picture learning objectives that inspire and motivate you.</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            onClick={() => navigateToTask("long_term_goals")}
                            variant="ghost"
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-950/50"
                            size="sm"
                          >
                            {taskProgress.longTermGoals > 0 ? "Continue" : "Start"} <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative overflow-hidden group rounded-lg">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-600/10 group-hover:from-amber-500/20 group-hover:to-orange-600/20 rounded-lg transition-all duration-300"></div>
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-orange-500/30 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-900/60 flex items-center justify-center text-orange-400 text-xl">2</div>
                          <div>
                            <h3 className="text-orange-300 font-medium text-lg mb-1">Short-term SMART Objectives</h3>
                            <p className="text-white/80 text-sm">Create specific, measurable steps that lead to your long-term goals.</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            onClick={() => navigateToTask("short_term_goals")}
                            variant="ghost"
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-950/50"
                            size="sm"
                          >
                            {taskProgress.shortTermGoals > 0 ? "Continue" : "Start"} <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative overflow-hidden group rounded-lg">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-600/10 group-hover:from-amber-500/20 group-hover:to-orange-600/20 rounded-lg transition-all duration-300"></div>
                      <div className="p-4 bg-gray-800/50 rounded-lg border border-orange-500/30 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-900/60 flex items-center justify-center text-orange-400 text-xl">3</div>
                          <div>
                            <h3 className="text-orange-300 font-medium text-lg mb-1">Contingency Strategies</h3>
                            <p className="text-white/80 text-sm">Develop plans to overcome obstacles using the "if-then" implementation intentions.</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            onClick={() => navigateToTask("contingency_strategies")}
                            variant="ghost"
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-950/50"
                            size="sm"
                          >
                            {taskProgress.contingencyStrategies > 0 ? "Continue" : "Start"} <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <Button 
                  onClick={prevCard}
                  variant="outline" 
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-950/50"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={() => navigateToTask("long_term_goals")}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                >
                  Start Tasks <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </div>
      
      {/* Add subtle animated gradient background */}
      <div className="fixed inset-0 -z-20 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-amber-900/20 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>
    </div>
  )
}

