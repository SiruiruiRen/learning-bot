"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, Send, MessageCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ChatMessageParser from "@/components/chat-message-parser"
import { usePathname } from "next/navigation"

interface FloatingChatbotProps {
  currentPhase?: string
}

// Phase-specific suggested questions
const PHASE_QUESTIONS: { [key: string]: string[] } = {
  "phase1": [
    "What is self-regulated learning (SRL)?",
    "Can you explain the 4-stage model?",
    "What does metacognition mean?",
    "How does planning relate to learning?"
  ],
  "phase2": [
    "What is a learning objective?",
    "How do I identify cognitive levels?",
    "What resources should I use?",
    "What is task analysis?"
  ],
  "phase3": [
    "What is self-testing?",
    "How does spacing work?",
    "What is self-explanation?",
    "What is retrieval practice?"
  ],
  "phase4": [
    "What is MCII?",
    "What is mental contrasting?",
    "What are implementation intentions?",
    "How do I create an if-then plan?"
  ],
  "phase5": [
    "What is monitoring?",
    "How do I adapt my strategies?",
    "What is self-assessment?",
    "How do I know if my plan is working?"
  ],
  "default": [
    "Can you explain this concept?",
    "What does this term mean?",
    "Can you give me an example?",
    "How does this relate to learning?"
  ]
}

export default function FloatingChatbot({ currentPhase = "default" }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Detect phase from pathname
  useEffect(() => {
    const phaseMatch = pathname.match(/\/phase(\d+)/)
    if (phaseMatch) {
      const phaseNum = phaseMatch[1]
      // Update currentPhase based on pathname
    }
  }, [pathname])

  useEffect(() => {
    try {
      const storedSessionId = localStorage.getItem("session_id")
      if (storedSessionId) {
        setSessionId(storedSessionId)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return

    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Log user question to analytics
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'floating_chat_question',
          phase: currentPhase,
          component: 'floating_chatbot',
          metadata: {
            question: input,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error("Failed to log question:", error)
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: input,
          phase: currentPhase,
          component: "floating_chatbot",
          is_submission: false,
          attempt_number: 1
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || "Failed to get response from server.")
      }

      const result = await response.json()
      
      // Handle error responses
      if (result.error || !result.data) {
        throw new Error(result.error || result.details || "Invalid response from server")
      }

      const assistantMessage = {
        role: "assistant",
        content: result.data.message || result.data.content || "I received your message but couldn't process it properly.",
      }

      setMessages(prev => [...prev, assistantMessage])

      // Log AI response to analytics
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: 'floating_chat_response',
            phase: currentPhase,
            component: 'floating_chatbot',
            metadata: {
              response: result.data.message,
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (error) {
        console.error("Failed to log response:", error)
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    // Auto-send suggested questions
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  const suggestedQuestions = PHASE_QUESTIONS[currentPhase] || PHASE_QUESTIONS.default

  const accent = "#d8b26f"
  const neutralSurface = "hsl(var(--card))"
  const neutralBorder = "hsl(var(--border))"

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="rounded-full w-14 h-14 shadow-lg"
              style={{
                backgroundColor: accent,
                color: "#1f1408"
              }}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
            style={{
              height: isMinimized ? "60px" : "600px",
              maxHeight: "calc(100vh - 3rem)"
            }}
          >
            <div
              className="flex flex-col h-full rounded-lg shadow-2xl border"
              style={{
                backgroundColor: neutralSurface,
                borderColor: neutralBorder
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 border-b cursor-pointer"
                style={{ borderColor: neutralBorder }}
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accent }}
                  >
                    <Bot className="w-5 h-5" style={{ color: "#1f1408" }} />
                  </div>
                  <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    Ask SoLBot
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMinimized(!isMinimized)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? '' : 'rotate-180'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsOpen(false)
                      setIsMinimized(false)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "400px" }}>
                    {messages.length === 0 && (
                      <div className="space-y-2">
                        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                          Ask me anything about this phase! Here are some suggested questions:
                        </p>
                        <div className="space-y-2">
                          {suggestedQuestions.slice(0, 4).map((question, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full text-left justify-start text-xs h-auto py-2 px-3"
                              style={{
                                borderColor: neutralBorder,
                                color: "hsl(var(--foreground))"
                              }}
                              onClick={() => handleSuggestedQuestion(question)}
                            >
                              {question}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                      >
                        {msg.role === 'assistant' && (
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: accent }}
                          >
                            <Bot className="w-4 h-4" style={{ color: "#1f1408" }} />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-2 rounded-lg text-sm ${
                            msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                          }`}
                          style={{
                            backgroundColor: msg.role === 'user'
                              ? "hsl(var(--primary) / 0.15)"
                              : "hsl(var(--muted))",
                            color: "hsl(var(--foreground))",
                            border: `1px solid ${msg.role === 'user' ? "hsl(var(--primary) / 0.3)" : neutralBorder}`
                          }}
                        >
                          <ChatMessageParser content={msg.content} />
                        </div>
                        {msg.role === 'user' && (
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "hsl(var(--muted))" }}
                          >
                            <MessageCircle className="w-4 h-4" style={{ color: "hsl(var(--foreground))" }} />
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: accent }}
                        >
                          <Bot className="w-4 h-4" style={{ color: "#1f1408" }} />
                        </div>
                        <div className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                          Thinking...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t" style={{ borderColor: neutralBorder }}>
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        placeholder="Ask a question..."
                        className="flex-1 text-sm"
                        style={{
                          backgroundColor: neutralSurface,
                          borderColor: neutralBorder,
                          color: "hsl(var(--foreground))"
                        }}
                        rows={2}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="h-auto"
                        style={{
                          backgroundColor: accent,
                          color: "#1f1408"
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
