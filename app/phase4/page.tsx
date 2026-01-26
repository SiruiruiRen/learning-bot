"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ArrowRight, CheckCircle, Map, Video, Edit, Bot, ChevronRight as ChevronRightIcon } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import VideoPlayer from "@/components/video-player"
import PrePostKnowledgeCheck from "@/components/pre-post-knowledge-check"
import { phase4KnowledgeChecks } from "@/lib/knowledge-check-questions"

export default function Phase4IntroPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [postTestCompleted, setPostTestCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem("solbot_user_name");
      if (storedName) setUserName(storedName);
      
      // We still check for session_id to maintain flow integrity
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

  const handleComplete = () => {
    router.push("/phase4/tasks")
  }

  const handleVideoComplete = () => {
    setVideoCompleted(true);
  };

  const handlePostTestComplete = (answers: { [questionId: number]: string | string[] }, allCorrect: boolean) => {
    setPostTestCompleted(true);
  };

  const handleNext = () => {
    if (currentStep === 1 && !videoCompleted) {
      // Can't proceed from video step until video is watched
      return;
    }
    if (currentStep === 2 && !postTestCompleted) {
      // Can't proceed from post-test step until completed
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const accent = "#d8b26f"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.9)"
  const neutralBorder = "hsl(var(--border) / 0.75)"
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
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-[rgba(216,178,111,1)] to-[rgba(216,178,111,0.9)] bg-clip-text">
              Phase 4: Strategic Learning Plan
            </h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-16">
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
                <span className="bg-gradient-to-r from-[rgba(216,178,111,1)] to-[rgba(216,178,111,0.9)] bg-clip-text text-transparent">
                  Introduction to Strategic Planning
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                <div className="text-muted-foreground space-y-4">
                  <div
                    className="p-4 rounded-lg border mb-6 text-left"
                    style={{
                      backgroundColor: neutralSurface,
                      borderColor: neutralBorder,
                    }}
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
                      <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <Edit className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: accent }}>Build Plan</span>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <Bot className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: accent }}>AI Coaching</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-muted-foreground">
                    Welcome {userName}! In this phase, we'll turn your learning intentions into a concrete strategic plan.
                  </p>

                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: neutralSurface,
                      borderColor: neutralBorder,
                    }}
                  >
                    <h3 className="text-lg font-medium mb-3" style={{ color: accent }}>📋 What's in This Phase:</h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5" style={{ color: accent }}>🎥</div>
                        <p className="text-muted-foreground"><span className="font-medium" style={{ color: accent }}>Video:</span> Learn the MCII technique (Mental Contrasting with Implementation Intentions)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5" style={{ color: accent }}>📝</div>
                        <p className="text-muted-foreground"><span className="font-medium" style={{ color: accent }}>3 Strategic Tasks:</span> Long-term goals, SMART objectives, and contingency plans</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5" style={{ color: accent }}>🤖</div>
                        <p className="text-muted-foreground"><span className="font-medium" style={{ color: accent }}>AI Coaching:</span> Personalized feedback to refine each task</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-center text-muted-foreground">
                    Set effective goals and plan for challenges using the MCII technique.
                  </p>
                </div>
              )}

              {currentStep === 1 && (
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
                    className="mt-4 p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: neutralSurface,
                      border: `1px solid ${neutralBorder}`,
                    }}
                  >
                    <p className="font-semibold" style={{ color: accent }}>After the video:</p>
                    <p className="text-muted-foreground text-sm">You will complete a knowledge check, then proceed to the MCII exercise.</p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <div className="text-muted-foreground mb-4">
                    <p>
                      <strong style={{ color: accent }}>After the video:</strong> Let's check your understanding of MCII (Mental Contrasting with Implementation Intentions).
                    </p>
                  </div>
                  <PrePostKnowledgeCheck
                    questions={phase4KnowledgeChecks.postTest}
                    testType="post"
                    onComplete={handlePostTestComplete}
                  />
                </div>
              )}

                <div className="flex justify-end mt-8">
                  {currentStep === 1 && (
                    <Button 
                      className="font-semibold px-8 py-3 rounded-lg text-lg"
                      style={{
                        background: "linear-gradient(135deg, #d8b26f, #e6c98c)",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
                        color: "#1f1408",
                      }}
                      onClick={handleNext}
                      disabled={!videoCompleted}
                    >
                      Continue to Knowledge Check <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {currentStep === 2 && (
                    <Button 
                      className="font-semibold px-8 py-3 rounded-lg text-lg"
                      style={{
                        background: "linear-gradient(135deg, #d8b26f, #e6c98c)",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
                        color: "#1f1408",
                      }}
                      onClick={handleComplete}
                      disabled={!postTestCompleted}
                    >
                      Continue to Tasks <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 