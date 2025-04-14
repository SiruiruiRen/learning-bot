"use client"

import { useRouter } from "next/navigation"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function HomeButton() {
  const router = useRouter()

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Button
        onClick={() => router.push("/landing")}
        className="rounded-full w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-500/30 p-0"
        aria-label="Return to home page"
      >
        <Home className="h-5 w-5 text-white" />
      </Button>
    </motion.div>
  )
}

