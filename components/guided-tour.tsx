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
  // CSS selector to find the target element
  target: string | null  // null = center screen (no element)
  // Where to place tooltip relative to the target
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
    title: "📊 Your Progress Tracker",
    description: "This sidebar tracks your journey through 6 learning phases. Each phase lights up as you complete it — you can always see where you are.",
    icon: <BarChart2 className="w-5 h-5" />,
    target: "[data-tour='progress-bar']",
    placement: "right",
  },
  {
    title: "📚 6 Learning Phases",
    description: "You'll progress through: SRL intro → Task analysis → Learning strategies → Goal setting (MCII) → Monitoring → Final assessment. Each phase has videos, quizzes, and AI coaching.",
    icon: <BookOpen className="w-5 h-5" />,
    target: "[data-tour='phases']",
    placement: "top",
  },
  {
    title: "💬 AI Learning Assistant",
    description: "This floating button is your AI helper — click it anytime to ask questions about learning strategies. It gives quick, helpful answers with real examples!",
    icon: <MessageCircle className="w-5 h-5" />,
    target: ".fixed.bottom-6.right-6",  // The floating chatbot button container
    placement: "left",
  },
  {
    title: "✏️ Fill In & Get Started",
    description: "Enter your info, choose your AI coach style (warm or direct), then click 'Begin Learning Intervention' to start Phase 1!",
    icon: <PenLine className="w-5 h-5" />,
    target: "[data-tour='form']",
    placement: "top",
  },
]

interface Rect {
  top: number; left: number; width: number; height: number
}

export default function GuidedTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)

  // Measure the target element for the current step
  const measureTarget = useCallback(() => {
    const s = TOUR_STEPS[step]
    if (!s.target) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(s.target)
    if (el) {
      const r = el.getBoundingClientRect()
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    } else {
      setTargetRect(null)
    }
  }, [step])

  useEffect(() => {
    try {
      if (localStorage.getItem("solbot_tour_completed")) return
    } catch {}
    const timer = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) return
    // Small delay to let scroll finish before measuring
    const timer = setTimeout(measureTarget, 350)
    const handleResize = () => measureTarget()
    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", handleResize)
    }
  }, [visible, step, measureTarget])

  const close = () => {
    setVisible(false)
    try { localStorage.setItem("solbot_tour_completed", "true") } catch {}
    try {
      const sid = localStorage.getItem("session_id")
      if (sid) {
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
  const pad = 8 // padding around highlight

  // Calculate tooltip position based on target and placement
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || s.placement === "center") {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    }
    const { top, left, width, height } = targetRect
    switch (s.placement) {
      case "right":
        return { position: "fixed", top: top + height / 2, left: left + width + pad + 16, transform: "translateY(-50%)" }
      case "left":
        return { position: "fixed", top: top + height / 2, right: window.innerWidth - left + pad + 16, transform: "translateY(-50%)" }
      case "bottom":
        return { position: "fixed", top: top + height + pad + 16, left: left + width / 2, transform: "translateX(-50%)" }
      case "top":
        return { position: "fixed", bottom: window.innerHeight - top + pad + 16, left: Math.max(20, Math.min(left + width / 2, window.innerWidth - 360)), transform: "translateX(-50%)" }
      default:
        return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    }
  }

  // SVG overlay with a cut-out hole around the target element
  const renderOverlay = () => {
    const w = window.innerWidth
    const h = window.innerHeight

    if (!targetRect) {
      // No target — full dark overlay
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998]"
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
          onClick={close}
        />
      )
    }

    const { top: rTop, left: rLeft, width: rWidth, height: rHeight } = targetRect
    const x = rLeft - pad
    const y = rTop - pad
    const rw = rWidth + pad * 2
    const rh = rHeight + pad * 2
    const radius = 12

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
        onClick={close}
      >
        <svg width={w} height={h} className="absolute inset-0">
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width={w} height={h} fill="white" />
              <rect x={x} y={y} width={rw} height={rh} rx={radius} ry={radius} fill="black" />
            </mask>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)" />
          {/* Highlight border around the element */}
          <rect
            x={x} y={y} width={rw} height={rh} rx={radius} ry={radius}
            fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="6 3"
          />
        </svg>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {renderOverlay()}

          {/* Tooltip card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="z-[9999] w-[340px]"
            style={getTooltipStyle()}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="rounded-xl border-2 shadow-2xl overflow-hidden"
              style={{ backgroundColor: "hsl(var(--card))", borderColor: accent }}
            >
              {/* Header */}
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${accent}25, ${accent}08)` }}>
                <div className="flex items-center gap-2.5">
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
                {/* Dots */}
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all"
                      style={{
                        width: i === step ? 16 : 7,
                        height: 7,
                        backgroundColor: i === step ? accent : "hsl(var(--muted))",
                      }}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-1.5">
                  {step === 0 ? (
                    <Button variant="ghost" size="sm" onClick={close} className="h-7 px-2 text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Skip tour
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
  )
}
