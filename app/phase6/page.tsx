"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Download,
  Printer,
  Share2,
  Target,
  LineChart,
  RefreshCw,
  Lightbulb,
  BookOpen,
  Brain,
  Sparkles,
  GraduationCap,
  ArrowRight,
  Home,
  Medal,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ModuleBar from "@/components/module-bar"

// Add interface definitions at the top to fix type errors

interface LearningGoal {
  goal: string;
  timeframe: string;
  actions: string[];
  strategies: Strategy[];
}

interface Strategy {
  name: string;
  description: string;
}

interface IfThenStrategy {
  challenge: string;
  response: string;
}

interface ProgressIndicator {
  indicator: string;
  measurementMethod: string;
  frequency: string;
}

interface CheckIn {
  timing: string;
  purpose: string;
}

interface SuccessCriteria {
  goal: string;
  criteria: string;
  evidence: string;
}

interface AdaptationTrigger {
  trigger: string;
  response: string;
}

export default function Phase6Content() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("plan")
  const [learningPlan, setLearningPlan] = useState<{
    longTermGoal: string;
    shortTermGoals: LearningGoal[];
    ifThenStrategies: IfThenStrategy[];
  }>({
    longTermGoal: "",
    shortTermGoals: [],
    ifThenStrategies: [],
  })
  const [monitoringSystem, setMonitoringSystem] = useState<{
    progressIndicators: ProgressIndicator[];
    checkIns: CheckIn[];
    successCriteria: SuccessCriteria[];
    adaptationTriggers: AdaptationTrigger[];
    reflectionPrompts: string[];
  }>({
    progressIndicators: [],
    checkIns: [],
    successCriteria: [],
    adaptationTriggers: [],
    reflectionPrompts: [],
  })
  const [loading, setLoading] = useState(true)

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // Load strategic plan
        const savedPlan = localStorage.getItem("solbot_strategic_plan")
        if (savedPlan) {
          setLearningPlan(JSON.parse(savedPlan))
        }

        // Load monitoring system
        const savedMonitoring = localStorage.getItem("solbot_monitoring_system")
        if (savedMonitoring) {
          setMonitoringSystem(JSON.parse(savedMonitoring))
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading saved data:", error)
        setLoading(false)
      }
    }

    loadSavedData()
  }, [])

  // Fix the handleTabChange function with proper type
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleDownloadSummary = () => {
    try {
      // Create a text summary of the entire learning system
      let summaryText = "SELF-REGULATED LEARNING SYSTEM SUMMARY\n\n"

      // Long-term goal
      summaryText += "LONG-TERM GOAL:\n"
      summaryText += `${learningPlan.longTermGoal || "Not specified"}\n\n`

      // Short-term goals
      summaryText += "SHORT-TERM OBJECTIVES:\n"
      if (learningPlan.shortTermGoals && learningPlan.shortTermGoals.length > 0) {
        learningPlan.shortTermGoals.forEach((goal, index) => {
          summaryText += `${index + 1}. ${goal.goal}\n`
          summaryText += `   Timeframe: ${goal.timeframe}\n`

          if (goal.actions && goal.actions.length > 0) {
            summaryText += "   Actions:\n"
            goal.actions.forEach((action) => {
              summaryText += `   - ${action}\n`
            })
          }

          if (goal.strategies && goal.strategies.length > 0) {
            summaryText += "   Learning Strategies:\n"
            goal.strategies.forEach((strategy) => {
              if (strategy) {
                summaryText += `   - ${strategy.name}: ${strategy.description}\n`
              }
            })
          }
          summaryText += "\n"
        })
      } else {
        summaryText += "No short-term goals specified.\n\n"
      }

      // Contingency plans
      summaryText += "CONTINGENCY PLANS:\n"
      if (learningPlan.ifThenStrategies && learningPlan.ifThenStrategies.length > 0) {
        learningPlan.ifThenStrategies.forEach((strategy, index) => {
          summaryText += `${index + 1}. IF ${strategy.challenge}\n   THEN ${strategy.response}\n\n`
        })
      } else {
        summaryText += "No contingency plans specified.\n\n"
      }

      // Monitoring system
      summaryText += "MONITORING SYSTEM:\n\n"

      // Progress indicators
      summaryText += "Progress Indicators:\n"
      if (monitoringSystem.progressIndicators && monitoringSystem.progressIndicators.length > 0) {
        monitoringSystem.progressIndicators.forEach((item, index) => {
          if (item.indicator) {
            summaryText += `${index + 1}. ${item.indicator}\n`
            summaryText += `   Measurement: ${item.measurementMethod}\n`
            summaryText += `   Frequency: ${item.frequency}\n`
          }
        })
      } else {
        summaryText += "No progress indicators specified.\n"
      }
      summaryText += "\n"

      // Check-in schedule
      summaryText += "Check-in Schedule:\n"
      if (monitoringSystem.checkIns && monitoringSystem.checkIns.length > 0) {
        monitoringSystem.checkIns.forEach((item, index) => {
          if (item.timing) {
            summaryText += `${index + 1}. ${item.timing}\n`
            summaryText += `   Purpose: ${item.purpose}\n`
          }
        })
      } else {
        summaryText += "No check-in schedule specified.\n"
      }
      summaryText += "\n"

      // Success criteria
      summaryText += "Success Criteria:\n"
      if (monitoringSystem.successCriteria && monitoringSystem.successCriteria.length > 0) {
        monitoringSystem.successCriteria.forEach((item, index) => {
          if (item.goal) {
            summaryText += `${index + 1}. Goal: ${item.goal}\n`
            summaryText += `   Criteria: ${item.criteria}\n`
            summaryText += `   Evidence: ${item.evidence}\n`
          }
        })
      } else {
        summaryText += "No success criteria specified.\n"
      }
      summaryText += "\n"

      // Adaptation triggers
      summaryText += "Adaptation Framework:\n"
      if (monitoringSystem.adaptationTriggers && monitoringSystem.adaptationTriggers.length > 0) {
        monitoringSystem.adaptationTriggers.forEach((item, index) => {
          if (item.trigger) {
            summaryText += `${index + 1}. IF ${item.trigger}\n   THEN ${item.response}\n`
          }
        })
      } else {
        summaryText += "No adaptation framework specified.\n"
      }
      summaryText += "\n"

      // Reflection prompts
      summaryText += "Reflection Prompts:\n"
      if (monitoringSystem.reflectionPrompts && monitoringSystem.reflectionPrompts.length > 0) {
        monitoringSystem.reflectionPrompts.forEach((prompt, index) => {
          if (prompt) {
            summaryText += `${index + 1}. ${prompt}\n`
          }
        })
      } else {
        summaryText += "No reflection prompts specified.\n"
      }

      // Create a blob and download it
      const blob = new Blob([summaryText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "self_regulated_learning_system.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error creating summary:", error)
    }
  }

  const handleReturnHome = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-indigo-400">Loading your learning system summary...</p>
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

      {/* Add Module Bar */}
      <ModuleBar currentPhase={6} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-indigo-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Medal className="h-6 w-6 text-rose-500 mr-2" />
            <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text">
              Phase 6: Learning Journey Summary
            </h2>
          </div>
        </div>
      </div>

      {/* Fixed Phase Title that stays visible when scrolling */}
      <div className="fixed top-16 left-0 right-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-emerald-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <h2 className="text-lg md:text-xl font-bold text-emerald-400">
              Task Analysis & Resource Identification
            </h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSummary}
                    className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Summary
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
                          title: "My Self-Regulated Learning System",
                          text: "Check out my complete learning system created with SoLBot!",
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
                <GraduationCap className="h-8 w-8 text-purple-500" />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                  Your Complete Learning System
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 space-y-4 mb-6">
                <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-lg p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                    🎓 Your Learning Journey - Complete! 🎓
                  </h3>
                  
                  <p className="mb-4">
                    <span className="font-semibold text-purple-300">Congratulations!</span> You've mastered the science of learning and built your personalized self-regulated learning system. This is a significant achievement that will transform how you approach all future learning.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-indigo-500/20">
                      <h4 className="font-bold text-indigo-300 text-sm mb-2">✨ What You've Accomplished</h4>
                      <p className="text-white/80 text-sm">Created a complete self-regulated learning framework based on cognitive science that will help you learn more effectively in any subject.</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-indigo-500/20">
                      <h4 className="font-bold text-indigo-300 text-sm mb-2">🔍 What You'll See Below</h4>
                      <p className="text-white/80 text-sm">Your complete learning plan, monitoring system, and program summary - all designed by you and ready to implement.</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-indigo-500/20">
                      <h4 className="font-bold text-indigo-300 text-sm mb-2">🚀 Next Steps</h4>
                      <p className="text-white/80 text-sm">Download your summary, implement your plan, and start experiencing the benefits of evidence-based learning strategies.</p>
                    </div>
                  </div>
                  
                  <p className="text-center text-sm text-white/70">
                    Use the tabs below to explore different aspects of your learning system.
                  </p>
                </div>
              </div>

              {/* Tabs for different summary views */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="plan" className="text-sm">
                    <Target className="h-4 w-4 mr-2" />
                    Learning Plan
                  </TabsTrigger>
                  <TabsTrigger value="monitoring" className="text-sm">
                    <LineChart className="h-4 w-4 mr-2" />
                    Monitoring System
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="text-sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Program Summary
                  </TabsTrigger>
                </TabsList>

                {/* Learning Plan Tab */}
                <TabsContent value="plan">
                  <Card className="bg-slate-800/50 border border-indigo-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="h-6 w-6 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Your Strategic Learning Plan</h3>
                      </div>

                      {/* Long-term goal */}
                      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-4 border border-purple-500/30 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-purple-400" />
                          <h4 className="font-bold text-white">Long-Term Goal</h4>
                        </div>
                        <p className="text-white/90 pl-4 border-l-2 border-purple-500">
                          {learningPlan.longTermGoal || "No long-term goal specified"}
                        </p>
                      </div>

                      {/* Short-term goals */}
                      <div className="space-y-4 mb-6">
                        <h4 className="font-bold text-indigo-400">Short-Term Objectives</h4>

                        {learningPlan.shortTermGoals && learningPlan.shortTermGoals.length > 0 ? (
                          learningPlan.shortTermGoals.map((goal, index) => (
                            <div key={index} className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                                  {index + 1}
                                </Badge>
                                <h5 className="font-bold text-white">{goal.goal}</h5>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <h6 className="text-sm font-medium text-blue-400 mb-2">Timeframe:</h6>
                                  <p className="text-white/80 text-sm">{goal.timeframe}</p>

                                  <h6 className="text-sm font-medium text-blue-400 mt-4 mb-2">Actions:</h6>
                                  <ul className="space-y-1 pl-2">
                                    {goal.actions &&
                                      goal.actions.map((action, actionIdx) => (
                                        <li key={actionIdx} className="flex items-start gap-2 text-white/80 text-sm">
                                          <ArrowRight className="h-3 w-3 text-blue-400 mt-1 flex-shrink-0" />
                                          <span>{action}</span>
                                        </li>
                                      ))}
                                    {(!goal.actions || goal.actions.length === 0) && (
                                      <li className="text-white/60 text-sm italic">No actions specified</li>
                                    )}
                                  </ul>
                                </div>

                                <div>
                                  <h6 className="text-sm font-medium text-emerald-400 mb-2">Learning Strategies:</h6>
                                  <div className="space-y-2">
                                    {goal.strategies &&
                                      goal.strategies.map(
                                        (strategy, stratIdx) =>
                                          strategy && (
                                            <div
                                              key={stratIdx}
                                              className="bg-emerald-500/10 rounded p-2 border border-emerald-500/20"
                                            >
                                              <p className="text-emerald-400 text-sm font-medium">{strategy.name}</p>
                                              <p className="text-white/70 text-xs">{strategy.description}</p>
                                            </div>
                                          ),
                                      )}
                                    {(!goal.strategies || goal.strategies.length === 0) && (
                                      <p className="text-white/60 text-sm italic">No strategies specified</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-white/60 italic">No short-term goals specified</p>
                        )}
                      </div>

                      {/* Contingency plans */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-amber-400">Contingency Plans</h4>

                        <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-500/30">
                          {learningPlan.ifThenStrategies && learningPlan.ifThenStrategies.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {learningPlan.ifThenStrategies.map((strategy, index) => (
                                <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-amber-500/20">
                                  <div className="mb-2">
                                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">IF</Badge>
                                    <p className="mt-1 text-white/90 text-sm">{strategy.challenge}</p>
                                  </div>
                                  <div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                      THEN
                                    </Badge>
                                    <p className="mt-1 text-white/90 text-sm">{strategy.response}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-white/60 italic">No contingency plans specified</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Monitoring System Tab */}
                <TabsContent value="monitoring">
                  <Card className="bg-slate-800/50 border border-indigo-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <LineChart className="h-6 w-6 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Your Monitoring System</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Progress Indicators */}
                        <div className="bg-slate-800/70 rounded-lg p-4 border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <LineChart className="h-5 w-5 text-indigo-400" />
                            <h4 className="font-bold text-white text-sm">Progress Indicators</h4>
                          </div>

                          {monitoringSystem.progressIndicators && monitoringSystem.progressIndicators.length > 0 ? (
                            <div className="space-y-3">
                              {monitoringSystem.progressIndicators.map(
                                (item, index) =>
                                  item.indicator && (
                                    <div
                                      key={index}
                                      className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20"
                                    >
                                      <p className="text-white/90 text-sm font-medium">{item.indicator}</p>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
                                        <span>Measured via: {item.measurementMethod}</span>
                                        <span>•</span>
                                        <span>Frequency: {item.frequency}</span>
                                      </div>
                                    </div>
                                  ),
                              )}
                            </div>
                          ) : (
                            <p className="text-white/60 italic text-sm">No progress indicators specified</p>
                          )}
                        </div>

                        {/* Check-in Schedule */}
                        <div className="bg-slate-800/70 rounded-lg p-4 border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-5 w-5 text-indigo-400" />
                            <h4 className="font-bold text-white text-sm">Check-in Schedule</h4>
                          </div>

                          {monitoringSystem.checkIns && monitoringSystem.checkIns.length > 0 ? (
                            <div className="space-y-3">
                              {monitoringSystem.checkIns.map(
                                (item, index) =>
                                  item.timing && (
                                    <div
                                      key={index}
                                      className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20"
                                    >
                                      <p className="text-white/90 text-sm font-medium">{item.timing}</p>
                                      <p className="text-white/70 text-xs mt-1">Purpose: {item.purpose}</p>
                                    </div>
                                  ),
                              )}
                            </div>
                          ) : (
                            <p className="text-white/60 italic text-sm">No check-in schedule specified</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Success Criteria */}
                        <div className="bg-slate-800/70 rounded-lg p-4 border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="h-5 w-5 text-indigo-400" />
                            <h4 className="font-bold text-white text-sm">Success Criteria</h4>
                          </div>

                          {monitoringSystem.successCriteria && monitoringSystem.successCriteria.length > 0 ? (
                            <div className="space-y-3">
                              {monitoringSystem.successCriteria.map(
                                (item, index) =>
                                  item.goal && (
                                    <div
                                      key={index}
                                      className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20"
                                    >
                                      <p className="text-white/90 text-sm font-medium">{item.goal}</p>
                                      <p className="text-white/70 text-xs mt-1">Criteria: {item.criteria}</p>
                                      <p className="text-white/70 text-xs mt-1">Evidence: {item.evidence}</p>
                                    </div>
                                  ),
                              )}
                            </div>
                          ) : (
                            <p className="text-white/60 italic text-sm">No success criteria specified</p>
                          )}
                        </div>

                        {/* Adaptation Triggers */}
                        <div className="bg-slate-800/70 rounded-lg p-4 border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <RefreshCw className="h-5 w-5 text-indigo-400" />
                            <h4 className="font-bold text-white text-sm">Adaptation Framework</h4>
                          </div>

                          {monitoringSystem.adaptationTriggers && monitoringSystem.adaptationTriggers.length > 0 ? (
                            <div className="space-y-3">
                              {monitoringSystem.adaptationTriggers.map(
                                (item, index) =>
                                  item.trigger && (
                                    <div
                                      key={index}
                                      className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20"
                                    >
                                      <div className="flex items-start gap-2">
                                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mt-0.5">
                                          IF
                                        </Badge>
                                        <p className="text-white/90 text-sm">{item.trigger}</p>
                                      </div>
                                      <div className="flex items-start gap-2 mt-2">
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mt-0.5">
                                          THEN
                                        </Badge>
                                        <p className="text-white/90 text-sm">{item.response}</p>
                                      </div>
                                    </div>
                                  ),
                              )}
                            </div>
                          ) : (
                            <p className="text-white/60 italic text-sm">No adaptation framework specified</p>
                          )}
                        </div>
                      </div>

                      {/* Reflection Prompts */}
                      <div className="bg-slate-800/70 rounded-lg p-4 border border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-5 w-5 text-indigo-400" />
                          <h4 className="font-bold text-white text-sm">Reflection Prompts</h4>
                        </div>

                        {monitoringSystem.reflectionPrompts && monitoringSystem.reflectionPrompts.length > 0 ? (
                          <div className="space-y-2">
                            {monitoringSystem.reflectionPrompts.map(
                              (prompt, index) =>
                                prompt && (
                                  <div key={index} className="flex items-start gap-2">
                                    <div className="bg-indigo-500/20 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-indigo-400 text-xs">{index + 1}</span>
                                    </div>
                                    <p className="text-white/90 text-sm">{prompt}</p>
                                  </div>
                                ),
                            )}
                          </div>
                        ) : (
                          <p className="text-white/60 italic text-sm">No reflection prompts specified</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Program Summary Tab */}
                <TabsContent value="summary">
                  <Card className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="h-6 w-6 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Program Overview</h3>
                      </div>

                      {/* Journey Progress */}
                      <div className="mb-8">
                        <div className="relative flex items-center justify-between mb-2">
                          <div className="absolute left-0 right-0 h-1 bg-slate-700/50"></div>

                          {/* Phase 1-3 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/80 to-indigo-600/80 flex items-center justify-center shadow-lg">
                              <Brain className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-blue-400 mt-2">Foundations</span>
                          </div>

                          {/* Phase 4 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-600/80 flex items-center justify-center shadow-lg">
                              <Target className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-indigo-400 mt-2">Planning</span>
                          </div>

                          {/* Phase 5 */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/80 to-pink-600/80 flex items-center justify-center shadow-lg">
                              <LineChart className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-purple-400 mt-2">Monitoring</span>
                          </div>

                          {/* Phase 6 - Current */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/30 animate-pulse">
                              <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xs font-medium text-emerald-400 mt-2">Complete!</span>
                          </div>
                        </div>
                      </div>

                      {/* Learning Strategies Grid */}
                      <div className="mb-8">
                        <h4 className="text-sm font-semibold text-indigo-400 mb-3">Key Learning Strategies</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-800/70 rounded-lg p-3 border border-indigo-500/20 hover:bg-slate-800/90 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-blue-400"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 16v-4" />
                                  <path d="M12 8h.01" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-white">Retrieval Practice</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/70 rounded-lg p-3 border border-indigo-500/20 hover:bg-slate-800/90 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-purple-400"
                                >
                                  <path d="M8 2v4" />
                                  <path d="M16 2v4" />
                                  <rect width="18" height="18" x="3" y="4" rx="2" />
                                  <path d="M3 10h18" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-white">Spacing Effect</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/70 rounded-lg p-3 border border-indigo-500/20 hover:bg-slate-800/90 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-indigo-400"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-white">Self-Explanation</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/70 rounded-lg p-3 border border-indigo-500/20 hover:bg-slate-800/90 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-emerald-400"
                                >
                                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                  <path d="m9 12 2 2 4-4" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-white">Self-Regulation</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Learning System Components */}
                      <div className="mb-8">
                        <h4 className="text-sm font-semibold text-indigo-400 mb-3">Your Learning System Components</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-lg p-4 border border-indigo-500/30 hover:from-indigo-900/40 hover:to-purple-900/40 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <Target className="h-8 w-8 text-indigo-400 mb-2" />
                              <h5 className="text-sm font-bold text-white mb-1">Strategic Plan</h5>
                              <ul className="text-xs text-white/80 space-y-1">
                                <li>Long-term goal</li>
                                <li>Short-term objectives</li>
                                <li>Contingency plans</li>
                              </ul>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30 hover:from-purple-900/40 hover:to-pink-900/40 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <LineChart className="h-8 w-8 text-purple-400 mb-2" />
                              <h5 className="text-sm font-bold text-white mb-1">Monitoring System</h5>
                              <ul className="text-xs text-white/80 space-y-1">
                                <li>Progress indicators</li>
                                <li>Check-in schedule</li>
                                <li>Success criteria</li>
                              </ul>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-pink-900/30 to-amber-900/30 rounded-lg p-4 border border-pink-500/30 hover:from-pink-900/40 hover:to-amber-900/40 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <RefreshCw className="h-8 w-8 text-pink-400 mb-2" />
                              <h5 className="text-sm font-bold text-white mb-1">Adaptation Framework</h5>
                              <ul className="text-xs text-white/80 space-y-1">
                                <li>Adaptation triggers</li>
                                <li>Reflection prompts</li>
                                <li>Strategy adjustments</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Implementation Steps */}
                      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-lg p-4 border border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-5 w-5 text-emerald-400" />
                          <h4 className="font-bold text-white text-sm">Implementation Steps</h4>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/20 hover:bg-slate-800/70 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="bg-emerald-500/20 h-8 w-8 rounded-full flex items-center justify-center mb-2">
                                <span className="text-emerald-400 text-xs font-bold">1</span>
                              </div>
                              <span className="text-xs text-white">Schedule check-ins</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/20 hover:bg-slate-800/70 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="bg-emerald-500/20 h-8 w-8 rounded-full flex items-center justify-center mb-2">
                                <span className="text-emerald-400 text-xs font-bold">2</span>
                              </div>
                              <span className="text-xs text-white">Set up tracking</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/20 hover:bg-slate-800/70 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="bg-emerald-500/20 h-8 w-8 rounded-full flex items-center justify-center mb-2">
                                <span className="text-emerald-400 text-xs font-bold">3</span>
                              </div>
                              <span className="text-xs text-white">Review weekly</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/20 hover:bg-slate-800/70 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="bg-emerald-500/20 h-8 w-8 rounded-full flex items-center justify-center mb-2">
                                <span className="text-emerald-400 text-xs font-bold">4</span>
                              </div>
                              <span className="text-xs text-white">Share with others</span>
                            </div>
                          </div>

                          <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/20 hover:bg-slate-800/70 transition-colors">
                            <div className="flex flex-col items-center text-center">
                              <div className="bg-emerald-500/20 h-8 w-8 rounded-full flex items-center justify-center mb-2">
                                <span className="text-emerald-400 text-xs font-bold">5</span>
                              </div>
                              <span className="text-xs text-white">Celebrate progress</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Congratulations and Next Steps */}
                      <div className="mt-8">
                        <Card className="bg-gradient-to-br from-indigo-700/40 to-purple-800/40 border border-indigo-500/50">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-4">
                              <GraduationCap className="h-6 w-6 text-indigo-300" />
                              <h3 className="text-lg font-bold text-white">Congratulations!</h3>
                            </div>

                            <p className="text-white/90 mb-4">
                              You've successfully completed the Science of Learning program! You now have a
                              comprehensive self-regulated learning system based on cognitive science principles. This
                              system will help you:
                            </p>

                            <ul className="space-y-2 pl-2 mb-6">
                              <li className="flex items-start gap-2 text-white/90">
                                <CheckCircle className="h-4 w-4 text-indigo-300 mt-0.5 flex-shrink-0" />
                                <span>Study more efficiently and effectively</span>
                              </li>
                              <li className="flex items-start gap-2 text-white/90">
                                <CheckCircle className="h-4 w-4 text-indigo-300 mt-0.5 flex-shrink-0" />
                                <span>Retain information longer</span>
                              </li>
                              <li className="flex items-start gap-2 text-white/90">
                                <CheckCircle className="h-4 w-4 text-indigo-300 mt-0.5 flex-shrink-0" />
                                <span>Monitor your progress and identify areas for improvement</span>
                              </li>
                              <li className="flex items-start gap-2 text-white/90">
                                <CheckCircle className="h-4 w-4 text-indigo-300 mt-0.5 flex-shrink-0" />
                                <span>Adapt your approach when strategies aren't working</span>
                              </li>
                              <li className="flex items-start gap-2 text-white/90">
                                <CheckCircle className="h-4 w-4 text-indigo-300 mt-0.5 flex-shrink-0" />
                                <span>Achieve your learning goals with greater confidence</span>
                              </li>
                            </ul>

                            <div className="flex justify-center mt-6">
                              <Button
                                onClick={handleReturnHome}
                                className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-500/30 px-8 py-6 text-lg text-white font-medium"
                              >
                                <Home className="mr-2 h-5 w-5" />
                                Return to Home
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="text-center text-white/60 text-sm">
              <p>Science of Learning Bot (SoLBot) - Helping you learn how to learn more effectively</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

