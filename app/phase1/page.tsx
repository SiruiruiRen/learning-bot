"use client"

import { useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BrainCircuit, PlayCircle, VideoIcon, MoveRight, CheckCircle, Bot, Sparkles, MessageSquare, User, ArrowRight, Send, Youtube, FileQuestion, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import ModuleBar from "@/components/module-bar"
import SolBotChat, { Message } from "@/components/solbot-chat"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from 'uuid'

export default function Phase1Content() {
  const router = useRouter()
  const [videoWatched, setVideoWatched] = useState(false)
  const [watchingVideo, setWatchingVideo] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [userName, setUserName] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState("")
  const [stageAnswers, setStageAnswers] = useState(["", "", "", ""])
  const [answersSubmitted, setAnswersSubmitted] = useState(false)

  // Load user name from localStorage
  useEffect(() => {
    try {
      const storedName = localStorage.getItem("solbot_user_name")
      if (storedName) {
        setUserName(storedName)
      }
      
      // Scroll to the top when component mounts
      window.scrollTo(0, 0)
    } catch (error) {
      console.error("Error loading user name:", error)
    }
  }, [])

  // Initialize userId from localStorage
  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) {
      // Redirect to intro if no userId found
      router.push('/intro')
      return
    }
    setUserId(id)
  }, [router])

  const handleWatchVideo = () => {
    setWatchingVideo(true)
    // Simulate video playback with a timer
    setTimeout(() => {
      setVideoWatched(true)
      setWatchingVideo(false)
      setCurrentStep(2)
    }, 3000)
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
    
    if (option === "Planning, Monitoring, Controlling, Reflecting") {
      setFeedback("🎉 Correct! These four stages form the complete self-regulated learning cycle that expert learners use to master complex material.")
      setQuizCompleted(true)
    } else {
      setFeedback("Not quite. Review the stages of the self-regulated learning cycle and try again.")
    }
  }

  const handleStageAnswerChange = (index: number, value: string) => {
    const newAnswers = [...stageAnswers];
    newAnswers[index] = value;
    setStageAnswers(newAnswers);
  }
  
  const handleAnswersSubmit = () => {
    setAnswersSubmitted(true);
    setQuizCompleted(true);
    setFeedback("Great job identifying the four stages of self-regulated learning! These stages will help you become a more effective learner.");
  }

  const handleComplete = () => {
    // Save completion to localStorage
    try {
      localStorage.setItem("solbot_phase1_completed", "true")
    } catch (error) {
      console.error("Error saving completion status:", error)
    }
    
    // Navigate to the next phase
    router.push("/phase2")
  }

  const VideoComponent = () => (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 shadow-xl border border-indigo-500/30">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Youtube className="w-16 h-16 text-indigo-400 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">Self-Regulated Learning: The 4 Key Stages</h3>
        <p className="text-slate-300 mb-6 text-center max-w-md">Learn how expert students approach their learning process</p>
        
        {!videoWatched ? (
          <Button 
            onClick={handleWatchVideo}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md flex items-center gap-2"
            disabled={watchingVideo}
          >
            {watchingVideo ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Watching Video...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5" />
                Watch Video
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleStartQuiz}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md flex items-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            Video Completed
          </Button>
        )}
      </div>
    </div>
  )

  const QuizComponent = () => {
    // Move state inside the component to prevent parent re-renders
    const [localAnswers, setLocalAnswers] = useState(stageAnswers);
    
    // Only update parent state when submitting
    const handleLocalChange = (index: number, value: string) => {
      const newAnswers = [...localAnswers];
      newAnswers[index] = value;
      setLocalAnswers(newAnswers);
    };
    
    const handleSubmit = () => {
      // Update parent state
      setStageAnswers(localAnswers);
      setAnswersSubmitted(true);
      setQuizCompleted(true);
      setFeedback("Great job identifying the four stages of self-regulated learning! These stages will help you become a more effective learner.");
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg border border-indigo-500/30 mt-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <FileQuestion className="h-6 w-6 text-indigo-400" />
          <h3 className="text-xl font-medium text-white">Knowledge Check</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-white/90 mb-3">List all stages of the four-stage model of self-regulated learning:</p>
          <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/20 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <div className="text-indigo-400 mt-0.5">💡</div>
              <p className="text-white/80"><span className="text-indigo-300 font-medium">Remember:</span> Self-testing helps you remember information longer, find gaps in your knowledge, and improves future studying.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-indigo-400 mt-0.5">🧠</div>
              <p className="text-white/80">Actively recalling information now creates stronger neural connections that make it easier to retrieve later!</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 border border-indigo-500/30 bg-indigo-900/20 text-left w-24"></th>
                <th className="p-3 border border-indigo-500/30 bg-indigo-900/20 text-left">{answersSubmitted ? "Your Answers:" : "Your Response:"}</th>
                {answersSubmitted && (
                  <th className="p-3 border border-indigo-500/30 bg-indigo-900/20 text-left">Sample Answers:</th>
                )}
              </tr>
            </thead>
            <tbody>
              {["Stage 1:", "Stage 2:", "Stage 3:", "Stage 4:"].map((stage, index) => (
                <tr key={stage} className="border-b border-indigo-500/20">
                  <td className="p-3 border-r border-indigo-500/30 font-medium">{stage}</td>
                  <td className="p-3 border-r border-indigo-500/30">
                    {answersSubmitted ? (
                      <div className="text-white">{stageAnswers[index]}</div>
                    ) : (
                      <input
                        type="text"
                        value={localAnswers[index]}
                        onChange={(e) => handleLocalChange(index, e.target.value)}
                        placeholder={`Enter ${stage.replace(':', '')} here`}
                        className="w-full bg-slate-700/50 border border-indigo-500/30 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    )}
                  </td>
                  {answersSubmitted && (
                    <td className="p-3 text-indigo-300">
                      {index === 0 && "Define the task"}
                      {index === 1 && "Set goals and develop a plan"}
                      {index === 2 && "Execute the plan"}
                      {index === 3 && "Monitor your learning (and adapt if needed)"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!answersSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={localAnswers.some(answer => !answer.trim())}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md flex items-center gap-2"
          >
            Submit Answers
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        
        {feedback && answersSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 p-4 rounded-md bg-green-800/20 border border-green-600/40"
          >
            <p className="text-white">{feedback}</p>
            
            {quizCompleted && (
              <div className="mt-4">
                <Button
                  onClick={handleComplete}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md flex items-center gap-2"
                >
                  Continue to Next Phase
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-indigo-900 text-white py-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={1} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-indigo-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <BrainCircuit className="h-7 w-7 text-indigo-500 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Self-Regulated Learning Introduction
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
          <Card className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold">
                <BrainCircuit className="h-8 w-8 text-indigo-500" />
                <span className="bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
                  Self-Regulated Learning Introduction
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 space-y-6">
                <div className="bg-slate-800/50 p-5 rounded-lg border border-indigo-500/20">
                  <div className="flex items-start">
                    <Sparkles className="h-6 w-6 text-indigo-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Welcome, {userName || "Learner"}!</h3>
                      <p>
                        Ready to unlock the secrets of how top students master any subject? This introduction
                        will reveal the powerful self-regulated learning framework used by expert learners worldwide!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-900/20 p-5 rounded-lg border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-300 mb-3">Your learning adventure begins here:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="text-indigo-400 mt-0.5">🧠</div>
                      <div>Discover the <strong>four key stages</strong> that transform ordinary studying into extraordinary learning</div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="text-indigo-400 mt-0.5">🔬</div>
                      <div>Master an <strong>evidence-based framework</strong> backed by decades of cognitive science research</div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="text-indigo-400 mt-0.5">⚡</div>
                      <div>Learn how to <strong>apply these powerful principles</strong> to ace your most challenging courses</div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 p-5 rounded-lg border border-indigo-500/20">
                  <p className="text-white/80">
                    Watch a quick video that will change how you think about learning forever, then test your knowledge with an interactive challenge!
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          videoWatched
                            ? "bg-blue-500 text-white"
                            : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        }`}
                      >
                        {videoWatched ? <CheckCircle className="h-4 w-4" /> : "1"}
                      </div>
                      <span className={`text-sm ${videoWatched ? "text-blue-400" : "text-indigo-400"}`}>
                        Watch Video
                      </span>
                    </div>

                    <div className="h-0.5 flex-1 mx-4 bg-gray-700">
                      <div
                        className={`h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 ${
                          videoWatched ? "w-full" : "w-0"
                        }`}
                      ></div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          quizCompleted
                            ? "bg-blue-500 text-white"
                            : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        }`}
                      >
                        {quizCompleted ? <CheckCircle className="h-4 w-4" /> : "2"}
                      </div>
                      <span className={`text-sm ${quizCompleted ? "text-blue-400" : "text-indigo-400"}`}>
                        Complete Quiz
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Video Component */}
                <VideoComponent />
                
                {/* Quiz Component - shown after video completion */}
                {videoWatched && quizStarted && <QuizComponent />}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Add a text showing the step description */}
      <div className="container mx-auto px-4 relative z-10 mt-4 text-center">
        <p className="text-white/80 max-w-4xl mx-auto">
          {!videoWatched 
            ? "After watching the video, you'll take a short quiz to reinforce what you've learned through active retrieval practice."
            : quizStarted && !quizCompleted 
              ? "Test your knowledge of the self-regulated learning framework by completing the quiz."
              : quizCompleted 
                ? "Great work! You've completed the first phase of your learning journey."
                : "Click 'Video Completed' to continue to the quiz."
          }
        </p>
      </div>
      
      {/* Add subtle animated gradient background */}
      <div className="fixed inset-0 -z-20 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-blue-900/20 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>
    </div>
  )
}

