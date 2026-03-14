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
  Zap,
  RotateCw,
  MessageSquare,
  ChevronRight,
  BarChart2,
  Map,
  Send,
  Star,
  FileText,
  Bot,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ModuleBar from "@/components/module-bar"
import { Input } from "@/components/ui/input"
import { SrlSummary } from "@/components/srl-summary"
import { SrlFeedback } from "@/components/srl-feedback"

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

interface SummaryData {
  total_time_seconds: number;
  phases_completed: number;
  score_improvement: number;
}

export default function SummaryPage() {
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
  const [userName, setUserName] = useState("")
  const [summaryData, setSummaryData] = useState({
    phasesCompleted: 0,
    totalAssessments: 0,
  })
  const [insights, setInsights] = useState<{
    keywords?: string[];
    learningStrategies?: string[];
    goals?: string[];
    strengths?: string[];
    recommendations?: string[];
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const accent = "var(--accent-text)"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  const foreground = "hsl(var(--foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  }

  // Load saved data from localStorage and fetch user data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load strategic plan from localStorage
        const savedPlan = localStorage.getItem("solbot_strategic_plan")
        if (savedPlan) {
          setLearningPlan(JSON.parse(savedPlan))
        }

        // Load monitoring system from localStorage
        const savedMonitoring = localStorage.getItem("solbot_monitoring_system")
        if (savedMonitoring) {
          setMonitoringSystem(JSON.parse(savedMonitoring))
        }

        const storedName = localStorage.getItem("solbot_user_name")
        if (storedName) {
          setUserName(storedName)
        }

        const storedSessionId = localStorage.getItem("session_id")
        if (storedSessionId) {
          setSessionId(storedSessionId)
          
          // Fetch personalized summary data from API
          try {
            const response = await fetch(`/api/summary?session_id=${storedSessionId}`)
            if (response.ok) {
              const data = await response.json()
              
              // Update user name if available
              if (data.user?.name) {
                setUserName(data.user.name)
              }
              
              // Update summary data
              if (data.summary) {
                setSummaryData({
                  phasesCompleted: data.summary.phasesCompleted || 0,
                  totalAssessments: data.summary.totalAssessments || 0,
                })
              }
              
              // Update insights
              if (data.insights) {
                setInsights(data.insights)
              }
            }
          } catch (error) {
            console.error("Error fetching summary data:", error)
            // Continue with localStorage data if API fails
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading saved data:", error)
        setLoading(false)
      }
    }

    loadData()
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

  const handleGoHome = () => {
    router.push("/")
  }

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim() || !sessionId) return;

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'final_feedback',
          phase: '6',
          component: 'reflection',
          metadata: {
            feedback_text: feedback.trim(),
          },
        }),
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen text-foreground py-8 flex items-center justify-center"
        style={{ background: canvasGradient }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mb-4" style={{ borderColor: neutralBorder }}></div>
          <p style={{ color: mutedText }}>Loading your learning system summary...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-foreground py-8"
      style={{ background: canvasGradient }}
    >
      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={6} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto mt-16">
          <Card
            className="border shadow-xl mb-6"
            style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-3xl font-bold">
                <Medal className="mr-3 h-8 w-8" style={{ color: accent }} />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
                  Learning Journey Summary
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Personalized Insights Section */}
              {insights && (insights.keywords?.some(k => k?.trim()) || insights.learningStrategies?.some(s => s?.trim()) || insights.goals?.some(g => g?.trim()) || insights.strengths?.some(s => s?.trim()) || insights.recommendations?.some(r => r?.trim())) && (
                <div className="mb-8 space-y-6">
                  {/* Key Learning Topics */}
                  {insights.keywords && insights.keywords.filter(k => k?.trim()).length > 0 && (
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: "hsl(var(--muted))", borderColor: neutralBorder }}>
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: accent }}>
                        <Target className="h-5 w-5" />
                        Key Learning Topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.keywords.filter(k => k?.trim()).map((keyword, idx) => (
                          <Badge 
                            key={idx}
                            className="px-3 py-1"
                            style={{ 
                              backgroundColor: "hsl(var(--primary) / 0.15)",
                              color: foreground,
                              borderColor: neutralBorder
                            }}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Strategies */}
                  {insights.learningStrategies && insights.learningStrategies.filter(s => s?.trim()).length > 0 && (
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: "hsl(var(--muted))", borderColor: neutralBorder }}>
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: accent }}>
                        <Lightbulb className="h-5 w-5" />
                        Your Learning Strategies
                      </h4>
                      <ul className="space-y-2">
                        {insights.learningStrategies.filter(s => s?.trim()).map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2" style={{ color: foreground }}>
                            <span style={{ color: accent }}>•</span>
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Goals */}
                  {insights.goals && insights.goals.filter(g => g?.trim()).length > 0 && (
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: "hsl(var(--muted))", borderColor: neutralBorder }}>
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: accent }}>
                        <Target className="h-5 w-5" />
                        Your Learning Goals
                      </h4>
                      <ul className="space-y-2">
                        {insights.goals.filter(g => g?.trim()).map((goal, idx) => (
                          <li key={idx} className="flex items-start gap-2" style={{ color: foreground }}>
                            <span style={{ color: accent }}>•</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  {insights.strengths && insights.strengths.filter(s => s?.trim()).length > 0 && (
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: "hsl(var(--muted))", borderColor: neutralBorder }}>
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: accent }}>
                        <Medal className="h-5 w-5" />
                        Your Strengths
                      </h4>
                      <ul className="space-y-2">
                        {insights.strengths.filter(s => s?.trim()).map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2" style={{ color: foreground }}>
                            <span style={{ color: accent }}>✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {insights.recommendations && insights.recommendations.filter(r => r?.trim()).length > 0 && (
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: "hsl(var(--muted))", borderColor: neutralBorder }}>
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: accent }}>
                        <Zap className="h-5 w-5" />
                        Personalized Recommendations
                      </h4>
                      <ul className="space-y-3">
                        {insights.recommendations.filter(r => r?.trim()).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: "hsl(var(--card))" }}>
                            <span className="font-bold" style={{ color: accent }}>{idx + 1}.</span>
                            <span style={{ color: foreground }}>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!insights && summaryData.phasesCompleted > 0 && (
                <div className="mb-8 p-6 rounded-lg border text-center" style={{ backgroundColor: "hsl(var(--muted))", borderColor: neutralBorder }}>
                  <p style={{ color: mutedText }}>Loading your personalized insights...</p>
                </div>
              )}
              
              <SrlSummary />

              {/* Personal Learning Plan Section */}
              {(() => {
                const hasLongTermGoal = !!learningPlan.longTermGoal?.trim();
                const hasShortTermGoals = learningPlan.shortTermGoals.some(g => g.goal?.trim());
                const hasIfThen = learningPlan.ifThenStrategies.some(s => s.challenge?.trim() && s.response?.trim());
                const hasProgressIndicators = monitoringSystem.progressIndicators.some(i => i.indicator?.trim());
                const hasAdaptationTriggers = monitoringSystem.adaptationTriggers.some(t => t.trigger?.trim());
                const hasAnyPlanData = hasLongTermGoal || hasShortTermGoals || hasIfThen || hasProgressIndicators || hasAdaptationTriggers;

                if (!hasAnyPlanData) return null;

                return (
                <div className="mt-8 space-y-6">
                  <h3 className="text-2xl font-bold text-center" style={{ color: accent }}>
                    Your Learning Plan
                  </h3>
                  <p className="text-center text-sm" style={{ color: mutedText }}>
                    Here's the plan you built throughout the training.
                  </p>

                  {/* Long-term Goal */}
                  {hasLongTermGoal && (
                    <div
                      className="p-5 rounded-xl border"
                      style={{ backgroundColor: "hsl(var(--card) / 0.7)", borderColor: neutralBorder }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
                        >
                          <Target className="h-4 w-4" style={{ color: accent }} />
                        </div>
                        <h4 className="font-semibold" style={{ color: foreground }}>Long-term Goal</h4>
                      </div>
                      <p className="text-sm pl-10" style={{ color: foreground }}>{learningPlan.longTermGoal}</p>
                    </div>
                  )}

                  {/* Short-term Goals */}
                  {hasShortTermGoals && (
                    <div
                      className="p-5 rounded-xl border"
                      style={{ backgroundColor: "hsl(var(--card) / 0.7)", borderColor: neutralBorder }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
                        >
                          <CheckCircle className="h-4 w-4" style={{ color: accent }} />
                        </div>
                        <h4 className="font-semibold" style={{ color: foreground }}>Short-term Objectives</h4>
                      </div>
                      <div className="space-y-4 pl-10">
                        {learningPlan.shortTermGoals.filter(g => g.goal?.trim()).map((goal, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-start gap-2">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0"
                                style={{ backgroundColor: "hsl(var(--primary) / 0.12)", color: accent }}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium" style={{ color: foreground }}>{goal.goal}</p>
                                {goal.timeframe && (
                                  <p className="text-xs mt-0.5" style={{ color: mutedText }}>Timeframe: {goal.timeframe}</p>
                                )}
                                {goal.strategies && goal.strategies.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {goal.strategies.map((s, sIdx) => s && (
                                      <span
                                        key={sIdx}
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: "hsl(var(--primary) / 0.08)", color: accent }}
                                      >
                                        {s.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If-Then Contingency Plans */}
                  {hasIfThen && (
                    <div
                      className="p-5 rounded-xl border"
                      style={{ backgroundColor: "hsl(var(--card) / 0.7)", borderColor: neutralBorder }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
                        >
                          <RefreshCw className="h-4 w-4" style={{ color: accent }} />
                        </div>
                        <h4 className="font-semibold" style={{ color: foreground }}>Contingency Plans</h4>
                      </div>
                      <div className="space-y-3 pl-10">
                        {learningPlan.ifThenStrategies.filter(s => s.challenge?.trim() && s.response?.trim()).map((strategy, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg text-sm"
                            style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
                          >
                            <p style={{ color: foreground }}>
                              <span className="font-semibold" style={{ color: accent }}>IF </span>
                              {strategy.challenge}
                            </p>
                            <p className="mt-1" style={{ color: foreground }}>
                              <span className="font-semibold" style={{ color: accent }}>THEN </span>
                              {strategy.response}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monitoring Highlights */}
                  {(hasProgressIndicators || hasAdaptationTriggers) && (
                    <div
                      className="p-5 rounded-xl border"
                      style={{ backgroundColor: "hsl(var(--card) / 0.7)", borderColor: neutralBorder }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
                        >
                          <LineChart className="h-4 w-4" style={{ color: accent }} />
                        </div>
                        <h4 className="font-semibold" style={{ color: foreground }}>Monitoring System</h4>
                      </div>
                      <div className="space-y-3 pl-10">
                        {monitoringSystem.progressIndicators.filter(i => i.indicator).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: accent }}>
                              Progress Indicators
                            </p>
                            {monitoringSystem.progressIndicators.filter(i => i.indicator).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm mb-1">
                                <span style={{ color: accent }}>•</span>
                                <span style={{ color: foreground }}>{item.indicator}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {monitoringSystem.adaptationTriggers.filter(t => t.trigger).length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: accent }}>
                              Adaptation Triggers
                            </p>
                            {monitoringSystem.adaptationTriggers.filter(t => t.trigger).map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg text-sm mb-2"
                                style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
                              >
                                <p style={{ color: foreground }}>
                                  <span className="font-semibold" style={{ color: accent }}>IF </span>
                                  {item.trigger}
                                </p>
                                <p className="mt-1" style={{ color: foreground }}>
                                  <span className="font-semibold" style={{ color: accent }}>THEN </span>
                                  {item.response}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Download Button */}
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      className="text-foreground"
                      style={{ borderColor: neutralBorder }}
                      onClick={handleDownloadSummary}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Full Plan
                    </Button>
                  </div>
                </div>
                );
              })()}

              <SrlFeedback />
            </CardContent>
          </Card>
          <div className="text-center mt-6">
            <Button
              variant="outline"
              className="text-foreground"
              style={{ borderColor: neutralBorder }}
              onClick={handleGoHome}
            >
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

