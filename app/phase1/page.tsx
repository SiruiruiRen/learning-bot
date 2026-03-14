"use client"

import { useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BrainCircuit, PlayCircle, VideoIcon, MoveRight, CheckCircle, Bot, Sparkles, MessageSquare, User, ArrowRight, Send, Youtube, FileQuestion, CheckCircle2, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Map, Video } from "lucide-react"
import { motion } from "framer-motion"
import ModuleBar from "@/components/module-bar"
import VideoPlayer from "@/components/video-player"
import SolBotChat from "@/components/solbot-chat"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from 'uuid'
import React from "react"
import { useSessionManager } from "@/lib/session-manager"

export default function Phase1Content() {
  const router = useRouter()
  const { getOrCreateSession, isFallbackSession } = useSessionManager()
  const accent = "var(--accent-text)"
  const neutralSurface = "hsl(var(--card) / 0.78)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const headerSurface = "hsl(var(--card) / 0.95)"
  const pillSurface = "hsl(var(--muted) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const [videoWatched, setVideoWatched] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [userName, setUserName] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [stageAnswers, setStageAnswers] = useState(["", "", "", ""])
  const [answersSubmitted, setAnswersSubmitted] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [sessionReady, setSessionReady] = useState(false)

  // Define the cards for easy reference
  const cards = [
    { id: "video", title: "Understanding Self-Regulated Learning" },
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
  
  // Function to handle video completion
  const handleVideoComplete = () => {
    setVideoWatched(true)
    // Save to localStorage that user has watched the video
    try {
      const stateToSave = {
        ...JSON.parse(localStorage.getItem(`solbot_phase1_state`) || '{}'),
        videoWatched: true
      }
      localStorage.setItem(`solbot_phase1_state`, JSON.stringify(stateToSave))
    } catch (error) {
      console.error(`Error saving video watched state:`, error)
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
      
      // Reset video watched state to ensure proper minimum watch time tracking
      // Previous localStorage state is ignored to enforce new watch time requirements
      setVideoWatched(false)
    } catch (error) {
      console.error("Error loading user name:", error)
    }
  }, [])

  // Initialize session with robust fallback
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionData = await getOrCreateSession()
        setUserId(sessionData.user_id)
        setSessionId(sessionData.session_id)
        setUserName(sessionData.user_name)
        setSessionReady(true)

        // Show info message if this is a fallback session
        if (isFallbackSession()) {
          console.log('Using fallback session - user accessed app directly without onboarding')
        }
      } catch (error) {
        console.error('Session initialization failed:', error)
        // Even if session fails, allow app usage with temporary session
        setSessionReady(true)
      }
    }

    initializeSession()
  }, [])

  const handleWatchVideo = () => {
    setQuizStarted(true)
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
    
    if (option === "Planning, Monitoring, Controlling, Reflecting") {
      setFeedback("Correct! These four stages form the complete self-regulated learning cycle that expert learners use to master complex material.")
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
        className="backdrop-blur-md p-6 rounded-lg border mt-8"
        style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
      >
        <div className="flex items-center gap-3 mb-6">
          <FileQuestion className="h-6 w-6" style={{ color: accent }} />
          <h3 className="text-xl font-medium text-foreground">Knowledge Check</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground mb-3">List all stages of the four-stage model of self-regulated learning:</p>
          <div className="p-4 rounded-lg border mb-4" style={{ backgroundColor: "hsl(var(--card) / 0.78)", borderColor: neutralBorder }}>
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
              <p className="text-muted-foreground"><span className="font-medium" style={{ color: accent }}>Remember:</span> Self-testing helps you remember information longer, find gaps in your knowledge, and improves future studying.</p>
            </div>
            <div className="flex items-start gap-2">
              <BrainCircuit className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
              <p className="text-muted-foreground">Actively recalling information now creates stronger neural connections that make it easier to retrieve later!</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 border text-left w-24" style={{ borderColor: neutralBorder, backgroundColor: "hsl(var(--card) / 0.9)" }}></th>
                <th className="p-3 border text-left" style={{ borderColor: neutralBorder, backgroundColor: "hsl(var(--card) / 0.9)" }}>{answersSubmitted ? "Your Answers:" : "Your Response:"}</th>
                {answersSubmitted && (
                  <th className="p-3 border text-left" style={{ borderColor: neutralBorder, backgroundColor: "hsl(var(--card) / 0.9)" }}>Sample Answers:</th>
                )}
              </tr>
            </thead>
            <tbody>
              {["Stage 1:", "Stage 2:", "Stage 3:", "Stage 4:"].map((stage, index) => (
                <tr key={stage} className="border-b" style={{ borderColor: neutralBorder }}>
                  <td className="p-3 border-r font-medium" style={{ borderColor: neutralBorder }}>{stage}</td>
                  <td className="p-3 border-r" style={{ borderColor: neutralBorder }}>
                    {answersSubmitted ? (
                      <div className="text-foreground">{stageAnswers[index]}</div>
                    ) : (
                      <input
                        type="text"
                        value={localAnswers[index]}
                        onChange={(e) => handleLocalChange(index, e.target.value)}
                        placeholder={`Enter ${stage.replace(':', '')} here`}
                        className="w-full rounded p-2 focus:outline-none focus:ring-2"
                        style={{ backgroundColor: "hsl(var(--card) / 0.78)", borderColor: neutralBorder, color: "hsl(var(--foreground))", boxShadow: `0 0 0 0px transparent` }}
                      />
                    )}
                  </td>
                  {answersSubmitted && (
                    <td className="p-3" style={{ color: accent }}>
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
            className="mt-6 font-medium py-2 px-6 rounded-md flex items-center gap-2 shadow-md"
            style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
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
            className="mt-6 p-4 rounded-md border"
            style={{ backgroundColor: "hsl(var(--muted) / 0.25)", borderColor: "hsl(var(--border))" }}
          >
            <p className="text-foreground">{feedback}</p>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <div
      className="min-h-screen text-foreground py-8"
      style={{ background: canvasGradient }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(120%_120%_at_85%_15%,rgba(0,0,0,0.04),transparent),radial-gradient(140%_120%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={1} />

        {/* Show loading while session initializes */}
        {!sessionReady ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "#b8892e" }}></div>
                <p className="text-muted-foreground">Initializing session...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Fixed Title Header */}
            <div
              className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4"
              style={{ backgroundColor: headerSurface, borderColor: neutralBorder }}
            >
              <div className="container mx-auto">
                <div className="flex items-center justify-center">
                  <BrainCircuit className="h-6 w-6 mr-2" style={{ color: accent }} />
                  <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
                    Phase 1: What's SRL
                  </h2>
                </div>
              </div>
            </div>

            {/* Card navigation indicators */}
            <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30 flex flex-col gap-2">
              <button 
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                className={`rounded-full p-2 transition-all border ${currentCardIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              
              {/* Card indicators */}
              <div className="flex flex-col items-center gap-1.5">
                {cards.map((_, i) => (
                  <div 
                    key={i}
                    className={`rounded-full transition-all ${i === currentCardIndex ? 'w-2 h-2 bg-foreground' : 'w-1.5 h-1.5 bg-foreground/50'}`}
                    onClick={() => setCurrentCardIndex(i)}
                  ></div>
                ))}
              </div>
              
              <button 
                onClick={nextCard}
                disabled={currentCardIndex === cards.length - 1}
                className={`rounded-full p-2 transition-all border ${currentCardIndex === cards.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
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
              <Card className="border shadow-[0_14px_36px_rgba(0,0,0,0.2)] backdrop-blur-md" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                    <BrainCircuit className="h-8 w-8" style={{ color: accent }} />
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
                      {cards[currentCardIndex].title}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {/* Video Component */}
                  {currentCardIndex === 0 && (
                    <div className="space-y-4 text-center">
                      <div className="p-4 rounded-2xl border mb-6 text-left shadow-[0_10px_26px_rgba(0,0,0,0.2)] backdrop-blur-md" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2" style={{ color: accent }}>
                          <Map className="h-5 w-5" />
                          Phase 1 Workflow
                        </h3>
                        <div className="flex items-center justify-center space-x-4 text-muted-foreground">
                          <div className="flex flex-col items-center text-center">
                            <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                              <Video className="h-6 w-6" style={{ color: accent }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: accent }}>Watch Video</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          <div className="flex flex-col items-center text-center">
                            <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                              <FileQuestion className="h-6 w-6" style={{ color: accent }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: accent }}>Knowledge Check</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        Learn the Self-Regulated Learning (SRL) cycle - a powerful framework for mastering any subject.
                      </p>
                      
                      <VideoPlayer
                        src="/video/SoL_phase1.mp4"
                        onComplete={handleVideoComplete}
                        startTime={0}
                        phase="phase1"
                        videoTitle="Self-Regulated Learning Introduction"
                      />

                      <div className="mt-4 p-3 rounded-2xl border text-center shadow-[0_10px_26px_rgba(0,0,0,0.2)] backdrop-blur-md" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
                        <p className="font-semibold" style={{ color: accent }}>After the video:</p>
                        <p className="text-muted-foreground text-sm">You will proceed to a Knowledge Check.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Quiz Component */}
                  {currentCardIndex === 1 && (
                    <div>
                      <div className="text-muted-foreground mb-4">
                        <p>Let's check your understanding of the Self-Regulated Learning framework.</p>
                      </div>
                      {quizStarted ? <QuizComponent /> : (
                        <div className="text-center py-6">
                          <Button
                            onClick={handleStartQuiz}
                            className="px-6 py-3 rounded-md shadow-md"
                            style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
                          >
                            Start Knowledge Check
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between pt-2">
                  {currentCardIndex > 0 ? (
                  <Button 
                    onClick={prevCard}
                    variant="outline" 
                    className="border"
                    style={{ borderColor: neutralBorder, color: mutedText }}
                  >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Back
                    </Button>
                  ) : <div></div>} {/* Empty div for spacing */}
                  
                  <Button 
                    onClick={nextCard}
                    className="font-semibold"
                    style={{ color: "#fff" }}
                    style={{
                      background: "linear-gradient(135deg, #b8892e, #96722d)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
                    }}
                    disabled={currentCardIndex === 1 && !quizCompleted}
                  >
                    {currentCardIndex < cards.length - 1 ? 'Next' : 'Complete Phase'} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

