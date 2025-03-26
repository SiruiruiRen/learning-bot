"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Target,
  Clock,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  Share2,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
  ListTodo,
} from "lucide-react"

// Define types for plan data
interface Strategy {
  name: string;
  description: string;
}

interface ShortTermGoal {
  goal: string;
  timeframe: string;
  actions: string[];
  strategies: Strategy[];
}

interface IfThenStrategy {
  challenge: string;
  response: string;
}

interface PlanData {
  longTermGoal: string;
  shortTermGoals: ShortTermGoal[];
  ifThenStrategies: IfThenStrategy[];
}

export default function StrategicPlanVisualization() {
  const router = useRouter()
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedGoals, setExpandedGoals] = useState<Record<number, boolean>>({})

  useEffect(() => {
    // Load the strategic plan data from localStorage
    try {
      const storedData = localStorage.getItem("solbot_strategic_plan")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        setPlanData(parsedData)

        // Initialize all goals as expanded
        const initialExpandState = {}
        if (parsedData.shortTermGoals) {
          parsedData.shortTermGoals.forEach((goal, index) => {
            initialExpandState[index] = true
          })
        }
        setExpandedGoals(initialExpandState)
      }
    } catch (error) {
      console.error("Error loading strategic plan data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleGoalExpand = (index: number) => {
    setExpandedGoals((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleContinue = () => {
    router.push("/phase5")
  }

  const handleSavePlan = () => {
    // Create a text version of the plan
    if (!planData) return

    let planText = `STRATEGIC LEARNING PLAN\n\n`
    planText += `LONG-TERM GOAL:\n${planData.longTermGoal}\n\n`

    planText += `SHORT-TERM OBJECTIVES:\n`
    planData.shortTermGoals.forEach((goal, index) => {
      planText += `${index + 1}. ${goal.goal}\n`
      planText += `   Timeframe: ${goal.timeframe}\n`

      planText += `   Actions:\n`
      goal.actions.forEach((action) => {
        planText += `   - ${action}\n`
      })

      planText += `   Learning Strategies:\n`
      goal.strategies.forEach((strategy) => {
        if (strategy) {
          planText += `   - ${strategy.name}: ${strategy.description}\n`
        }
      })
      planText += `\n`
    })

    planText += `CONTINGENCY PLANS:\n`
    planData.ifThenStrategies.forEach((strategy, index) => {
      planText += `${index + 1}. IF ${strategy.challenge}\n   THEN ${strategy.response}\n\n`
    })

    // Create a blob and download it
    const blob = new Blob([planText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "strategic_learning_plan.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-indigo-400">Loading your strategic plan...</p>
        </div>
      </div>
    )
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
        <div className="container mx-auto px-4 relative z-10">
          <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6 max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">No Strategic Plan Found</h2>
                <p className="text-white/80 mb-6">It seems you haven't created a strategic plan yet.</p>
                <Button onClick={() => router.push("/phase4")} className="bg-indigo-500 hover:bg-indigo-600">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Strategic Planning
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Planning
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSavePlan}
                    className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Save Plan
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "My Strategic Learning Plan",
                          text: "Check out my strategic learning plan created with SoLBot!",
                        })
                      }
                    }}
                    className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center mt-4">
                <ListTodo className="h-8 w-8 text-orange-500" />
                <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Your Strategic Learning Plan
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Main visualization container */}
              <div className="mt-6 space-y-8">
                {/* Long-term goal section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-500/30 shadow-lg relative overflow-hidden"
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-orange-400" />
                      <h4 className="font-bold text-white">Long-Term Goal</h4>
                    </div>

                    <p className="text-white/90 text-lg font-medium pl-4 border-l-2 border-purple-500">
                      {planData.longTermGoal}
                    </p>

                    {/* Visual connector */}
                    <div className="mt-6 flex justify-center">
                      <div className="h-12 w-0.5 bg-gradient-to-b from-purple-500 to-indigo-500"></div>
                    </div>
                  </div>
                </motion.div>

                {/* Short-term goals section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-center text-indigo-400">Short-Term Objectives</h3>

                  {planData.shortTermGoals.map((goal, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 rounded-xl border border-indigo-500/30 shadow-lg overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleGoalExpand(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-500/20 h-8 w-8 rounded-full flex items-center justify-center">
                            <span className="text-indigo-400 font-bold">{index + 1}</span>
                          </div>
                          <h4 className="font-bold text-white">{goal.goal}</h4>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-amber-400 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{goal.timeframe}</span>
                          </div>

                          {expandedGoals[index] ? (
                            <ChevronUp className="h-5 w-5 text-indigo-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-indigo-400" />
                          )}
                        </div>
                      </div>

                      {expandedGoals[index] && (
                        <div className="px-4 pb-4 pt-2 border-t border-indigo-500/20">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Actions */}
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <h5 className="font-medium text-blue-400 mb-2 flex items-center">
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Action Steps
                              </h5>
                              <ul className="space-y-2 pl-2">
                                {goal.actions.map((action, actionIdx) => (
                                  <li key={actionIdx} className="flex items-start gap-2 text-white/80">
                                    <div className="bg-blue-500/20 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-blue-400 text-xs font-bold">{actionIdx + 1}</span>
                                    </div>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Learning Strategies */}
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <h5 className="font-medium text-emerald-400 mb-2">Learning Strategies</h5>
                              <div className="space-y-2">
                                {goal.strategies &&
                                  goal.strategies.map(
                                    (strategy, stratIdx) =>
                                      strategy && (
                                        <div
                                          key={stratIdx}
                                          className="bg-emerald-500/10 rounded p-2 border border-emerald-500/20"
                                        >
                                          <div className="font-medium text-emerald-400 text-sm">{strategy.name}</div>
                                          <p className="text-white/70 text-xs">{strategy.description}</p>
                                        </div>
                                      ),
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Contingency plans section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl p-6 border border-amber-500/30 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-amber-500/20 p-2 rounded-lg">
                      <RefreshCw className="h-6 w-6 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Contingency Plans</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {planData.ifThenStrategies.map((strategy, index) => (
                      <div key={strategy.id} className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/20">
                        <div className="mb-2">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">IF</Badge>
                          <p className="mt-1 text-white/90">{strategy.challenge}</p>
                        </div>
                        <div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">THEN</Badge>
                          <p className="mt-1 text-white/90">{strategy.response}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Implementation tips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-amber-500/20 p-2 rounded-lg">
                      <Lightbulb className="h-6 w-6 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Implementation Tips</h2>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-white/80">
                      <div className="bg-indigo-500/20 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-indigo-400 text-xs font-bold">1</span>
                      </div>
                      <span>Review your plan weekly to track progress and make adjustments as needed</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <div className="bg-indigo-500/20 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-indigo-400 text-xs font-bold">2</span>
                      </div>
                      <span>Use your IF-THEN plans immediately when obstacles arise to maintain momentum</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <div className="bg-indigo-500/20 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-indigo-400 text-xs font-bold">3</span>
                      </div>
                      <span>Celebrate your progress as you complete each short-term goal to stay motivated</span>
                    </li>
                    <li className="flex items-start gap-3 text-white/80">
                      <div className="bg-indigo-500/20 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-indigo-400 text-xs font-bold">4</span>
                      </div>
                      <span>Share your plan with a study partner or mentor who can help keep you accountable</span>
                    </li>
                  </ul>
                </motion.div>

                {/* Continue button */}
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleContinue}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 px-8 py-6"
                    size="lg"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Continue to Next Phase
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

