"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ChevronRight, ChevronLeft, Map, Video, FileQuestion, MessageCircle } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import VideoPlayer from "@/components/video-player"
import { VerticalNav } from "@/components/vertical-nav"
import PrePostKnowledgeCheck from "@/components/pre-post-knowledge-check"
import { phase4KnowledgeChecks } from "@/lib/knowledge-check-questions"

export default function Phase4IntroPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [postTestCompleted, setPostTestCompleted] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  const cards = [
    { id: "intro", title: "Introduction to Strategic Planning" },
    { id: "video", title: "Watch: MCII Framework for Strategic Planning" },
    { id: "post-test", title: "Knowledge Check: After Video" },
  ]

  useEffect(() => {
    try {
      const storedName = localStorage.getItem("solbot_user_name");
      if (storedName) setUserName(storedName);

      const storedSessionId = localStorage.getItem("session_id");
      if (!storedSessionId) {
        console.warn("No session_id found, redirecting to intro.");
        router.push('/intro');
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      router.push('/intro');
    }
  }, [router]);

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  const handleVideoComplete = () => {
    setVideoCompleted(true)
  }

  const handlePostTestComplete = () => {
    setPostTestCompleted(true)
  }

  const handleContinueToChat = () => {
    router.push("/phase4/mcii")
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

      <ModuleBar currentPhase={4} />

      <div
        className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4"
        style={{ backgroundColor: headerSurface, borderColor: neutralBorder }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Target className="h-6 w-6 mr-2" style={{ color: accent }} />
            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
              Phase 4: Strategic Learning Plan
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
          isNextDisabled={
            (currentCardIndex === 1 && !videoCompleted) ||
            (currentCardIndex === 2 && !postTestCompleted)
          }
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
                <Target className="h-8 w-8" style={{ color: accent }} />
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
                      Phase 4 Workflow
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
                    <p className="text-center">
                      Welcome {userName ? `${userName}` : ""}! In this phase, we'll turn your learning intentions into a concrete strategic plan.
                    </p>
                    <p className="text-center">
                      Set effective goals and plan for challenges using the MCII technique (Mental Contrasting with Implementation Intentions).
                    </p>
                  </div>
                </div>
              )}

              {/* Video Card */}
              {currentCardIndex === 1 && (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    Learn the MCII framework (Mental Contrasting with Implementation Intentions) to build an effective study plan.
                  </p>
                  <VideoPlayer
                    src="/video/SoL_phase4.mp4"
                    onComplete={handleVideoComplete}
                    phase="phase4"
                    videoTitle="MCII Framework for Strategic Planning"
                  />
                  <div
                    className="mt-4 p-3 rounded-lg text-center border"
                    style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
                  >
                    <p className="font-semibold" style={{ color: accent }}>After the video:</p>
                    <p className="text-muted-foreground text-sm">You will complete a knowledge check, then proceed to the MCII exercise with SoL2LBot.</p>
                  </div>
                </div>
              )}

              {/* Post-Test Card */}
              {currentCardIndex === 2 && (
                <div>
                  <div className="text-muted-foreground mb-4">
                    <p>
                      <strong style={{ color: accent }}>After the video:</strong> Let's check your understanding of the MCII framework.
                    </p>
                  </div>
                  <PrePostKnowledgeCheck
                    questions={phase4KnowledgeChecks.postTest}
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
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                ) : <div></div>}

                {currentCardIndex < cards.length - 1 ? (
                  <Button
                    className="shadow-md"
                    style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
                    onClick={nextCard}
                    disabled={
                      (currentCardIndex === 1 && !videoCompleted) ||
                      (currentCardIndex === 2 && !postTestCompleted)
                    }
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : currentCardIndex === 2 && postTestCompleted ? (
                  <Button
                    className="px-6 py-2 rounded-lg shadow-md"
                    style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
                    onClick={handleContinueToChat}
                  >
                    Continue to MCII Exercise <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : currentCardIndex === 2 && !postTestCompleted ? (
                  <Button
                    className="px-6 py-2 rounded-lg shadow-md opacity-60 cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}
                    disabled
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
