"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Bot, Download, Home, Printer, Sparkles, CheckCircle, Send, Target, BookOpen, LineChart, Timer, ClipboardList, BrainCircuit, ArrowRight, Play, ArrowRightCircle, PlusCircle, Lightbulb, Medal } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from 'uuid'

export default function SummaryPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [responses, setResponses] = useState({
    difficulty: "",
    confidence: "",
    insights: "",
    satisfaction: ""
  })
  const [learningPlan, setLearningPlan] = useState({
    taskDefinition: "",
    challengingCourse: "",
    longTermGoal: "",
    smartGoal: "",
    learningStrategies: [] as string[],
    monitoringSystem: "",
    resources: [] as string[],
    ifThenStrategies: [] as Array<{if: string, then: string}>
  })

  // Load user data on component mount
  useEffect(() => {
    try {
      // Load user name from localStorage
      const storedName = localStorage.getItem("solbot_user_name")
      if (storedName) {
        setUserName(storedName)
      }
      
      // Load userId from localStorage
      const storedUserId = localStorage.getItem("userId")
      if (storedUserId) {
        setUserId(storedUserId)
      } else {
        // Create and store a new userId if none exists
        const newUserId = uuidv4()
        localStorage.setItem("userId", newUserId)
        setUserId(newUserId)
      }

      // Load learning plan data
      const storedChallengingCourse = localStorage.getItem("solbot_challenging_course") || "Advanced Mathematics"
      const storedTaskDefinition = localStorage.getItem("solbot_task_definition") || "Master calculus concepts and problem-solving techniques"
      const storedLongTermGoal = localStorage.getItem("solbot_long_term_goal") || "Develop strong mathematical foundation for data science career"
      const storedSmartGoal = localStorage.getItem("solbot_smart_goal") || "Complete all practice problems with 85% accuracy by the end of the semester"
      const storedStrategies = localStorage.getItem("solbot_strategies") || "Retrieval practice,Spaced repetition,Self-explanation,Interleaving"
      const storedMonitoring = localStorage.getItem("solbot_monitoring") || "Weekly self-assessment quizzes with reflection journal"
      const storedResources = localStorage.getItem("solbot_resources") || "Textbook,Online lectures,Study group,Practice problem sets"
      
      // Default IF-THEN strategies if none are in localStorage
      const defaultIfThenStrategies = [
        { if: "If I feel unmotivated to study", then: "Then I will review my long-term goals and remember why this learning matters" },
        { if: "If I encounter a difficult concept", then: "Then I will use the Feynman technique to explain it in simple terms" },
        { if: "If I'm struggling to focus", then: "Then I will use the Pomodoro technique with 25-minute study intervals" }
      ]
      
      // Try to load IF-THEN strategies from localStorage or use defaults
      let ifThenStrategies = defaultIfThenStrategies
      try {
        const storedIfThen = localStorage.getItem("solbot_if_then_strategies")
        if (storedIfThen) {
          ifThenStrategies = JSON.parse(storedIfThen)
        }
      } catch (error) {
        console.error("Error parsing IF-THEN strategies:", error)
      }

      setLearningPlan({
        taskDefinition: storedTaskDefinition,
        challengingCourse: storedChallengingCourse,
        longTermGoal: storedLongTermGoal,
        smartGoal: storedSmartGoal,
        learningStrategies: storedStrategies.split(','),
        monitoringSystem: storedMonitoring,
        resources: storedResources.split(','),
        ifThenStrategies: ifThenStrategies
      })
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading user data:", error)
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitFeedback = () => {
    // Here you could add logic to send the feedback to your server
    console.log("Submitting feedback:", responses)
    // Show a success message or redirect
    alert("Thank you for your feedback!")
  }

  const handleDownloadSummary = () => {
    // Logic to download summary (can be implemented later)
    console.log("Download summary clicked")
  }

  const handleReturnHome = () => {
    router.push("/")
  }

  // Questions based on the Efklides model
  const reflectionQuestions = [
    {
      id: "difficulty",
      question: "How would you describe your feeling of difficulty when applying the learning strategies we covered? Did any particular strategy feel easier or more challenging to understand?",
      placeholder: "Share your thoughts on the difficulty level of the strategies..."
    },
    {
      id: "confidence",
      question: "How confident do you feel now about your ability to apply these learning techniques in your studies? Has this changed from when you started?",
      placeholder: "Reflect on your confidence level..."
    },
    {
      id: "satisfaction",
      question: "How satisfied are you with what you've learned, and do you feel it will help you achieve your academic goals?",
      placeholder: "Share your level of satisfaction with the learning journey..."
    }
  ]

  // Animation variants for cards
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.5)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      transition: { duration: 0.2 }
    }
  }

  // Toggle card active state
  const toggleCardActive = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Module bar for navigation */}
      <ModuleBar currentPhase={6} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-rose-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Medal className="h-6 w-6 text-rose-500 mr-2" />
            <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text">
              Phase 6: Learning Journey Summary
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
          {/* Summary header */}
          <Card className="bg-slate-900/60 backdrop-blur-md border border-rose-500/30 shadow-xl mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center mb-2">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3 rounded-full shadow-lg shadow-rose-500/20">
                  <Award className="h-7 w-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl text-center font-bold">
                <span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
                  Your Learning Journey Summary
                </span>
              </CardTitle>
              <p className="text-center text-white/70 mt-2">
                {userName ? `Congratulations, ${userName}!` : "Congratulations!"} You've completed all phases and built your personalized learning system.
              </p>
              <div className="mt-4 p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <p className="text-center text-white/80 text-sm">
                  Please take a moment to reflect on your experience and provide feedback. Your insights will help us understand how you've experienced this learning journey and how the strategies might work for you moving forward.
                </p>
              </div>
            </CardHeader>
          </Card>

          {/* Your Learning Plan Visualization */}
          <div className="relative mb-12">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold z-10 shadow-lg">
              Your Learning Blueprint
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Task Definition Section */}
              <motion.div 
                className={`bg-slate-900/80 backdrop-blur-md rounded-lg border ${activeCard === 'task' ? 'border-indigo-400' : 'border-indigo-500/30'} h-full shadow-xl overflow-hidden`}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                onClick={() => toggleCardActive('task')}
              >
                <div className="h-2 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-indigo-300">Task Definition</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-indigo-900/20 p-3 rounded-md border border-indigo-500/30">
                      <p className="text-xs uppercase text-indigo-400/70 mb-1">Challenging Course</p>
                      <p className="text-white/90 font-medium text-lg">{learningPlan.challengingCourse}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-indigo-400/70 mb-1">Learning Task</p>
                      <p className="text-white/90">{learningPlan.taskDefinition}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-indigo-400/70 mb-1">Resources</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {learningPlan.resources.map((resource, index) => (
                          <motion.div 
                            key={index} 
                            className="px-3 py-1 text-xs rounded-full bg-indigo-900/40 border border-indigo-500/30 text-white/80"
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(79, 70, 229, 0.3)" }}
                          >
                            {resource}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Learning Goals Section */}
              <motion.div 
                className={`bg-slate-900/80 backdrop-blur-md rounded-lg border ${activeCard === 'goals' ? 'border-purple-400' : 'border-purple-500/30'} h-full shadow-xl overflow-hidden`}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                onClick={() => toggleCardActive('goals')}
              >
                <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Target className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-purple-300">Learning Goals</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase text-purple-400/70 mb-1">Long-term Goal</p>
                      <p className="text-white/90">{learningPlan.longTermGoal}</p>
                    </div>
                    <div className="bg-purple-900/20 p-4 rounded-md border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded-full bg-purple-500/30">
                          <Target className="h-4 w-4 text-purple-300" />
                        </div>
                        <p className="text-xs uppercase text-purple-400/70">S.M.A.R.T Goal</p>
                      </div>
                      <p className="text-white/90 font-medium">{learningPlan.smartGoal}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Learning Strategies Section */}
              <motion.div 
                className={`bg-slate-900/80 backdrop-blur-md rounded-lg border ${activeCard === 'strategies' ? 'border-emerald-400' : 'border-emerald-500/30'} h-full shadow-xl overflow-hidden`}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                onClick={() => toggleCardActive('strategies')}
              >
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <BrainCircuit className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-medium text-emerald-300">Learning Strategies</h3>
                  </div>
                  <div className="space-y-3">
                    {learningPlan.learningStrategies.map((strategy, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center gap-3 p-2 rounded-md border border-emerald-500/20 bg-emerald-900/10"
                        whileHover={{ x: 5, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {index + 1}
                        </div>
                        <p className="text-white/90">{strategy}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Monitoring System Section */}
              <motion.div 
                className={`bg-slate-900/80 backdrop-blur-md rounded-lg border ${activeCard === 'monitoring' ? 'border-amber-400' : 'border-amber-500/30'} h-full shadow-xl overflow-hidden`}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                onClick={() => toggleCardActive('monitoring')}
              >
                <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <LineChart className="h-5 w-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-medium text-amber-300">Monitoring System</h3>
                  </div>
                  <div>
                    <div className="bg-amber-900/20 p-4 rounded-md border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded-full bg-amber-500/30">
                          <CheckCircle className="h-4 w-4 text-amber-300" />
                        </div>
                        <p className="text-xs uppercase text-amber-400/70">Tracking Approach</p>
                      </div>
                      <p className="text-white/90">{learningPlan.monitoringSystem}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* IF-THEN Strategies Section */}
              <motion.div 
                className={`md:col-span-2 bg-slate-900/80 backdrop-blur-md rounded-lg border ${activeCard === 'ifthen' ? 'border-rose-400' : 'border-rose-500/30'} shadow-xl overflow-hidden`}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
                whileHover="hover"
                onClick={() => toggleCardActive('ifthen')}
              >
                <div className="h-2 bg-gradient-to-r from-rose-400 to-rose-600"></div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-rose-400" />
                    </div>
                    <h3 className="text-lg font-medium text-rose-300">IF-THEN Strategies</h3>
                  </div>
                  <p className="text-white/70 mb-4 text-sm">Implementation intentions for overcoming obstacles and maintaining motivation</p>
                  
                  <div className="space-y-3">
                    {learningPlan.ifThenStrategies.map((strategy, index) => (
                      <motion.div 
                        key={index} 
                        className="bg-rose-900/10 rounded-lg border border-rose-500/20 overflow-hidden"
                        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.15)" }}
                      >
                        <div className="p-3 bg-rose-500/10 border-b border-rose-500/20">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-rose-300">IF</span>
                            </div>
                            <p className="text-white/90 font-medium">{strategy.if}</p>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center mr-2">
                              <ArrowRightCircle className="h-3 w-3 text-rose-300" />
                            </div>
                            <p className="text-white/90">{strategy.then}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Connection lines between components */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30 hidden md:block" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                </marker>
              </defs>
              {/* Lines connecting the components */}
              <path d="M 25% 25% L 75% 25%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)"/>
              <path d="M 25% 25% L 25% 75%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)"/>
              <path d="M 75% 25% L 75% 75%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)"/>
              <path d="M 25% 75% L 50% 90%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)"/>
              <path d="M 75% 75% L 50% 90%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)"/>
            </svg>
          </div>

          {/* Reflection Questions */}
          <Card className="bg-slate-900/60 backdrop-blur-md border border-rose-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rose-400" />
                <span>Reflection Questions</span>
              </h2>
              <p className="text-white/70 text-sm">
                These questions are based on the Efklides model, which focuses on metacognitive experiences during learning.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {reflectionQuestions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-rose-400">{index + 1}</span>
                    </div>
                    <label htmlFor={q.id} className="block text-white/90 font-medium">
                      {q.question}
                    </label>
                  </div>
                  <Textarea 
                    id={q.id}
                    placeholder={q.placeholder}
                    className="min-h-[100px] bg-slate-800/50 border-rose-500/30 focus:border-rose-400 text-white"
                    value={responses[q.id as keyof typeof responses]}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                  />
                </div>
              ))}
              
              <Button 
                onClick={handleSubmitFeedback}
                className="w-full mt-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Reflection
              </Button>
            </CardContent>
          </Card>

          {/* Learning Journey Recap Card */}
          <Card className="bg-slate-900/60 backdrop-blur-md border border-rose-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Your Learning Journey Recap</span>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-lg font-medium text-white mb-3">Key Skills Developed</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">
                        <span className="font-semibold text-white">Self-Regulated Learning</span> - 
                        Understanding and applying the cycle of planning, monitoring, and reflection
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">
                        <span className="font-semibold text-white">Evidence-Based Strategies</span> - 
                        Using techniques like retrieval practice, spaced repetition, and self-explanation
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">
                        <span className="font-semibold text-white">Strategic Planning</span> - 
                        Setting clear objectives and creating actionable learning plans
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">
                        <span className="font-semibold text-white">Progress Monitoring</span> - 
                        Tracking your learning and making adjustments based on feedback
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-lg font-medium text-white mb-2">Next Steps</h3>
                  <p className="text-white/80 mb-3">
                    Now that you've completed this learning journey, here are some recommended next steps:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-rose-400">1</span>
                      </div>
                      <span className="text-white/80">
                        Apply your learning strategy to your current most challenging course
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-rose-400">2</span>
                      </div>
                      <span className="text-white/80">
                        Schedule regular check-ins to review and refine your approach
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-rose-400">3</span>
                      </div>
                      <span className="text-white/80">
                        Share these techniques with peers to reinforce your understanding
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 mb-8">
            <Button 
              variant="outline" 
              className="border-rose-500/50 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
              onClick={handleDownloadSummary}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Summary
            </Button>
            <Button 
              variant="outline" 
              className="border-pink-500/50 text-pink-400 hover:bg-pink-950/30 hover:text-pink-300"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Summary
            </Button>
            <Button 
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
              onClick={handleReturnHome}
            >
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .stars, .stars2, .stars3 {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background-repeat: repeat;
          z-index: -10;
        }

        .stars {
          background-image: radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                            radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0));
          background-size: 200px 200px;
          animation: stars-animation 150s linear infinite;
        }

        .stars2 {
          background-image: radial-gradient(1px 1px at 100px 150px, #eee, rgba(0,0,0,0)),
                            radial-gradient(1px 1px at 200px 220px, #fff, rgba(0,0,0,0)),
                            radial-gradient(1.5px 1.5px at 300px 300px, #fff, rgba(0,0,0,0));
          background-size: 400px 400px;
          animation: stars-animation 200s linear infinite;
        }

        .stars3 {
          background-image: radial-gradient(1px 1px at 50px 80px, #eee, rgba(0,0,0,0)),
                            radial-gradient(1px 1px at 150px 120px, #fff, rgba(0,0,0,0)),
                            radial-gradient(1.5px 1.5px at 250px 250px, #fff, rgba(0,0,0,0));
          background-size: 300px 300px;
          animation: stars-animation 250s linear infinite;
        }

        @keyframes stars-animation {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-900px);
          }
        }

        @media print {
          .stars, .stars2, .stars3 {
            display: none;
          }
        }
      `}</style>
    </div>
  )
} 