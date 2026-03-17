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
        className="rounded-full w-12 h-12 shadow-lg p-0 text-white"
        style={{ background: "linear-gradient(135deg, #d8b26f, #b8892e)", boxShadow: "0 4px 14px rgba(184,137,46,0.3)" }}
        aria-label="Return to home page"
        title="Return to home page"
      >
        <Home className="h-5 w-5" />
      </Button>
    </motion.div>
  )
}

