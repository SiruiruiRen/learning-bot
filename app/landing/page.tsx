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
  const [showQuestions, setShowQuestions] = useState(false)

  const handleGetStarted = () => {
    setLoading(true)
    // Simulate loading for a smoother transition
    setTimeout(() => {
      router.push("/intro")
      setLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent opacity-30"></div>

        {/* Cosmic background with animated planets */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 right-20 w-32 h-32 rounded-full bg-purple-300 opacity-20 blur-md"
            animate={{
              y: [0, 10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          ></motion.div>
          <motion.div
            className="absolute top-40 left-40 w-16 h-16 rounded-full bg-indigo-200 opacity-20 blur-sm"
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          ></motion.div>
          <motion.div
            className="absolute bottom-60 right-60 w-24 h-24 rounded-full bg-violet-300 opacity-20 blur-md"
            animate={{
              y: [0, -10, 0],
              scale: [1, 0.95, 1],
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          ></motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[80vh] items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
              className="mb-3"
            >
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                SoLBot
              </h1>
            </motion.div>

            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <h2 className="text-2xl md:text-3xl font-medium text-white/90 mb-6">
                Welcome to the Science of Learning to Learn!
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div className="pl-4 border-l-4 border-purple-500 mb-8">
                <motion.p
                  animate={{
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="text-white/80"
                >
                  Learn powerful strategies to study effectively and retain information longer in just 40 minutes.
                </motion.p>
              </div>
            </motion.div>

            {/* Questions Section - Simplified */}
            <div className="space-y-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="flex items-start gap-3"
              >
                <HelpCircle className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90">Struggling to organize your study sessions?</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="flex items-start gap-3"
              >
                <HelpCircle className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90">Using effective techniques to retain information?</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="flex items-start gap-3"
              >
                <HelpCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90">Know how to adapt when strategies aren't working?</p>
              </motion.div>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
            >
              <Button
                onClick={handleGetStarted}
                disabled={loading}
                className="py-6 px-8 rounded-full text-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-500/30 text-white font-medium"
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

          {/* Right Column - SRL Visualization and Meet Your Coach */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            {/* Card container for both SRL visualization and Meet Your Coach */}
            <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl w-full max-w-md overflow-visible">
              <CardContent className="p-0 relative">
                {/* SRL Visualization - positioned to overlap the top of the card */}
                <div className="relative h-[350px] w-full">
                  {/* Orbit circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-white/10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 40,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="w-full h-full relative"
                    >
                      {/* PLAN node - top */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 rounded-full bg-teal-800 flex items-center justify-center shadow-lg">
                          <div className="text-center">
                            <Target className="h-6 w-6 text-white mx-auto mb-1" />
                            <span className="text-xs font-bold text-white">PLAN</span>
                          </div>
                        </div>
                      </div>

                      {/* MONITOR node - right */}
                      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center shadow-lg">
                          <div className="text-center rotate-90">
                            <LineChart className="h-6 w-6 text-white mx-auto mb-1" />
                            <span className="text-xs font-bold text-white">MONITOR</span>
                          </div>
                        </div>
                      </div>

                      {/* EVALUATE node - bottom */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <div className="w-16 h-16 rounded-full bg-amber-800 flex items-center justify-center shadow-lg">
                          <div className="text-center rotate-180">
                            <CheckCircle className="h-6 w-6 text-white mx-auto mb-1" />
                            <span className="text-xs font-bold text-white">EVALUATE</span>
                          </div>
                        </div>
                      </div>

                      {/* ADAPT node - left */}
                      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 rounded-full bg-purple-800 flex items-center justify-center shadow-lg">
                          <div className="text-center -rotate-90">
                            <RefreshCw className="h-6 w-6 text-white mx-auto mb-1" />
                            <span className="text-xs font-bold text-white">ADAPT</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Central Learning Cycle - Simplified with just the book icon */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(147,51,234,0.3)",
                        "0 0 30px rgba(147,51,234,0.5)",
                        "0 0 20px rgba(147,51,234,0.3)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="text-center text-white">
                      {/* Single book icon */}
                      <div className="relative mb-4 flex justify-center">
                        <motion.div
                          animate={{ scale: [0.95, 1.05, 0.95] }}
                          transition={{
                            duration: 3,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                          className="bg-indigo-600/80 rounded-md p-2"
                        >
                          <BookOpen className="h-8 w-8 text-white" />
                        </motion.div>
                      </div>
                      <h3 className="text-lg font-bold">
                        Self-Regulated
                        <br />
                        Learning
                      </h3>
                    </div>
                  </motion.div>
                </div>

                {/* Meet Your Coach Section */}
                <div className="p-6 pt-0">
                  <h3 className="text-xl font-bold text-white text-center mb-4">Meet Your Coach</h3>
                  <p className="text-white/70 text-center mb-6">
                    Your AI guide to evidence-based learning strategies for academic success.
                  </p>

                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/80 to-blue-500/50 flex items-center justify-center">
                        <Bot className="h-12 w-12 text-white" />
                      </div>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 w-24 h-24 rounded-full bg-purple-500/30 -z-10"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: 0.5,
                        }}
                        className="absolute inset-0 w-24 h-24 rounded-full bg-blue-500/20 -z-20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-indigo-900/40 rounded-lg p-3 border border-indigo-500/20">
                      <div className="flex flex-col items-center">
                        <BrainCircuit className="h-5 w-5 text-indigo-400 mb-1" />
                        <span className="text-xs text-indigo-300">Personalized Guidance</span>
                      </div>
                    </div>
                    <div className="bg-purple-900/40 rounded-lg p-3 border border-purple-500/20">
                      <div className="flex flex-col items-center">
                        <Target className="h-5 w-5 text-purple-400 mb-1" />
                        <span className="text-xs text-purple-300">Evidence-Based</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* What You'll Learn Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-16 mb-12"
        >
          <div className="text-center relative mb-12">
            <motion.h3
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="text-2xl md:text-3xl font-bold text-white"
            >
              What You'll Learn
            </motion.h3>
            <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Module 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="bg-slate-900/40 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all h-full">
                <CardContent className="p-6">
                  <div className="bg-blue-500/10 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <BrainCircuit className="h-6 w-6 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Strategic Plan & Set Target</h4>
                  <p className="text-white/70 text-sm">Organize your learning process and set effective goals.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Module 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.7 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="bg-slate-900/40 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all h-full">
                <CardContent className="p-6">
                  <div className="bg-purple-500/10 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Learning Strategies</h4>
                  <p className="text-white/70 text-sm">
                    Master techniques that maximize retention through active learning.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Module 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.9 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="bg-slate-900/40 backdrop-blur-sm border border-indigo-500/20 hover:border-indigo-500/40 transition-all h-full">
                <CardContent className="p-6">
                  <div className="bg-indigo-500/10 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <LineChart className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Monitor & Adapt</h4>
                  <p className="text-white/70 text-sm">Track progress and make adjustments to improve your approach.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.1 }}
          className="text-center mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 4px 20px rgba(107, 70, 193, 0.5)",
                "0 4px 30px rgba(107, 70, 193, 0.7)",
                "0 4px 20px rgba(107, 70, 193, 0.5)",
              ],
            }}
            transition={{
              boxShadow: {
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              },
            }}
          >
            <Button
              onClick={handleGetStarted}
              className="py-6 px-8 rounded-full text-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-500/30 text-white font-medium"
            >
              <RocketLaunch className="mr-2 h-5 w-5" />
              Start Your Learning Journey
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

