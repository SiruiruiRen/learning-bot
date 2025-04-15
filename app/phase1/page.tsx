"use client"

import { useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BrainCircuit, PlayCircle, VideoIcon, MoveRight, CheckCircle, Bot, Sparkles, MessageSquare, User, ArrowRight, Send, Youtube, FileQuestion, CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react"
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  // Define the cards for easy reference
  const cards = [
    { id: "intro", title: "Introduction to Self-Regulated Learning" },
    { id: "video", title: "Understanding the SRL Framework" },
    { id: "quiz", title: "Knowledge Check" },
  ]

  // Function to navigate to the next card
  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      // If we're on the last card, complete the phase
      handleComplete()
    }
  }

  // Function to navigate to the previous card
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

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
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={1} />

        {/* Card navigation indicators */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30 flex flex-col gap-2">
          <button 
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className={`rounded-full p-2 transition-all ${currentCardIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100 bg-slate-700/50 hover:bg-slate-700/80'}`}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          
          {/* Card indicators */}
          <div className="flex flex-col items-center gap-1.5">
            {cards.map((_, i) => (
              <div 
                key={i}
                className={`rounded-full transition-all ${i === currentCardIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                onClick={() => setCurrentCardIndex(i)}
              ></div>
            ))}
          </div>
          
          <button 
            onClick={nextCard}
            disabled={currentCardIndex === cards.length - 1}
            className={`rounded-full p-2 transition-all ${currentCardIndex === cards.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100 bg-slate-700/50 hover:bg-slate-700/80'}`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <Card className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-center justify-center">
                <BrainCircuit className="h-8 w-8 text-indigo-500" />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  {cards[currentCardIndex].title}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Introduction Card */}
              {currentCardIndex === 0 && (
                <div className="space-y-6">
                  <div className="text-white/80 space-y-4">
                    <p>
                      {userName ? `Welcome, ${userName}!` : "Welcome!"} In this phase, you'll learn about the Self-Regulated Learning (SRL) framework - a powerful approach used by expert learners.
                    </p>
                    <p>
                      Self-Regulated Learning involves planning your learning, monitoring your progress, controlling your strategies, and reflecting on your outcomes. This cyclical process helps you become a more effective learner.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/20">
                    <h3 className="text-lg font-medium text-indigo-300 mb-2">What You'll Learn:</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="text-indigo-400 mt-0.5">🧠</div>
                        <p className="text-white/80">The 4 key stages of Self-Regulated Learning</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-indigo-400 mt-0.5">📈</div>
                        <p className="text-white/80">How expert students approach their learning</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-indigo-400 mt-0.5">💡</div>
                        <p className="text-white/80">Basic principles you'll use throughout this course</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Video Component */}
              {currentCardIndex === 1 && (
                <div>
                  <div className="text-white/80 mb-4">
                    <p>This video introduces the Self-Regulated Learning framework and its four key stages.</p>
                  </div>
                  <VideoComponent />
                </div>
              )}
              
              {/* Quiz Component */}
              {currentCardIndex === 2 && (
                <div>
                  <div className="text-white/80 mb-4">
                    <p>Let's check your understanding of the Self-Regulated Learning framework.</p>
                  </div>
                  {quizStarted ? <QuizComponent /> : (
                    <div className="text-center py-6">
                      <Button
                        onClick={handleStartQuiz}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md shadow-md"
                      >
                        Start Knowledge Check
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Navigation buttons at the bottom of each card */}
              <div className="flex justify-between mt-8">
                {currentCardIndex > 0 ? (
                  <Button 
                    variant="outline"
                    className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-900/20"
                    onClick={prevCard}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                ) : <div></div>} {/* Empty div to maintain flex spacing */}
                
                <Button 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg"
                  onClick={nextCard}
                  disabled={currentCardIndex === 2 && !quizCompleted}
                >
                  {currentCardIndex < cards.length - 1 ? 'Next' : 'Complete & Continue'} <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

