"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedMCII from "@/components/guided-mcii"
import InstructionGuide from "@/components/instruction-guide"
import FinalSubmissionCard from "@/components/final-submission-card"
import { PhaseNavigationButton } from "@/components/phase-navigation-button"
import { phaseInstructions } from "@/lib/post-task-questions"

const MCII_QUESTION_LABELS = [
  { id: "pick_goal", label: "1. Goal" },
  { id: "indulge", label: "2. Indulge (Visualization)" },
  { id: "consider_obstacles", label: "3. Consider Obstacles" },
  { id: "implementation_intention", label: "4. Implementation Intention" },
]

export default function MCIIPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [showInstruction, setShowInstruction] = useState(true)
  const [chatComplete, setChatComplete] = useState(false)
  const [finalSubmitted, setFinalSubmitted] = useState(false)
  const [editKey, setEditKey] = useState(0)

  const accent = "var(--accent-text)"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id")
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      console.warn("No user_id found, redirecting to intro.")
      router.push('/intro')
    }
  }, [router])

  const handleComplete = () => {
    // Track Phase 4 sub-task completion
    const savedProgress = localStorage.getItem("solbot_phase4_completed_tasks");
    const completedTasks = savedProgress ? JSON.parse(savedProgress) : [];
    if (!completedTasks.includes('mcii')) {
      completedTasks.push('mcii');
      localStorage.setItem("solbot_phase4_completed_tasks", JSON.stringify(completedTasks));
    }
    setChatComplete(true);
  }

  const handleStartChat = () => {
    setShowInstruction(false)
  }

  const handleEdit = () => {
    setChatComplete(false)
    setShowInstruction(false) // Go directly to guided component, not instruction
    setEditKey((prev) => prev + 1)
  }

  const handleFinalSubmit = () => {
    setFinalSubmitted(true)
  }

  return (
    <div className="min-h-screen text-foreground" style={{ background: canvasGradient }}>
      <div className="container mx-auto px-4 py-8">
        <ModuleBar currentPhase={4} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-4xl mx-auto mt-10"
        >
          {/* Instruction + Guided Component — hidden when showing final submission */}
          {!chatComplete && (
            <Card className="shadow-sm" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                  <Target className="h-8 w-8" style={{ color: accent }} />
                  <span>MCII: Mental Contrasting with Implementation Intentions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[620px] p-3 text-sm" style={{ color: mutedText }}>
                {userId ? (
                  <>
                    {showInstruction && (
                      <div className="space-y-4">
                        <InstructionGuide
                          title={phaseInstructions.phase4.title}
                          instructions={phaseInstructions.phase4.instructions}
                          tips={phaseInstructions.phase4.tips}
                          examples={phaseInstructions.phase4.examples}
                          phase="phase4"
                        />
                        <div className="flex justify-center mt-6">
                          <Button
                            onClick={handleStartChat}
                            style={primaryButtonStyle}
                            title="Start the MCII exercise"
                          >
                            Start MCII Exercise
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {!showInstruction && (
                      <>
                      <div
                        className="flex items-start gap-3 p-3 mb-3 rounded-lg border-l-4"
                        style={{
                          borderLeftColor: "#d8b26f",
                          backgroundColor: "hsl(var(--muted) / 0.25)",
                        }}
                      >
                        <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#d8b26f" }} />
                        <p className="text-sm text-muted-foreground">
                          Complete each guided question, then click <strong>&quot;Get AI Score &amp; Feedback&quot;</strong> to receive your score.
                          You can revise your answers and request feedback as many times as you like.
                          When you&apos;re satisfied, click <strong>&ldquo;Submit Final Version&rdquo;</strong> to continue.
                        </p>
                      </div>
                      <GuidedMCII
                        key={editKey}
                        userId={userId}
                        phase="4"
                        component="mcii"
                        onComplete={handleComplete}
                        height="100%"
                      />
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading session...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Final Submission Card — stays visible to show success state */}
          {chatComplete && (
            <div className="mb-6">
              <FinalSubmissionCard
                phase="4"
                phaseNumber={4}
                componentName="mcii"
                questionLabels={MCII_QUESTION_LABELS}
                onEdit={handleEdit}
                onSubmit={handleFinalSubmit}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            {!chatComplete && (
              <Button
                variant="outline"
                className="border"
                style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                onClick={() => { if (window.confirm('Go back? Any unsaved progress will be lost.')) router.push('/phase4'); }}
                title="Return to the instructions page"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Instructions
              </Button>
            )}
            {finalSubmitted && (
              <PhaseNavigationButton
                nextPhase={5}
                onNavigate={() => router.push('/phase5')}
                style={primaryButtonStyle}
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
