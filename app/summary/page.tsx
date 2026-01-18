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
    totalTimeSeconds: 0,
    totalTimeMinutes: 0,
    totalTimeHours: 0,
    phasesCompleted: 0,
    averageScore: null as number | null,
    scoreImprovement: null as number | null,
    firstScore: null as number | null,
    lastScore: null as number | null,
    totalAssessments: 0,
    totalRevisions: 0,
  })
  const [phaseStats, setPhaseStats] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [quizScores, setQuizScores] = useState<any[]>([])
  const [videoStats, setVideoStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const accent = "#d8b26f"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.8)"
  const mutedText = "hsl(var(--muted-foreground))"
  const foreground = "hsl(var(--foreground))"
  const primaryButtonStyle = {
    backgroundImage: `linear-gradient(135deg, ${accent}, #e6c98c)`,
    color: "#1f1408",
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
                  totalTimeSeconds: data.summary.totalTimeSeconds || 0,
                  totalTimeMinutes: data.summary.totalTimeMinutes || 0,
                  totalTimeHours: data.summary.totalTimeHours || 0,
                  phasesCompleted: data.summary.phasesCompleted || 0,
                  averageScore: data.summary.averageScore,
                  scoreImprovement: data.summary.scoreImprovement,
                  firstScore: data.summary.firstScore,
                  lastScore: data.summary.lastScore,
                  totalAssessments: data.summary.totalAssessments || 0,
                  totalRevisions: data.summary.totalRevisions || 0,
                })
              }
              
              // Update phase stats and other data
              if (data.phaseStats) setPhaseStats(data.phaseStats)
              if (data.assessments) setAssessments(data.assessments)
              if (data.quizScores) setQuizScores(data.quizScores)
              if (data.videoStats) setVideoStats(data.videoStats)
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
          className="max-w-4xl mx-auto mt-16"
        >
          <Card
            className="border shadow-xl mb-6"
            style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-3xl font-bold">
                <Medal className="mr-3 h-8 w-8" style={{ color: accent }} />
                <span className="bg-gradient-to-r from-[#d8b26f] to-[#e6c98c] bg-clip-text text-transparent">
                  Learning Journey Summary
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Personalized Summary Section */}
              {summaryData.phasesCompleted > 0 && (
                <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: "hsl(var(--muted))", borderColor: neutralBorder }}>
                  <h4 className="text-xl font-bold mb-4" style={{ color: accent }}>
                    Your Learning Journey
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm" style={{ color: mutedText }}>Phases Completed</p>
                      <p className="text-2xl font-bold" style={{ color: foreground }}>
                        {summaryData.phasesCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: mutedText }}>Total Time</p>
                      <p className="text-2xl font-bold" style={{ color: foreground }}>
                        {summaryData.totalTimeHours > 0 
                          ? `${summaryData.totalTimeHours}h`
                          : `${summaryData.totalTimeMinutes}m`
                        }
                      </p>
                    </div>
                    {summaryData.averageScore !== null && (
                      <div>
                        <p className="text-sm" style={{ color: mutedText }}>Average Score</p>
                        <p className="text-2xl font-bold" style={{ color: foreground }}>
                          {Math.round(summaryData.averageScore)}%
                        </p>
                      </div>
                    )}
                    {summaryData.scoreImprovement !== null && summaryData.scoreImprovement > 0 && (
                      <div>
                        <p className="text-sm" style={{ color: mutedText }}>Score Improvement</p>
                        <p className="text-2xl font-bold" style={{ color: accent }}>
                          +{Math.round(summaryData.scoreImprovement)}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Phase-by-phase breakdown */}
                  {phaseStats.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-semibold mb-3" style={{ color: foreground }}>Phase Performance</h5>
                      <div className="space-y-2">
                        {phaseStats.map((phase, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 rounded border flex justify-between items-center"
                            style={{ backgroundColor: "hsl(var(--card))", borderColor: neutralBorder }}
                          >
                            <div>
                              <p className="font-medium" style={{ color: foreground }}>
                                {phase.phase.replace('phase', 'Phase ')}
                              </p>
                              <p className="text-sm" style={{ color: mutedText }}>
                                {Math.round(phase.timeSpent / 60)} min
                                {phase.score !== null && ` • Score: ${Math.round(phase.score)}%`}
                                {phase.quizScore !== null && ` • Quiz: ${Math.round(phase.quizScore)}%`}
                              </p>
                            </div>
                            {phase.completed && (
                              <CheckCircle className="h-5 w-5" style={{ color: accent }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <SrlSummary />
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
      </div>
    </div>
  )
}

