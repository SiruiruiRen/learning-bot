"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { BarChart, Target, ChartLine, Gauge, ArrowRight, CheckCircle, ChevronRight, ChevronLeft, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button" 
import ModuleBar from "@/components/module-bar"

// Strategy Guide Component
const MonitoringStrategyGuide = () => {
  return (
    <div className="bg-slate-800/50 p-5 rounded-lg border border-indigo-500/20 mb-6">
      <h3 className="text-xl font-medium text-indigo-300 mb-3 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-indigo-900/60 flex items-center justify-center">
          <span className="text-indigo-400">📊</span>
        </div>
        Monitoring & Adaptation: Scientific Learning Concepts
      </h3>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 p-4 rounded-lg border border-indigo-500/30">
          <p className="text-white/90 text-sm leading-relaxed">
            <span className="text-indigo-300 font-medium">Metacognitive monitoring</span> is the process of 
            observing your own learning progress and making deliberate adjustments based on that feedback. Research shows that
            <span className="text-indigo-200"> students who regularly monitor their learning outperform those who don't by 30-50%</span> across 
            various subjects.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 group-hover:from-indigo-500/20 group-hover:to-indigo-600/20 rounded-lg transition-all duration-300"></div>
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/30 relative z-10 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold">1</div>
                <h4 className="text-indigo-300 font-medium">Key Monitoring Components</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="text-indigo-400 mt-0.5 flex-shrink-0">🎯</div>
                  <p className="text-white/80 text-sm"><span className="text-indigo-200 font-medium">Progress Tracking:</span> Regular assessment of your learning against your defined goals.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-indigo-400 mt-0.5 flex-shrink-0">⏱️</div>
                  <p className="text-white/80 text-sm"><span className="text-indigo-200 font-medium">Time Management:</span> Evaluating how effectively you're using your study time.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-indigo-400 mt-0.5 flex-shrink-0">🔍</div>
                  <p className="text-white/80 text-sm"><span className="text-indigo-200 font-medium">Knowledge Assessment:</span> Testing your understanding through self-quizzing and application.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-violet-600/10 group-hover:from-violet-500/20 group-hover:to-violet-600/20 rounded-lg transition-all duration-300"></div>
            <div className="p-4 bg-violet-900/20 rounded-lg border border-violet-500/30 relative z-10 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-violet-700 text-white text-xs font-bold">2</div>
                <h4 className="text-violet-300 font-medium">Adaptation Strategies</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="text-violet-400 mt-0.5 flex-shrink-0">🔄</div>
                  <p className="text-white/80 text-sm"><span className="text-violet-200 font-medium">Strategy Shifting:</span> Changing your approach when current methods aren't working.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-violet-400 mt-0.5 flex-shrink-0">🛠️</div>
                  <p className="text-white/80 text-sm"><span className="text-violet-200 font-medium">Resource Adjustment:</span> Finding new learning materials when needed.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-violet-400 mt-0.5 flex-shrink-0">📈</div>
                  <p className="text-white/80 text-sm"><span className="text-violet-200 font-medium">Difficulty Calibration:</span> Adjusting challenge level to maintain optimal learning state.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-500/30">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
            <div className="text-blue-300">💡</div>
            The Monitoring Cycle
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">1</div>
              <p className="text-white/80">
                <span className="text-blue-200 font-medium">Set specific checkpoints</span> in your learning timeline to evaluate progress.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">2</div>
              <p className="text-white/80">
                <span className="text-blue-200 font-medium">Compare your actual progress</span> to your expected milestones.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">3</div>
              <p className="text-white/80">
                <span className="text-blue-200 font-medium">Make specific adjustments</span> to your strategies when discrepancies appear.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 text-xs">4</div>
              <p className="text-white/80">
                <span className="text-blue-200 font-medium">Implement the adjustments</span> and continue monitoring in an ongoing cycle.
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
              <h4 className="text-green-300 font-medium mb-1">Ready to Monitor Your Learning?</h4>
              <p className="text-white/80 text-sm">
                In this phase, you'll create a personalized monitoring system to track your progress and adapt your learning strategies. <span className="text-green-200 font-medium">Click Continue</span> to move to the monitoring activity!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Phase5Content() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [currentCardIndex, setCurrentCardIndex] = useState(0) // Track the current card

  // Define the cards for easy reference
  const cards = [
    { id: "intro", title: "Monitoring Your Learning" },
    { id: "strategy", title: "Metacognitive Monitoring Strategies" },
    { id: "benefits", title: "Benefits of Regular Monitoring" },
  ]

  // Function to navigate to the next card
  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      // If we're on the last card, go to the monitoring page
      router.push("/phase5/monitoring")
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
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      // Generate a temporary ID that won't be persisted
      setUserId(`temp-${Math.random().toString(36).substring(2, 9)}` as any)
    }
  }, [])

  // Continue to monitoring activity
  const continueToMonitoring = () => {
    router.push('/phase5/monitoring')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect with indigo tone */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={5} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-indigo-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <LineChart className="h-6 w-6 text-amber-500 mr-2" />
            <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text">
              Phase 5: Monitor Your Learning
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
            <Card className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                  <LineChart className="h-8 w-8 text-amber-500" />
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                    Monitor Your Learning
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-white/80 space-y-4 mb-6">
                  <p className="text-center text-lg">
                    {userName ? `Welcome, ${userName}!` : "Welcome!"} In Phase 5, you'll learn how to track your progress and adjust your learning strategies for optimal results.
                  </p>
                  
                  <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 p-4 rounded-lg border border-indigo-500/30">
                    <p className="text-white/90 text-base">
                      Monitoring your learning is a <span className="text-indigo-300 font-medium">powerful metacognitive skill</span> that separates expert learners from novices. Research shows that regular monitoring can <span className="text-indigo-200 font-medium">improve learning outcomes by 30-50%</span> across different domains.
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-indigo-500/20">
                    <h3 className="text-indigo-300 font-medium mb-3">In This Phase You'll Create:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <BarChart className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>A personalized monitoring system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChartLine className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>Progress tracking strategies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Gauge className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>Adaptation techniques for obstacles</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <div></div> {/* Empty div for spacing */}
                <Button 
                  onClick={nextCard}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Strategy Card */}
          {currentCardIndex === 1 && (
            <Card className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                  <span className="text-indigo-400 text-2xl">📊</span>
                  <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                    Monitoring Strategies
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 p-4 rounded-lg border border-indigo-500/30">
                    <p className="text-white/90 text-sm leading-relaxed">
                      <span className="text-indigo-300 font-medium">Metacognitive monitoring</span> is the process of 
                      observing your own learning progress and making deliberate adjustments based on that feedback.
                      Effective learners continuously evaluate what's working and what needs improvement.
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/60 p-4 rounded-lg border border-indigo-500/20">
                    <div className="mb-4">
                      <h4 className="text-indigo-300 font-medium mb-2 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold">1</div>
                        Track Multiple Dimensions
                      </h4>
                      <ul className="space-y-2 text-sm pl-8">
                        <li className="list-disc text-indigo-400">
                          <span className="text-white/80"><span className="text-indigo-200 font-medium">Content mastery:</span> How well do you understand the material?</span>
                        </li>
                        <li className="list-disc text-indigo-400">
                          <span className="text-white/80"><span className="text-indigo-200 font-medium">Time efficiency:</span> Are you learning efficiently or getting stuck?</span>
                        </li>
                        <li className="list-disc text-indigo-400">
                          <span className="text-white/80"><span className="text-indigo-200 font-medium">Motivation levels:</span> How engaged are you with the material?</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-indigo-300 font-medium mb-2 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold">2</div>
                        Use Multiple Assessment Methods
                      </h4>
                      <ul className="space-y-2 text-sm pl-8">
                        <li className="list-disc text-indigo-400">
                          <span className="text-white/80"><span className="text-indigo-200 font-medium">Self-quizzing:</span> Test your knowledge without reference materials</span>
                        </li>
                        <li className="list-disc text-indigo-400">
                          <span className="text-white/80"><span className="text-indigo-200 font-medium">Teaching others:</span> Explain concepts to verify understanding</span>
                        </li>
                        <li className="list-disc text-indigo-400">
                          <span className="text-white/80"><span className="text-indigo-200 font-medium">Application challenges:</span> Use knowledge to solve new problems</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <Button 
                  onClick={prevCard}
                  variant="outline" 
                  className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-950/50"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={nextCard}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Benefits Card */}
          {currentCardIndex === 2 && (
            <Card className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-xl mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                  <CheckCircle className="h-8 w-8 text-indigo-500" />
                  <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                    Benefits of Monitoring
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-indigo-500/20">
                    <h3 className="text-indigo-300 font-medium mb-4">Why Monitoring Transform Your Learning:</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 p-3 rounded-lg border border-indigo-500/30">
                        <h4 className="text-indigo-200 font-medium mb-1 flex items-center gap-2">
                          <div className="text-indigo-400 text-lg">🔍</div>
                          Early Problem Detection
                        </h4>
                        <p className="text-white/80 text-sm">
                          Catch misunderstandings before they become ingrained and difficult to correct.
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 p-3 rounded-lg border border-indigo-500/30">
                        <h4 className="text-indigo-200 font-medium mb-1 flex items-center gap-2">
                          <div className="text-indigo-400 text-lg">⚡</div>
                          Increased Efficiency
                        </h4>
                        <p className="text-white/80 text-sm">
                          Focus your time on areas that need improvement rather than what you already know.
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 p-3 rounded-lg border border-indigo-500/30">
                        <h4 className="text-indigo-200 font-medium mb-1 flex items-center gap-2">
                          <div className="text-indigo-400 text-lg">💪</div>
                          Sustained Motivation
                        </h4>
                        <p className="text-white/80 text-sm">
                          Seeing progress creates positive feedback loops that fuel continued effort.
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 p-3 rounded-lg border border-indigo-500/30">
                        <h4 className="text-indigo-200 font-medium mb-1 flex items-center gap-2">
                          <div className="text-indigo-400 text-lg">🔄</div>
                          Strategic Flexibility
                        </h4>
                        <p className="text-white/80 text-sm">
                          Learn to adjust your approach when initial strategies aren't working.
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
                        <h4 className="text-green-300 font-medium mb-1">Ready to Create Your Monitoring System?</h4>
                        <p className="text-white/80 text-sm">
                          You've learned the key concepts behind effective learning monitoring. Now it's time to build your personalized monitoring system!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <Button 
                  onClick={prevCard}
                  variant="outline" 
                  className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-950/50"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={continueToMonitoring}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                >
                  Continue to Monitoring <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
} 