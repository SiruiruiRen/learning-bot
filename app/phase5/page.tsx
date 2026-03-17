"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayCircle, CheckCircle, Brain, BookMarked, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, HelpCircle, AlertCircle, ArrowRight, Map, FileQuestion, Video, MessageCircle, Lock, CheckCircle2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import VideoPlayer from "@/components/video-player"
import ModuleBar from "@/components/module-bar"
import { VerticalNav } from "@/components/vertical-nav"
import PrePostKnowledgeCheck from "@/components/pre-post-knowledge-check"
import { phase5KnowledgeChecks } from "@/lib/knowledge-check-questions"
import { useProgressSaver } from "@/hooks/useProgressSaver"

// --- Helper function to log events ---
const logEvent = (sessionId: string, eventType: string, metadata: any) => {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      event_type: eventType,
      phase: '5',
      component: 'monitoring_adaptation',
      metadata: metadata,
    }),
  }).catch(error => console.error(`Failed to log event ${eventType}:`, error));
};

export default function Phase5Content() {
  const router = useRouter()
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [postTestCompleted, setPostTestCompleted] = useState(false)
  const [userName, setUserName] = useState("")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { savedProgress, saveProgress, clearProgress } = useProgressSaver("phase5")

  // Define the cards for easy reference
  const cards = [
    { id: "intro", title: "Introduction to Monitoring" },
    { id: "video", title: "Monitoring Your Learning Video" },
    { id: "post-test", title: "Knowledge Check: After Video" },
  ]

  // Function to navigate to the next card
  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      const newIndex = currentCardIndex + 1
      setCurrentCardIndex(newIndex)
      saveProgress({ cardIndex: newIndex, videoCompleted, postTestCompleted })
    }
  }

  // Function to navigate to the previous card
  const prevCard = () => {
    if (currentCardIndex > 0) {
      const newIndex = currentCardIndex - 1
      setCurrentCardIndex(newIndex)
      saveProgress({ cardIndex: newIndex, videoCompleted, postTestCompleted })
    }
  }

  // Load user name and session ID from localStorage
  useEffect(() => {
    try {
      const storedName = localStorage.getItem("solbot_user_name");
      if (storedName) setUserName(storedName);

      const storedSessionId = localStorage.getItem("session_id");
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        // If there's no session ID, the user hasn't gone through onboarding.
        // For development, we'll allow access but log a warning.
        console.warn("No session_id found. Proceeding for development.");
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
    // Restore saved progress
    if (savedProgress) {
      if (savedProgress.cardIndex > 0) setCurrentCardIndex(savedProgress.cardIndex)
      if (savedProgress.videoCompleted) setVideoCompleted(true)
      if (savedProgress.postTestCompleted) setPostTestCompleted(true)
    }
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompleteVideo = () => {
    setVideoCompleted(true)
    saveProgress({ cardIndex: currentCardIndex, videoCompleted: true, postTestCompleted })
    if (sessionId) {
      logEvent(sessionId, 'video_watch_completed', { video_title: "Monitoring Your Learning" });
    }
  }

  const handlePostTestComplete = (answers: { [questionId: number]: string | string[] }, allCorrect: boolean) => {
    setPostTestCompleted(true)
    saveProgress({ cardIndex: currentCardIndex, videoCompleted, postTestCompleted: true })
  }

  const handleComplete = () => {
    clearProgress()
    router.push("/phase5/chat")
  }
  
  const handlePostTestCompleteAndContinue = () => {
    // After post-test, go to chatbot
    router.push("/phase5/chat")
  }

  const accent = "var(--accent-text)"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.78)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const headerSurface = "hsl(var(--card) / 0.95)"
  const pillSurface = "hsl(var(--muted) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"

  return (
    <div
      className="min-h-screen text-foreground py-8"
      style={{ background: canvasGradient }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(140%_120%_at_80%_20%,rgba(0,0,0,0.04),transparent),radial-gradient(160%_140%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>

        <ModuleBar currentPhase={5} />

      <div
        className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4"
        style={{ backgroundColor: headerSurface, borderColor: neutralBorder }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Brain className="h-6 w-6 mr-2" style={{ color: accent }} />
            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
              Phase 5: Monitor & Adaptation
            </h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-16">
        <VerticalNav
          currentCardIndex={currentCardIndex}
          totalCards={cards.length}
          onPrev={prevCard}
          onNext={nextCard}
          isNextDisabled={(currentCardIndex === 1 && !videoCompleted) || (currentCardIndex === 2 && !postTestCompleted)}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <Card className="backdrop-blur-md border" style={{ borderColor: neutralBorder, backgroundColor: neutralSurface }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Brain className="h-8 w-8" style={{ color: accent }} />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
                  {cards[currentCardIndex].title}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Introduction Card */}
              {currentCardIndex === 0 && (
                <div className="space-y-6">
                  <div
                    className="p-4 rounded-lg border mb-6 text-left"
                    style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
                  >
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2" style={{ color: accent }}>
                      <Map className="h-5 w-5" />
                      Phase 5 Workflow
                    </h3>
                    <div className="flex items-center justify-center space-x-4 text-foreground">
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
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <MessageCircle className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: accent }}>Chat w/ SoL2LBot</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground space-y-4">
                    <p>
                      {userName ? `Welcome, ${userName}!` : "Welcome!"} This phase is about monitoring your learning and adapting your strategies.
                    </p>
                    <p>
                      Watch a short video, complete a knowledge check, then build your monitoring system with SoL2LBot.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Video Card */}
              {currentCardIndex === 1 && (
                <div className="space-y-4 text-center">
                  <p className="text-muted-foreground">
                    Learn effective strategies for monitoring your learning progress and adapting when needed.
                  </p>
                  
                  <VideoPlayer
                    src="/video/SoL_phase5.mp4"
                    onComplete={handleCompleteVideo}
                    phase="phase5"
                    videoTitle="Monitoring Your Learning"
                  />
                  <div
                    className="mt-4 p-3 rounded-lg border-l-4 flex items-center gap-3"
                    style={{
                      borderLeftColor: videoCompleted ? "#22c55e" : "#d8b26f",
                      backgroundColor: videoCompleted ? "hsl(142 76% 36% / 0.08)" : "hsl(var(--muted) / 0.25)",
                    }}
                  >
                    {videoCompleted ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#22c55e" }} />
                    ) : (
                      <Lock className="h-5 w-5 shrink-0" style={{ color: "#d8b26f" }} />
                    )}
                    <p className="text-sm" style={{ color: videoCompleted ? "#22c55e" : "hsl(var(--muted-foreground))" }}>
                      {videoCompleted
                        ? "Video completed! You can proceed to the Knowledge Check."
                        : "Please watch the full video to unlock the next step."}
                    </p>
                  </div>
                </div>
              )}

              {/* Post-Test Card */}
              {currentCardIndex === 2 && (
                <div>
                  <div className="text-muted-foreground mb-4">
                    <p>
                      <strong style={{ color: accent }}>After the video:</strong> Let's check your understanding of monitoring your learning.
                    </p>
                  </div>
                  <PrePostKnowledgeCheck
                    questions={phase5KnowledgeChecks.postTest}
                    testType="post"
                    onComplete={handlePostTestComplete}
                  />
                </div>
              )}
              
              <div className="flex justify-between mt-8">
                {currentCardIndex > 0 ? (
                  <Button
                    variant="outline"
                    className="border"
                    style={{ borderColor: neutralBorder, color: mutedText }}
                    onClick={prevCard}
                    title="Go to previous step"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                ) : <div></div>}

                {currentCardIndex < cards.length - 1 ? (
                  <Button
                    className="shadow-md"
                    style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
                    onClick={nextCard}
                    disabled={(currentCardIndex === 1 && !videoCompleted) || (currentCardIndex === 2 && !postTestCompleted)}
                    title="Go to next step"
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : currentCardIndex === 2 && postTestCompleted ? (
                  <Button
                    className="px-6 py-2 rounded-lg shadow-md"
                    style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
                    onClick={handleComplete}
                    title="Continue to the next activity"
                  >
                    Continue to Chat <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : currentCardIndex === 2 && !postTestCompleted ? (
                  <Button
                    className="px-6 py-2 rounded-lg shadow-md opacity-60 cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
                    disabled
                    title="Complete the knowledge check to continue"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : null}
              </div>
              {currentCardIndex === 1 && !videoCompleted && (
                <p className="text-xs text-center mt-2" style={{ color: "#d8b26f" }}>Complete the video above to continue</p>
              )}
              {currentCardIndex === 2 && !postTestCompleted && (
                <p className="text-xs text-center mt-2" style={{ color: "#d8b26f" }}>Complete the knowledge check to continue</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 