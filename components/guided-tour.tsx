"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, MessageCircle, BarChart2, BookOpen, BrainCircuit, FormInput } from "lucide-react"
import { Button } from "@/components/ui/button"

const accent = "#d8b26f"

interface TourStep {
  title: string
  description: string
  icon: React.ReactNode
  // Position of the tooltip on screen
  position: "center" | "left" | "right" | "bottom-right" | "bottom-center"
  // Arrow direction pointing FROM the tooltip TO the element
  arrow?: "left" | "right" | "down" | "down-right" | "none"
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to SoL2LBot! 👋",
    description: "This is a 90-minute AI-guided training to help you study more effectively. Let me show you around!",
    icon: <BrainCircuit className="w-6 h-6" />,
    position: "center",
    arrow: "none",
  },
  {
    title: "Progress Tracker",
    description: "This sidebar shows your journey through 6 learning phases. Each phase builds on the last — you'll see your progress light up as you go.",
    icon: <BarChart2 className="w-6 h-6" />,
    position: "left",
    arrow: "left",
  },
  {
    title: "Your 6 Learning Phases",
    description: "You'll learn SRL fundamentals, set goals with MCII, discover study strategies, and build a monitoring plan. Each phase has videos, quizzes, and AI coaching.",
    icon: <BookOpen className="w-6 h-6" />,
    position: "center",
    arrow: "none",
  },
  {
    title: "AI Learning Assistant",
    description: "This floating chatbot is always available! Click it anytime to ask questions about self-regulated learning. It gives quick, helpful answers with examples.",
    icon: <MessageCircle className="w-6 h-6" />,
    position: "bottom-right",
    arrow: "down-right",
  },
  {
    title: "Start Here!",
    description: "Fill in your info below and choose your AI coach style. Then click 'Begin Learning Intervention' to start Phase 1. You've got this!",
    icon: <FormInput className="w-6 h-6" />,
    position: "bottom-center",
    arrow: "down",
  },
]

// Position styles for each step
function getPositionStyle(position: TourStep["position"]): React.CSSProperties {
  switch (position) {
    case "center":
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    case "left":
      return { top: "40%", left: "240px", transform: "translateY(-50%)" }
    case "right":
      return { top: "40%", right: "24px", transform: "translateY(-50%)" }
    case "bottom-right":
      return { bottom: "90px", right: "24px" }
    case "bottom-center":
      return { bottom: "40px", left: "50%", transform: "translateX(-50%)" }
    default:
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
  }
}

// Arrow component
function Arrow({ direction }: { direction: string }) {
  if (direction === "none") return null

  const baseStyle = "absolute w-0 h-0"
  switch (direction) {
    case "left":
      return (
        <div
          className={baseStyle}
          style={{
            left: "-12px", top: "50%", transform: "translateY(-50%)",
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            borderRight: `12px solid ${accent}`,
          }}
        />
      )
    case "right":
      return (
        <div
          className={baseStyle}
          style={{
            right: "-12px", top: "50%", transform: "translateY(-50%)",
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            borderLeft: `12px solid ${accent}`,
          }}
        />
      )
    case "down":
      return (
        <div
          className={baseStyle}
          style={{
            bottom: "-12px", left: "50%", transform: "translateX(-50%)",
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: `12px solid ${accent}`,
          }}
        />
      )
    case "down-right":
      return (
        <div
          className={baseStyle}
          style={{
            bottom: "-12px", right: "30px",
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: `12px solid ${accent}`,
          }}
        />
      )
    default:
      return null
  }
}

export default function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show tour once per user
    try {
      const tourSeen = localStorage.getItem("solbot_tour_completed")
      if (!tourSeen) {
        // Small delay so page renders first
        const timer = setTimeout(() => setIsVisible(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // If localStorage fails, show tour anyway
      const timer = setTimeout(() => setIsVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    try {
      localStorage.setItem("solbot_tour_completed", "true")
    } catch {}

    // Log tour completion for analytics
    try {
      const sessionId = localStorage.getItem("session_id")
      if (sessionId) {
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: 'tour_completed',
            phase: 'intro',
            component: 'guided_tour',
            metadata: {
              steps_viewed: currentStep + 1,
              total_steps: TOUR_STEPS.length,
              completed: currentStep === TOUR_STEPS.length - 1,
              timestamp: new Date().toISOString()
            }
          })
        })
      }
    } catch {}
  }

  if (!isVisible) return null

  const step = TOUR_STEPS[currentStep]

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(2px)" }}
            onClick={handleClose}
          />

          {/* Tour tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="fixed z-[9999] max-w-sm w-[340px]"
            style={getPositionStyle(step.position)}
          >
            <div
              className="relative rounded-xl border shadow-2xl overflow-hidden"
              style={{
                backgroundColor: "hsl(var(--card))",
                borderColor: accent,
                borderWidth: "2px",
              }}
            >
              {/* Arrow pointer */}
              <Arrow direction={step.arrow || "none"} />

              {/* Header with step counter */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accent, color: "#1f1408" }}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {currentStep + 1} / {TOUR_STEPS.length}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-3">
                <h3 className="text-base font-semibold mb-1.5" style={{ color: "hsl(var(--foreground))" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {step.description}
                </p>
              </div>

              {/* Navigation */}
              <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: "hsl(var(--border))" }}>
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{
                        backgroundColor: idx === currentStep ? accent : "hsl(var(--muted))",
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrev}
                      className="h-8 px-2 text-xs"
                    >
                      <ChevronLeft className="w-4 h-4 mr-0.5" />
                      Back
                    </Button>
                  )}
                  {currentStep === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="h-8 px-2 text-xs"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Skip
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-8 px-3 text-xs font-semibold"
                    style={{ backgroundColor: accent, color: "#1f1408" }}
                  >
                    {currentStep === TOUR_STEPS.length - 1 ? "Got it!" : "Next"}
                    {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-0.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
