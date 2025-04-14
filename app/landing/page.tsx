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
      {/* Animated stars background - keeping subtle background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/10 via-transparent to-transparent opacity-20"></div>
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
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                SoLBot
              </h1>
            </div>

            <h2 className="text-2xl md:text-3xl font-medium text-white/90 mb-6">
              Welcome to the Science of Learning to Learn! 
            </h2>

            <div className="pl-4 border-l-4 border-purple-500 mb-8">
              <p className="text-white/80">
                Learn powerful strategies to study effectively and reduce study anxiety in just 40 minutes. Study SMARTER, Not HARDER!
              </p>
            </div>

            {/* Questions Section - Simplified */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90">Struggling to organize your study sessions?</p>
              </div>

              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90">Using effective techniques to retain information?</p>
              </div>

              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90">Know how to adapt when strategies aren't working?</p>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
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

          {/* Right Column - Elegant SRL Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center justify-center"
          >
            {/* Card container with simplified SRL visualization */}
            <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl w-full max-w-md">
              <CardContent className="p-6 relative">
                {/* Simplified SRL Visualization with restored animations */}
                <div className="flex flex-col items-center mb-6">
                  <div className="mb-6 text-center">
                    <motion.div 
                      className="bg-gradient-to-br from-purple-600 to-indigo-700 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 relative"
                      animate={{
                        boxShadow: [
                          "0 0 15px rgba(147,51,234,0.3)",
                          "0 0 25px rgba(147,51,234,0.5)",
                          "0 0 15px rgba(147,51,234,0.3)",
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
                    <h3 className="text-xl font-bold text-white">Self-Regulated Learning</h3>
                  </div>
                  
                  {/* More compact SRL Elements in a cleaner 2x2 grid */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <motion.div 
                      className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/20 flex flex-col items-center text-center"
                      whileHover={{ scale: 1.03, borderColor: "rgba(99, 102, 241, 0.4)" }}
                    >
                      <Target className="h-5 w-5 text-indigo-400 mb-1" />
                      <span className="font-medium text-indigo-300 text-sm">PLAN</span>
                      <span className="text-[10px] text-indigo-300/70">Set clear objectives</span>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/20 flex flex-col items-center text-center"
                      whileHover={{ scale: 1.03, borderColor: "rgba(59, 130, 246, 0.4)" }}
                    >
                      <LineChart className="h-5 w-5 text-blue-400 mb-1" />
                      <span className="font-medium text-blue-300 text-sm">MONITOR</span>
                      <span className="text-[10px] text-blue-300/70">Track progress</span>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-purple-900/30 p-3 rounded-lg border border-purple-500/20 flex flex-col items-center text-center"
                      whileHover={{ scale: 1.03, borderColor: "rgba(168, 85, 247, 0.4)" }}
                    >
                      <RefreshCw className="h-5 w-5 text-purple-400 mb-1" />
                      <span className="font-medium text-purple-300 text-sm">ADAPT</span>
                      <span className="text-[10px] text-purple-300/70">Adjust strategies</span>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-amber-900/30 p-3 rounded-lg border border-amber-500/20 flex flex-col items-center text-center"
                      whileHover={{ scale: 1.03, borderColor: "rgba(217, 119, 6, 0.4)" }}
                    >
                      <CheckCircle className="h-5 w-5 text-amber-400 mb-1" />
                      <span className="font-medium text-amber-300 text-sm">EVALUATE</span>
                      <span className="text-[10px] text-amber-300/70">Assess results</span>
                    </motion.div>
                  </div>
                </div>

                {/* Meet Your Coach Section - Better aligned with SRL */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h3 className="text-xl font-bold text-white text-center mb-2">Meet Your Coach</h3>
                  <p className="text-white/70 text-center text-sm mb-4">
                    Your AI guide to evidence-based learning strategies for academic success.
                  </p>

                  <div className="flex justify-center mb-4">
                    <motion.div 
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      <Bot className="h-12 w-12 text-purple-400" />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 0.8, 0.6],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className="absolute -inset-3 rounded-full bg-purple-500/20 -z-10"
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <motion.div 
                      className="bg-indigo-900/40 rounded-lg p-2 border border-indigo-500/20 flex flex-col items-center"
                      whileHover={{ scale: 1.03, borderColor: "rgba(99, 102, 241, 0.4)" }}
                    >
                      <BrainCircuit className="h-4 w-4 text-indigo-400 mb-1" />
                      <span className="text-[10px] text-indigo-300">Personalized Guidance</span>
                    </motion.div>
                    <motion.div 
                      className="bg-purple-900/40 rounded-lg p-2 border border-purple-500/20 flex flex-col items-center"
                      whileHover={{ scale: 1.03, borderColor: "rgba(168, 85, 247, 0.4)" }}
                    >
                      <Target className="h-4 w-4 text-purple-400 mb-1" />
                      <span className="text-[10px] text-purple-300">Evidence-Based</span>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* What You'll Learn Section - With subtle animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 mb-12"
        >
          <div className="text-center relative mb-10">
            <motion.h3
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="text-2xl md:text-3xl font-bold text-white mb-2"
            >
              What You'll Learn
            </motion.h3>
            <div className="mx-auto w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Module 1 */}
            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <div className="p-6 h-full flex flex-col items-center">
                <div className="mb-4 flex justify-center">
                  <motion.div 
                    className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)" 
                    }}
                  >
                    <BrainCircuit className="h-8 w-8 text-blue-400" />
                  </motion.div>
                </div>
                <h4 className="text-xl font-bold text-white mb-3 text-center">Strategic Plan & Set Target</h4>
                <p className="text-white/80 text-center">Organize your learning process and set effective goals.</p>
              </div>
            </motion.div>

            {/* Module 2 */}
            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <div className="p-6 h-full flex flex-col items-center">
                <div className="mb-4 flex justify-center">
                  <motion.div 
                    className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)" 
                    }}
                  >
                    <Target className="h-8 w-8 text-purple-400" />
                  </motion.div>
                </div>
                <h4 className="text-xl font-bold text-white mb-3 text-center">Learning Strategies</h4>
                <p className="text-white/80 text-center">
                  Master techniques that maximize retention through active learning.
                </p>
              </div>
            </motion.div>

            {/* Module 3 */}
            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <div className="p-6 h-full flex flex-col items-center">
                <div className="mb-4 flex justify-center">
                  <motion.div 
                    className="bg-gradient-to-br from-indigo-600/30 to-indigo-800/30 p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 15px rgba(99, 102, 241, 0.3)" 
                    }}
                  >
                    <LineChart className="h-8 w-8 text-indigo-400" />
                  </motion.div>
                </div>
                <h4 className="text-xl font-bold text-white mb-3 text-center">Monitor & Adapt</h4>
                <p className="text-white/80 text-center">Track progress and make adjustments to improve your approach.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Button - With animation */}
        <div className="text-center mb-12">
          <Button
            onClick={handleGetStarted}
            className="py-6 px-8 rounded-full text-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30 text-white font-medium transition-transform"
          >
            <RocketLaunch className="mr-2 h-5 w-5" />
            Start Your Learning Journey
          </Button>
        </div>
      </div>
    </div>
  )
}

