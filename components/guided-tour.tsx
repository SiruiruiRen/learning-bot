"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, MessageCircle, BarChart2, BookOpen, BrainCircuit, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"

const accent = "#d8b26f"

interface TourStep {
  title: string
  description: string
  icon: React.ReactNode
  target: string | null  // CSS selector; null = no element, show centered
  placement: "center" | "right" | "bottom" | "top" | "left"
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to SoL2LBot! 👋",
    description: "This is a 90-minute AI-guided training that teaches you evidence-based study strategies. Let me give you a quick tour!",
    icon: <BrainCircuit className="w-5 h-5" />,
    target: null,
    placement: "center",
  },
  {
    title: "📊 JOURNEY Sidebar",
    description: "This shows your current position in the 6-phase learning journey. The active phase is highlighted — you'll progress from Phase 1 all the way to Phase 6.",
    icon: <BarChart2 className="w-5 h-5" />,
    target: "[data-tour='progress-bar']",
    placement: "right",
  },
  {
    title: "📚 6 Learning Phases",
    description: "SRL intro → Task analysis → Learning strategies → Goal setting (MCII) → Monitoring → Final assessment. Each has videos, quizzes, and AI coaching.",
    icon: <BookOpen className="w-5 h-5" />,
    target: "[data-tour='phases']",
    placement: "top",
  },
  {
    title: "💬 AI Learning Assistant",
    description: "The gold button in the bottom-right corner is your AI helper — click it anytime to ask questions about learning strategies. It gives quick answers with real examples!",
    icon: <MessageCircle className="w-5 h-5" />,
    target: ".fixed.bottom-6.right-6",
    placement: "top",
  },
  {
    title: "✏️ Fill In & Get Started",
    description: "Enter your info, choose your AI coach style (warm or direct), then click 'Begin Learning Intervention' to start!",
    icon: <PenLine className="w-5 h-5" />,
    target: "[data-tour='form']",
    placement: "top",
  },
]

interface Rect { top: number; left: number; width: number; height: number }

export default function GuidedTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)

  const measureTarget = useCallback(() => {
    const s = TOUR_STEPS[step]
    if (!s.target) { setTargetRect(null); return }
    const el = document.querySelector(s.target)
    if (el) {
      // Scroll into view first
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      // Measure after scroll
      setTimeout(() => {
        const r = el.getBoundingClientRect()
        setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }, 400)
    } else {
      setTargetRect(null)
    }
  }, [step])

  useEffect(() => {
    // Always show tour on every page load — helps new users orient themselves
    const timer = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) return
    measureTarget()
    const handleResize = () => measureTarget()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [visible, step, measureTarget])

  const close = () => {
    setVisible(false)
    try {
      const sid = localStorage.getItem("session_id")
      if (sid) {
        fetch("/api/events", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sid, event_type: "tour_completed", phase: "intro", component: "guided_tour",
            metadata: { steps_viewed: step + 1, total_steps: TOUR_STEPS.length, completed: step === TOUR_STEPS.length - 1, timestamp: new Date().toISOString() }
          })
        })
      }
    } catch {}
  }

  const next = () => { if (step < TOUR_STEPS.length - 1) setStep(s => s + 1); else close() }
  const prev = () => { if (step > 0) setStep(s => s - 1) }

  if (!visible) return null

  const s = TOUR_STEPS[step]
  const pad = 10

  // Tooltip position relative to target element
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || s.placement === "center") {
      return { position: "fixed", top: "35%", left: "50%", transform: "translateX(-50%)" }
    }
    const { top, left, width, height } = targetRect
    const gap = 14
    switch (s.placement) {
      case "right":
        return {
          position: "fixed",
          top: Math.max(20, top + height / 2 - 80),
          left: Math.min(left + width + gap, window.innerWidth - 360),
        }
      case "left":
        return {
          position: "fixed",
          top: Math.max(20, top + height / 2 - 80),
          left: Math.max(20, left - 340 - gap),
        }
      case "bottom":
        return {
          position: "fixed",
          top: top + height + gap,
          left: Math.max(20, Math.min(left + width / 2 - 170, window.innerWidth - 360)),
        }
      case "top":
        return {
          position: "fixed",
          top: Math.max(20, Math.min(top - 200, window.innerHeight - 220)),
          left: Math.max(20, Math.min(left + width / 2 - 170, window.innerWidth - 360)),
        }
      default:
        return { position: "fixed", top: "35%", left: "50%", transform: "translateX(-50%)" }
    }
  }

  // Arrow connecting tooltip to target
  const renderArrow = () => {
    if (!targetRect || s.placement === "center") return null

    const { top, left, width, height } = targetRect
    // Calculate arrow endpoints
    let x1: number, y1: number, x2: number, y2: number

    switch (s.placement) {
      case "right": {
        x1 = left + width + 4; y1 = top + height / 2
        const tooltip = getTooltipStyle()
        x2 = (tooltip.left as number); y2 = (tooltip.top as number) + 40
        break
      }
      case "left": {
        x1 = left - 4; y1 = top + height / 2
        x2 = Math.max(20, left - 340 - 14) + 330; y2 = Math.max(20, top + height / 2 - 80) + 40
        break
      }
      case "top": {
        x1 = left + width / 2; y1 = top - 4
        const tLeft = Math.max(20, Math.min(left + width / 2 - 170, window.innerWidth - 360))
        x2 = tLeft + 170; y2 = Math.max(20, top - 180) + 160
        break
      }
      case "bottom": {
        x1 = left + width / 2; y1 = top + height + 4
        const tLeft2 = Math.max(20, Math.min(left + width / 2 - 170, window.innerWidth - 360))
        x2 = tLeft2 + 170; y2 = top + height + 14
        break
      }
      default: return null
    }

    return (
      <svg className="fixed inset-0 z-[9998] pointer-events-none" width="100%" height="100%">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={accent} />
          </marker>
        </defs>
        <line
          x1={x2} y1={y2} x2={x1} y2={y1}
          stroke={accent} strokeWidth="2.5" strokeDasharray="6 4"
          markerEnd="url(#arrowhead)"
        />
      </svg>
    )
  }

  // Highlight ring around target element
  const renderHighlight = () => {
    if (!targetRect) return null
    const { top, left, width, height } = targetRect
    return (
      <motion.div
        key={`highlight-${step}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-[9997] pointer-events-none rounded-xl"
        style={{
          top: top - pad,
          left: left - pad,
          width: width + pad * 2,
          height: height + pad * 2,
          border: `3px solid ${accent}`,
          boxShadow: `0 0 0 4px ${accent}30, 0 0 20px ${accent}40`,
          animation: "tour-pulse 1.5s ease-in-out infinite",
        }}
      />
    )
  }

  return (
    <>
      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(216, 178, 111, 0.2), 0 0 20px rgba(216, 178, 111, 0.25); }
          50% { box-shadow: 0 0 0 8px rgba(216, 178, 111, 0.35), 0 0 30px rgba(216, 178, 111, 0.4); }
        }
      `}</style>

      <AnimatePresence>
        {visible && (
          <>
            {/* Light semi-transparent backdrop — still see the page */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9996]"
              style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
              onClick={close}
            />

            {/* Highlight ring around target */}
            {renderHighlight()}

            {/* Arrow from tooltip to target */}
            {renderArrow()}

            {/* Tooltip */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed z-[9999] w-[330px]"
              style={getTooltipStyle()}
              onClick={e => e.stopPropagation()}
            >
              <div
                className="rounded-xl shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: "hsl(var(--card))",
                  border: `2px solid ${accent}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.3)`,
                }}
              >
                {/* Header */}
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: accent, color: "#1f1408" }}>
                      {s.icon}
                    </div>
                    <span className="text-xs font-bold" style={{ color: accent }}>
                      Step {step + 1} of {TOUR_STEPS.length}
                    </span>
                  </div>
                  <button onClick={close} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                    <X className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                  <h3 className="text-[15px] font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                    {s.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {s.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 flex items-center justify-between border-t" style={{ borderColor: "hsl(var(--border))" }}>
                  <div className="flex gap-1.5">
                    {TOUR_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full transition-all"
                        style={{
                          width: i === step ? 18 : 7,
                          height: 7,
                          backgroundColor: i <= step ? accent : "hsl(var(--muted))",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {step === 0 ? (
                      <Button variant="ghost" size="sm" onClick={close} className="h-7 px-2 text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Skip
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={prev} className="h-7 px-2 text-[11px]">
                        <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Back
                      </Button>
                    )}
                    <Button size="sm" onClick={next} className="h-7 px-3 text-[11px] font-bold" style={{ backgroundColor: accent, color: "#1f1408" }}>
                      {step === TOUR_STEPS.length - 1 ? "Let's go! 🚀" : "Next"}
                      {step < TOUR_STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 ml-0.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
