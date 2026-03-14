"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  RocketIcon as RocketLaunch,
  BrainCircuit,
  Target,
  LineChart,
  CheckCircle,
  RefreshCw,
  Bot,
  BookOpen,
  HelpCircle,
} from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGetStarted = () => {
    setLoading(true)
    setTimeout(() => {
      router.push("/intro")
      setLoading(false)
    }, 800)
  }

  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.78)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const accent = "var(--accent-text)"

  return (
    <div className="min-h-screen text-foreground py-8" style={{ background: canvasGradient }}>
      {/* Background gradient overlays */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(120%_120%_at_85%_15%,rgba(0,0,0,0.04),transparent),radial-gradient(140%_120%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[80vh] items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <div className="mb-3">
              <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, #d8b26f, #b8892e, #d8b26f)" }}>
                SoL2LBot
              </h1>
            </div>

            <h2 className="text-2xl md:text-3xl font-medium text-foreground/90 mb-6">
              Welcome to the Science of Learning to Learn!
            </h2>

            <div className="pl-4 mb-8" style={{ borderLeft: "4px solid #b8892e" }}>
              <p className="text-muted-foreground">
                Learn powerful strategies to study effectively and reduce study anxiety in just 40 minutes. Study SMARTER, Not HARDER!
              </p>
            </div>

            {/* Questions Section */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
                <p className="text-foreground/90">Struggling to organize your study sessions?</p>
              </div>

              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
                <p className="text-foreground/90">Using effective techniques to retain information?</p>
              </div>

              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
                <p className="text-foreground/90">Know how to adapt when strategies aren't working?</p>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={handleGetStarted}
                disabled={loading}
                className="py-6 px-8 rounded-full text-lg shadow-lg text-white font-medium"
                style={{ background: "linear-gradient(135deg, #d8b26f, #b8892e)", boxShadow: "0 4px 14px rgba(184,137,46,0.3)" }}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Launching...
                  </>
                ) : (
                  <>
                    <RocketLaunch className="mr-2 h-5 w-5" />
                    Begin Your Learning Journey
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Elegant SRL Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center justify-center"
          >
            <Card className="backdrop-blur-md border shadow-xl w-full max-w-md" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
              <CardContent className="p-6 relative">
                {/* Simplified SRL Visualization */}
                <div className="flex flex-col items-center mb-6">
                  <div className="mb-6 text-center">
                    <motion.div
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 relative"
                      style={{ background: "linear-gradient(135deg, #d8b26f, #b8892e)" }}
                      animate={{
                        boxShadow: [
                          "0 0 15px rgba(216,178,111,0.3)",
                          "0 0 25px rgba(216,178,111,0.5)",
                          "0 0 15px rgba(216,178,111,0.3)",
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      <motion.div
                        animate={{ scale: [0.95, 1.05, 0.95] }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      >
                        <BookOpen className="h-10 w-10 text-white" />
                      </motion.div>
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground">Self-Regulated Learning</h3>
                  </div>

                  {/* SRL Elements in a 2x2 grid */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <motion.div
                      className="p-3 rounded-lg border flex flex-col items-center text-center"
                      style={{ backgroundColor: "hsl(var(--muted) / 0.35)", borderColor: neutralBorder }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Target className="h-5 w-5 mb-1" style={{ color: accent }} />
                      <span className="font-medium text-sm" style={{ color: accent }}>PLAN</span>
                      <span className="text-[10px] text-muted-foreground">Set clear objectives</span>
                    </motion.div>

                    <motion.div
                      className="p-3 rounded-lg border flex flex-col items-center text-center"
                      style={{ backgroundColor: "hsl(var(--muted) / 0.35)", borderColor: neutralBorder }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <LineChart className="h-5 w-5 mb-1" style={{ color: accent }} />
                      <span className="font-medium text-sm" style={{ color: accent }}>MONITOR</span>
                      <span className="text-[10px] text-muted-foreground">Track progress</span>
                    </motion.div>

                    <motion.div
                      className="p-3 rounded-lg border flex flex-col items-center text-center"
                      style={{ backgroundColor: "hsl(var(--muted) / 0.35)", borderColor: neutralBorder }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <RefreshCw className="h-5 w-5 mb-1" style={{ color: accent }} />
                      <span className="font-medium text-sm" style={{ color: accent }}>ADAPT</span>
                      <span className="text-[10px] text-muted-foreground">Adjust strategies</span>
                    </motion.div>

                    <motion.div
                      className="p-3 rounded-lg border flex flex-col items-center text-center"
                      style={{ backgroundColor: "hsl(var(--muted) / 0.35)", borderColor: neutralBorder }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <CheckCircle className="h-5 w-5 mb-1" style={{ color: accent }} />
                      <span className="font-medium text-sm" style={{ color: accent }}>EVALUATE</span>
                      <span className="text-[10px] text-muted-foreground">Assess results</span>
                    </motion.div>
                  </div>
                </div>

                {/* Meet Your Coach Section */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: neutralBorder }}>
                  <h3 className="text-xl font-bold text-foreground text-center mb-2">Meet Your Coach</h3>
                  <p className="text-muted-foreground text-center text-sm mb-4">
                    Your AI guide to evidence-based learning strategies for academic success.
                  </p>

                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      <Bot className="h-12 w-12" style={{ color: accent }} />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <motion.div
                      className="rounded-lg p-2 border flex flex-col items-center"
                      style={{ backgroundColor: "hsl(var(--muted) / 0.35)", borderColor: neutralBorder }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <BrainCircuit className="h-4 w-4 mb-1" style={{ color: accent }} />
                      <span className="text-[10px] text-muted-foreground">Personalized Guidance</span>
                    </motion.div>
                    <motion.div
                      className="rounded-lg p-2 border flex flex-col items-center"
                      style={{ backgroundColor: "hsl(var(--muted) / 0.35)", borderColor: neutralBorder }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Target className="h-4 w-4 mb-1" style={{ color: accent }} />
                      <span className="text-[10px] text-muted-foreground">Evidence-Based</span>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* What You'll Learn Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 mb-12"
        >
          <div className="text-center relative mb-10">
            <motion.h3
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              What You'll Learn
            </motion.h3>
            <div className="mx-auto w-20 h-1 rounded-full" style={{ background: "linear-gradient(to right, #d8b26f, #b8892e)" }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }} className="h-full">
              <div className="p-6 h-full flex flex-col items-center">
                <div className="mb-4 flex justify-center">
                  <motion.div
                    className="p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                    style={{ background: "hsl(var(--muted) / 0.5)" }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(216,178,111,0.3)" }}
                  >
                    <BrainCircuit className="h-8 w-8" style={{ color: accent }} />
                  </motion.div>
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3 text-center">Strategic Plan & Set Target</h4>
                <p className="text-muted-foreground text-center">Organize your learning process and set effective goals.</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }} className="h-full">
              <div className="p-6 h-full flex flex-col items-center">
                <div className="mb-4 flex justify-center">
                  <motion.div
                    className="p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                    style={{ background: "hsl(var(--muted) / 0.5)" }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(216,178,111,0.3)" }}
                  >
                    <Target className="h-8 w-8" style={{ color: accent }} />
                  </motion.div>
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3 text-center">Learning Strategies</h4>
                <p className="text-muted-foreground text-center">
                  Master techniques that maximize retention through active learning.
                </p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }} className="h-full">
              <div className="p-6 h-full flex flex-col items-center">
                <div className="mb-4 flex justify-center">
                  <motion.div
                    className="p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                    style={{ background: "hsl(var(--muted) / 0.5)" }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(216,178,111,0.3)" }}
                  >
                    <LineChart className="h-8 w-8" style={{ color: accent }} />
                  </motion.div>
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3 text-center">Monitor & Adapt</h4>
                <p className="text-muted-foreground text-center">Track progress and make adjustments to improve your approach.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <div className="text-center mb-12">
          <Button
            onClick={handleGetStarted}
            className="py-6 px-8 rounded-full text-lg shadow-lg text-white font-medium transition-transform hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #d8b26f, #b8892e)", boxShadow: "0 4px 14px rgba(184,137,46,0.3)" }}
          >
            <RocketLaunch className="mr-2 h-5 w-5" />
            Start Your Learning Journey
          </Button>
        </div>
      </div>
    </div>
  )
}
