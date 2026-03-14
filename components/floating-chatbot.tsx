"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, Send, MessageCircle, ChevronsLeft } from "lucide-react"
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
    greeting:
      "Before you start, try this Quick Help chatbot once: click one of the questions below so you can see how it works. Later, any time a video or instruction on this page is confusing, you can reopen the Quick Help tab on the right edge and ask a short question about this page.",
    questions: [
      "What will I learn in this training?",
      "How long does this take?",
      "What is self-regulated learning?",
      "How will the AI coach help me?"
    ]
  },
  // Phase 1 — SRL intro
  "/phase1": {
    greeting: "",
    questions: [
      "What are the 4 stages of self-regulated learning?",
      "Why is metacognition important for learning?",
      "How is SRL different from regular studying?",
      "Can you give me an example of SRL in action?"
    ]
  },
  // Phase 2 — Task analysis (instruction + video)
  "/phase2": {
    greeting: "",
    questions: [
      "What is a learning objective and why does it matter?",
      "How do I identify the right cognitive level for my goal?",
      "What makes a resource 'strategic' vs just 'listed'?",
      "Can you explain Bloom's taxonomy simply?"
    ]
  },
  // Phase 2 — Chat (guided learning objective)
  "/phase2/chat": {
    greeting: "",
    questions: [
      "What's the difference between LOW and HIGH task identification?",
      "How specific should my resource list be?",
      "Can you show me an example of a good learning objective?",
      "What does 'strategic resource utilization' mean?"
    ]
  },
  // Phase 3 — Learning strategies
  "/phase3": {
    greeting: "",
    questions: [
      "What is retrieval practice and how do I use it?",
      "How does the spacing effect improve memory?",
      "What is self-explanation and when should I use it?",
      "Which strategy is best for my situation?"
    ]
  },
  // Phase 4 — Strategic planning intro
  "/phase4": {
    greeting: "",
    questions: [
      "What is MCII (Mental Contrasting with Implementation Intentions)?",
      "Why is mental contrasting effective?",
      "What's the difference between a wish and a goal?",
      "How do implementation intentions work?"
    ]
  },
  // Phase 4 — MCII exercise
  "/phase4/mcii": {
    greeting: "",
    questions: [
      "How do I visualize my best outcome vividly?",
      "What counts as an internal obstacle?",
      "How specific should my if-then plan be?",
      "Can you give me an example of a complete MCII?"
    ]
  },
  // Phase 4 — Long-term goals
  "/phase4/long_term_goals": {
    greeting: "",
    questions: [
      "What makes a goal mastery-oriented vs performance-oriented?",
      "How should I visualize success?",
      "How specific should my long-term goal be?",
      "What's the difference between a goal and a wish?"
    ]
  },
  // Phase 4 — Short-term goals
  "/phase4/short_term_goals": {
    greeting: "",
    questions: [
      "What does SMART stand for?",
      "How do I make my goal measurable?",
      "What's a good timeline for short-term goals?",
      "How do I break a big goal into smaller steps?"
    ]
  },
  // Phase 4 — Contingency / if-then
  "/phase4/contingency_strategies": {
    greeting: "",
    questions: [
      "What is an if-then plan?",
      "How specific should my trigger be?",
      "What makes a response 'feasible'?",
      "Can you give me examples of good if-then plans?"
    ]
  },
  // Phase 4 — Tasks hub
  "/phase4/tasks": {
    greeting: "",
    questions: [
      "Which task should I do first?",
      "What is the MCII exercise about?",
      "How do these tasks connect to each other?",
      "What if I'm stuck on one of the tasks?"
    ]
  },
  // Phase 5 — Monitoring intro
  "/phase5": {
    greeting: "",
    questions: [
      "What does 'monitoring your learning' mean?",
      "How often should I check my progress?",
      "What are adaptation triggers?",
      "Why do I need backup strategies?"
    ]
  },
  // Phase 5 — Chat (monitoring system)
  "/phase5/chat": {
    greeting: "",
    questions: [
      "What are specific, measurable progress checks?",
      "How do I set a clear adaptation trigger?",
      "What are good alternative strategies?",
      "Can you show me an example monitoring plan?"
    ]
  },
  // Phase 5 — Monitoring adaptation
  "/phase5/monitoring": {
    greeting: "",
    questions: [
      "How detailed should my monitoring schedule be?",
      "What's the difference between a vague and specific trigger?",
      "How many alternative strategies do I need?",
      "What if my first strategy doesn't work?"
    ]
  },
  // Phase 6 — Final assessment
  "/phase6": {
    greeting: "",
    questions: [
      "What should my exam preparation plan include?",
      "How do I combine all the strategies I learned?",
      "What are the key elements of a good study plan?",
      "How should I structure my response?"
    ]
  },
  // Summary page
  "/summary": {
    greeting: "",
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
  greeting: "", // use HELP_SEEKING_INTRO
  questions: [
    "What is self-regulated learning?",
    "How can I improve my study habits?",
    "What strategies work best for exams?",
    "How do I stay motivated?"
  ]
}

  // Unified intro: help-seeking role; guide users to video/instructions first (used in UI + prompt)
  const HELP_SEEKING_INTRO =
  "I'm here for help-seeking: after you watch the video or read the instructions on this page, you can ask me clarifying questions. I recommend watching or reading first—then coming back here when something is unclear."

export default function FloatingChatbot({ currentPhase = "default" }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [userName, setUserName] = useState<string>("")
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)  // Close panel when mouse leaves
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
      const storedName = localStorage.getItem("solbot_user_name")
      if (storedName) setUserName(storedName)
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
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
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
  }

  // Allow guided tour to programmatically open/close Quick Help
  useEffect(() => {
    const handleOpenFromTour = () => {
      if (isOpen) return
      const now = new Date().toISOString()
      openTimestampRef.current = now
      setIsOpen(true)
      logChatbotEvent('floating_chatbot_opened', { trigger: 'tour', message_count: messages.length })
    }
    const handleCloseFromTour = () => {
      if (isOpen) closeChatbot()
    }
    window.addEventListener('solbot-open-quick-help', handleOpenFromTour)
    window.addEventListener('solbot-close-quick-help', handleCloseFromTour)
    return () => {
      window.removeEventListener('solbot-open-quick-help', handleOpenFromTour)
      window.removeEventListener('solbot-close-quick-help', handleCloseFromTour)
    }
  }, [isOpen, messages.length])

  // Collapse panel when mouse leaves the chatbot area (on-demand: open by hover/click, close on leave)
  const PANEL_LEAVE_DELAY_MS = 800
  const handlePanelMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }
  const handlePanelMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      closeChatbot()
    }, PANEL_LEAVE_DELAY_MS)
  }

  // Hover to open: when user hovers on tab/panel for 300ms, auto-open (no click needed)
  const HOVER_OPEN_DELAY_MS = 300
  const handleMouseEnter = () => {
    if (isOpen) return
    setIsHovering(true)
    hoverTimerRef.current = setTimeout(() => {
      openChatbot('hover')
      setIsHovering(false)
    }, HOVER_OPEN_DELAY_MS)
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

  // Right-edge sidebar: panel expands from the right; collapsed tab hides when open so it doesn't block panel text
  const PANEL_WIDTH = 360

  return (
    <div
      data-tour="quick-help"
      className="fixed top-16 bottom-4 z-50 flex flex-row"
      style={{ left: "auto", right: 0 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Collapsed tab — hides when open so left side never blocks bot text */}
      <motion.div
        animate={{ width: isOpen ? 0 : 72 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0 h-full overflow-hidden cursor-pointer flex items-center"
        style={{ minWidth: isOpen ? 0 : 72, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }}
        onClick={() => !isOpen && openChatbot('click')}
      >
        <motion.div
          className="h-full w-[72px] flex flex-col items-center justify-center gap-3 py-4 flex-shrink-0"
          initial={{ x: 20 }}
          animate={{ x: [20, 0, 4, 0] }}
          transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
          style={{
            backgroundImage: "linear-gradient(180deg, #d8b26f, #b8892e)",
            borderLeft: "3px solid #b8892e",
            borderTopLeftRadius: 14,
            borderBottomLeftRadius: 14,
            boxShadow: "-6px 0 24px rgba(216,178,111,0.4), -2px 0 8px rgba(216,178,111,0.2)"
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.95)", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          >
            <Bot className="h-5 w-5" style={{ color: "#3b2a1c" }} />
          </div>
          <span
            className="text-[13px] font-extrabold tracking-widest"
            style={{ color: "#fff", writingMode: "vertical-rl", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
          >
            Quick Help
          </span>
          <motion.div
            className="flex items-center justify-center"
            animate={{ x: [0, -4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronsLeft className="h-5 w-5 text-white/80" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Chat panel — right-edge sidebar, full opacity so bot text is never obscured */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: PANEL_WIDTH }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 h-full overflow-hidden flex flex-col"
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
          >
            <div
              className="h-full flex flex-col overflow-hidden"
              style={{
                backgroundColor: "hsl(var(--card) / 0.6)",
                backdropFilter: "blur(24px) saturate(1.4)",
                WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                borderLeft: `1px solid hsl(var(--border) / 0.35)`,
                borderTop: `1px solid hsl(var(--border) / 0.35)`,
                borderBottom: `1px solid hsl(var(--border) / 0.35)`,
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
                boxShadow: "-8px 0 32px rgba(0,0,0,0.1), inset 0 1px 0 hsl(var(--card) / 0.3)"
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
                style={{ borderColor: neutralBorder }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}30` }}>
                    <Bot className="w-4 h-4" style={{ color: accent }} />
                  </div>
                  <span className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>
                    Quick Help
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); closeChatbot() }} className="h-6 w-6 p-0 rounded">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <>
                  {/* Messages — padding so left never clips bot text */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3 min-w-0">
                    {messages.length === 0 && (
                      <div className="space-y-4 min-w-0">
                        {/* Gemini-style greeting */}
                        <div className="min-w-0 break-words">
                          <p className="text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>
                            Hello{userName ? `, ${userName}` : ""} — I'm your Quick Help chatbot.
                          </p>
                          <p className="text-sm mt-1 break-words" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {pageConfig.greeting || HELP_SEEKING_INTRO}
                          </p>
                        </div>
                        {/* Suggested actions — Gemini-style buttons */}
                        <div className="space-y-1.5">
                          {pageConfig.questions.map((question, index) => (
                            <button
                              key={index}
                              className="w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-colors hover:bg-opacity-100 break-words min-w-0"
                              style={{ borderColor: neutralBorder, color: accent, backgroundColor: `${accent}0a` }}
                              onClick={(e) => { e.stopPropagation(); handleSuggestedQuestion(question) }}
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
                        <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                          You might also want to ask:
                        </div>
                        {followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors hover:border-current"
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
                  <div className="p-3 border-t flex-shrink-0" style={{ borderColor: neutralBorder }}>
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
                        style={{ backgroundColor: "#b8892e", color: "#fff" }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
              </>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
