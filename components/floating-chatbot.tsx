"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, Send, MessageCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ChatMessageParser from "@/components/chat-message-parser"
import { usePathname } from "next/navigation"

// Direct backend URL — bypasses Next.js proxy for faster floating chatbot responses
// Hardcoded fallback ensures direct call even if env var not set during build
const DIRECT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://solbot-backend.onrender.com"

interface FloatingChatbotProps {
  currentPhase?: string
}

// Per-PAGE suggested questions (more specific than per-phase)
const PAGE_QUESTIONS: { [key: string]: { greeting: string; questions: string[] } } = {
  // Intro / Onboarding
  "/intro": {
    greeting: "Welcome! I'm SoL2LBot, your learning assistant. Ask me anything about this training!",
    questions: [
      "What will I learn in this training?",
      "How long does this take?",
      "What is self-regulated learning?",
      "How will the AI coach help me?"
    ]
  },
  // Phase 1 — SRL intro
  "/phase1": {
    greeting: "Hi! I'm here to help you understand Self-Regulated Learning.",
    questions: [
      "What are the 4 stages of self-regulated learning?",
      "Why is metacognition important for learning?",
      "How is SRL different from regular studying?",
      "Can you give me an example of SRL in action?"
    ]
  },
  // Phase 2 — Task analysis (instruction + video)
  "/phase2": {
    greeting: "Need help understanding task analysis and learning objectives?",
    questions: [
      "What is a learning objective and why does it matter?",
      "How do I identify the right cognitive level for my goal?",
      "What makes a resource 'strategic' vs just 'listed'?",
      "Can you explain Bloom's taxonomy simply?"
    ]
  },
  // Phase 2 — Chat (guided learning objective)
  "/phase2/chat": {
    greeting: "Working on your learning objective? I can clarify concepts.",
    questions: [
      "What's the difference between LOW and HIGH task identification?",
      "How specific should my resource list be?",
      "Can you show me an example of a good learning objective?",
      "What does 'strategic resource utilization' mean?"
    ]
  },
  // Phase 3 — Learning strategies
  "/phase3": {
    greeting: "Let me help you understand effective learning strategies!",
    questions: [
      "What is retrieval practice and how do I use it?",
      "How does the spacing effect improve memory?",
      "What is self-explanation and when should I use it?",
      "Which strategy is best for my situation?"
    ]
  },
  // Phase 4 — Strategic planning intro
  "/phase4": {
    greeting: "Ready to create your strategic learning plan? Ask me anything!",
    questions: [
      "What is MCII (Mental Contrasting with Implementation Intentions)?",
      "Why is mental contrasting effective?",
      "What's the difference between a wish and a goal?",
      "How do implementation intentions work?"
    ]
  },
  // Phase 4 — MCII exercise
  "/phase4/mcii": {
    greeting: "Working on your MCII exercise? I can help explain the steps.",
    questions: [
      "How do I visualize my best outcome vividly?",
      "What counts as an internal obstacle?",
      "How specific should my if-then plan be?",
      "Can you give me an example of a complete MCII?"
    ]
  },
  // Phase 4 — Long-term goals
  "/phase4/long_term_goals": {
    greeting: "Setting long-term goals? I can help you think through them.",
    questions: [
      "What makes a goal mastery-oriented vs performance-oriented?",
      "How should I visualize success?",
      "How specific should my long-term goal be?",
      "What's the difference between a goal and a wish?"
    ]
  },
  // Phase 4 — Short-term goals
  "/phase4/short_term_goals": {
    greeting: "Creating SMART objectives? Let me help!",
    questions: [
      "What does SMART stand for?",
      "How do I make my goal measurable?",
      "What's a good timeline for short-term goals?",
      "How do I break a big goal into smaller steps?"
    ]
  },
  // Phase 4 — Contingency / if-then
  "/phase4/contingency_strategies": {
    greeting: "Building your contingency plan? Happy to clarify!",
    questions: [
      "What is an if-then plan?",
      "How specific should my trigger be?",
      "What makes a response 'feasible'?",
      "Can you give me examples of good if-then plans?"
    ]
  },
  // Phase 4 — Tasks hub
  "/phase4/tasks": {
    greeting: "This is your Phase 4 task hub. Need guidance on any task?",
    questions: [
      "Which task should I do first?",
      "What is the MCII exercise about?",
      "How do these tasks connect to each other?",
      "What if I'm stuck on one of the tasks?"
    ]
  },
  // Phase 5 — Monitoring intro
  "/phase5": {
    greeting: "Let me help you understand monitoring and adaptation!",
    questions: [
      "What does 'monitoring your learning' mean?",
      "How often should I check my progress?",
      "What are adaptation triggers?",
      "Why do I need backup strategies?"
    ]
  },
  // Phase 5 — Chat (monitoring system)
  "/phase5/chat": {
    greeting: "Creating your monitoring system? I'm here to help!",
    questions: [
      "What are specific, measurable progress checks?",
      "How do I set a clear adaptation trigger?",
      "What are good alternative strategies?",
      "Can you show me an example monitoring plan?"
    ]
  },
  // Phase 5 — Monitoring adaptation
  "/phase5/monitoring": {
    greeting: "Refining your monitoring plan? Ask me anything!",
    questions: [
      "How detailed should my monitoring schedule be?",
      "What's the difference between a vague and specific trigger?",
      "How many alternative strategies do I need?",
      "What if my first strategy doesn't work?"
    ]
  },
  // Phase 6 — Final assessment
  "/phase6": {
    greeting: "Time for your final assessment! I can explain what's expected.",
    questions: [
      "What should my exam preparation plan include?",
      "How do I combine all the strategies I learned?",
      "What are the key elements of a good study plan?",
      "How should I structure my response?"
    ]
  },
  // Summary page
  "/summary": {
    greeting: "Here's your learning journey summary! Questions?",
    questions: [
      "How can I use these strategies going forward?",
      "What were my strongest areas?",
      "How do I keep improving after this course?",
      "Can you summarize the key takeaways?"
    ]
  }
}

// Fallback for unrecognized pages
const DEFAULT_PAGE = {
  greeting: "Hi! I'm SoL2LBot. Ask me anything about self-regulated learning!",
  questions: [
    "What is self-regulated learning?",
    "How can I improve my study habits?",
    "What strategies work best for exams?",
    "How do I stay motivated?"
  ]
}

export default function FloatingChatbot({ currentPhase = "default" }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const openTimestampRef = useRef<string | null>(null)  // Track when chatbot was opened
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Get page-specific or phase-specific config
  const pageConfig = PAGE_QUESTIONS[pathname] || PAGE_QUESTIONS[`/${currentPhase}`] || DEFAULT_PAGE

  // Parse follow-up questions from AI response (lines starting with ">>>")
  const parseFollowUps = (text: string): { cleanText: string; followUps: string[] } => {
    const lines = text.split('\n')
    const rawFollowUps: string[] = []
    const contentLines: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('>>>')) {
        const q = trimmed.replace(/^>>>+\s*/, '').trim()
        if (q) rawFollowUps.push(q)
      } else {
        contentLines.push(line)
      }
    }
    const cleanText = contentLines.join('\n').trim()

    // Post-process follow-ups so they feel like natural user questions (not the bot interrogating the user)
    const followUps = rawFollowUps
      .map(q => q.replace(/\s+/g, ' ').trim().replace(/\*\*/g, "")) // normalize spaces and strip markdown bold
      .filter(q => {
        if (!q) return false
        if (q.length < 6 || q.length > 160) return false
        // Must look like a question the user would ask
        if (!q.endsWith('?')) return false
        const lower = q.toLowerCase()
        // Filter out meta / bot-centered questions
        if (/(are you |do you feel |are you worried|are you stressed|are you testing me|am i testing you|ready to get started\?)/.test(lower)) {
          return false
        }
        if (/(i don'?t have questions|i am the one asking|i'm the one asking)/.test(lower)) {
          return false
        }
        return true
      })
      .slice(0, 3)

    return { cleanText, followUps }
  }

  // When floating chatbot is open on desktop, reserve a right sidebar so it doesn't cover the main content frame
  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    if (isOpen) {
      root.classList.add("floating-chat-open")
    } else {
      root.classList.remove("floating-chat-open")
    }
    return () => {
      root.classList.remove("floating-chat-open")
    }
  }, [isOpen])

  // Reset chat when navigating to a new page — show fresh suggested questions
  useEffect(() => {
    setMessages([])
    setInput("")
    setFollowUpQuestions([])
  }, [pathname])

  useEffect(() => {
    try {
      const storedSessionId = localStorage.getItem("session_id")
      if (storedSessionId) setSessionId(storedSessionId)
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  // --- Analytics: track open/close with timestamps ---
  const logChatbotEvent = async (eventType: string, extraMetadata: Record<string, any> = {}) => {
    if (!sessionId) return
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          phase: currentPhase,
          component: 'floating_chatbot',
          metadata: {
            page: pathname,
            timestamp: new Date().toISOString(),
            ...extraMetadata
          }
        })
      })
    } catch (err) {
      console.error(`Failed to log ${eventType}:`, err)
    }
  }

  const openChatbot = (trigger: 'hover' | 'click') => {
    const now = new Date().toISOString()
    openTimestampRef.current = now
    setIsOpen(true)
    logChatbotEvent('floating_chatbot_opened', { trigger, message_count: messages.length })
  }

  const closeChatbot = () => {
    const openedAt = openTimestampRef.current
    const closedAt = new Date().toISOString()
    const durationSeconds = openedAt
      ? Math.round((new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 1000)
      : null
    logChatbotEvent('floating_chatbot_closed', {
      opened_at: openedAt,
      closed_at: closedAt,
      duration_seconds: durationSeconds,
      message_count: messages.length
    })
    openTimestampRef.current = null
    setIsOpen(false)
    setIsMinimized(false)
  }

  // Hover to open: when user hovers on button area for 600ms, auto-open
  const handleMouseEnter = () => {
    if (isOpen) return
    setIsHovering(true)
    hoverTimerRef.current = setTimeout(() => {
      openChatbot('hover')
      setIsHovering(false)
    }, 600)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input.trim()
    if (!messageToSend || !sessionId) return

    const userMessage = { role: "user", content: messageToSend }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setFollowUpQuestions([])  // Clear old follow-ups while waiting for new response

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
          metadata: { question: messageToSend, page: pathname, timestamp: new Date().toISOString() }
        })
      })
    } catch (error) {
      console.error("Failed to log question:", error)
    }

    try {
      // Call backend directly (skip Next.js proxy) for faster responses
      // Falls back to proxy if NEXT_PUBLIC_BACKEND_URL not set
      const chatUrl = DIRECT_BACKEND_URL
        ? `${DIRECT_BACKEND_URL}/api/chat`
        : "/api/chat"
      
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: messageToSend,
          phase: currentPhase,
          component: "floating_chatbot",
          is_submission: false,
          attempt_number: 1
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || "Server error")
      }

      const result = await response.json()

      if (result.error || !result.data) {
        throw new Error(result.error || result.details || "Invalid response")
      }

      const rawResponse = result.data.message || result.data.content || "Sorry, I couldn't process that."
      const responseModel = result.data.model || "unknown"
      
      // Parse follow-up questions (>>> lines) from the AI response
      const { cleanText, followUps } = parseFollowUps(rawResponse)
      const responseContent = cleanText
      
      const assistantMessage = {
        role: "assistant",
        content: responseContent,
      }
      setMessages(prev => [...prev, assistantMessage])
      setFollowUpQuestions(followUps)

      // Log AI response to analytics for research tracking
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
              question: messageToSend,
              response: responseContent,
              model: responseModel,
              page: pathname,
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (logError) {
        console.error("Failed to log response:", logError)
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question)
  }

  const accent = "#d8b26f"
  const neutralSurface = "hsl(var(--card))"
  const neutralBorder = "hsl(var(--border))"

  return (
    <>
      {/* Floating Button — hover triggers popup */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative">
              <Button
                onClick={() => openChatbot('click')}
                className="rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-transform"
                style={{ backgroundColor: accent, color: "#1f1408" }}
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
              {/* Hover tooltip */}
              <AnimatePresence>
                {isHovering && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute bottom-2 right-16 whitespace-nowrap bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg"
                  >
                    Quick Help Chatbot
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window — right sidebar, leaving room for top phase title */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed right-4 bottom-4 top-24 z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            <div
              className="flex flex-col h-full rounded-xl shadow-2xl border overflow-hidden"
              style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b cursor-pointer"
                style={{ borderColor: neutralBorder, background: `linear-gradient(135deg, ${accent}22, ${accent}08)` }}
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                    <Bot className="w-5 h-5" style={{ color: "#1f1408" }} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block" style={{ color: "hsl(var(--foreground))" }}>
                      Quick Help Chatbot
                    </span>
                    <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Short questions about this training
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }} className="h-7 w-7 p-0 rounded-full">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? '' : 'rotate-180'}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); closeChatbot() }} className="h-7 w-7 p-0 rounded-full">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="space-y-3">
                        {/* Welcome message */}
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                            <Bot className="w-4 h-4" style={{ color: "#1f1408" }} />
                          </div>
                          <div className="p-2.5 rounded-lg rounded-bl-none text-sm" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: `1px solid ${neutralBorder}` }}>
                            {pageConfig.greeting}
                          </div>
                        </div>
                        {/* Suggested questions */}
                        <div className="space-y-1.5 pl-8">
                          {pageConfig.questions.map((question, index) => (
                            <button
                              key={index}
                              className="w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors hover:border-current"
                              style={{ borderColor: neutralBorder, color: accent, backgroundColor: `${accent}08` }}
                              onClick={() => handleSuggestedQuestion(question)}
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                            <Bot className="w-4 h-4" style={{ color: "#1f1408" }} />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-2.5 rounded-lg text-sm overflow-hidden ${msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'}`}
                          style={{
                            backgroundColor: msg.role === 'user' ? `${accent}20` : "hsl(var(--muted))",
                            color: "hsl(var(--foreground))",
                            border: `1px solid ${msg.role === 'user' ? `${accent}40` : neutralBorder}`
                          }}
                        >
                          <ChatMessageParser content={msg.content} />
                        </div>
                      </div>
                    ))}

                    {/* Follow-up suggested questions after AI response */}
                    {followUpQuestions.length > 0 && !isLoading && messages.length > 0 && (
                      <div className="space-y-1.5 pl-8">
                        <div className="text-[10px] font-medium mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                          You might also want to ask:
                        </div>
                        {followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors hover:border-current"
                            style={{ borderColor: neutralBorder, color: accent, backgroundColor: `${accent}08` }}
                            onClick={() => handleSuggestedQuestion(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    {isLoading && (
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                          <Bot className="w-4 h-4" style={{ color: "#1f1408" }} />
                        </div>
                        <div className="flex gap-1 p-2">
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accent, animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t" style={{ borderColor: neutralBorder }}>
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        placeholder="Type your question..."
                        className="flex-1 text-sm resize-none"
                        style={{ backgroundColor: neutralSurface, borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                        rows={1}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="h-auto px-3"
                        style={{ backgroundColor: accent, color: "#1f1408" }}
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
