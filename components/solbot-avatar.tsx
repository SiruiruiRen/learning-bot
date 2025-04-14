"use client"

import { motion } from "framer-motion"
import { Atom, Braces, CircuitBoardIcon as Circuit, Code, Cpu, Database, Sigma } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

interface SolBotAvatarProps {
  size?: "sm" | "md" | "lg"
  pulseEffect?: boolean
}

export default function SolBotAvatar({ size = "md", pulseEffect = false }: SolBotAvatarProps) {
  const [currentIcon, setCurrentIcon] = useState(0)

  // STEM-themed icons that will rotate
  const stemIcons = [
    <Atom key="atom" className="text-white" />,
    <Circuit key="circuit" className="text-white" />,
    <Sigma key="sigma" className="text-white" />,
    <Code key="code" className="text-white" />,
    <Cpu key="cpu" className="text-white" />,
    <Database key="database" className="text-white" />,
    <Braces key="braces" className="text-white" />,
  ]

  // Rotate through STEM icons every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % stemIcons.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Size mappings
  const sizeClasses = {
    sm: {
      container: "w-8 h-8",
      icon: "h-4 w-4",
      innerCircle: "w-6 h-6",
      outerRing: "-inset-1",
    },
    md: {
      container: "w-10 h-10",
      icon: "h-5 w-5",
      innerCircle: "w-8 h-8",
      outerRing: "-inset-1.5",
    },
    lg: {
      container: "w-12 h-12",
      icon: "h-6 w-6",
      innerCircle: "w-10 h-10",
      outerRing: "-inset-2",
    },
  }

  return (
    <Link href="/landing" className="cursor-pointer">
      <div className={`relative ${sizeClasses[size].container} flex-shrink-0`}>
        {/* Main avatar background with gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 animate-gradient-slow"></div>

        {/* Inner circle with tech pattern */}
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size].innerCircle} rounded-full bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden`}
        >
          {/* Tech circuit pattern overlay */}
          <div className="absolute inset-0 opacity-30 circuit-pattern"></div>

          {/* Rotating icon */}
          <motion.div
            key={currentIcon}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={sizeClasses[size].icon}
          >
            {stemIcons[currentIcon]}
          </motion.div>
        </div>

        {/* Pulsing effect */}
        {pulseEffect && (
          <motion.div
            className={`absolute ${sizeClasses[size].outerRing} rounded-full bg-cyan-500 opacity-0`}
            animate={{
              opacity: [0, 0.2, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Subtle particle effects */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="particles-container">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="particle bg-blue-300"
                initial={{
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50,
                  opacity: 0,
                }}
                animate={{
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50,
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

