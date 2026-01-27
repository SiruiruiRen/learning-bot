"use client"

import { useState, useEffect, useRef, ReactNode, useCallback } from "react"
import { motion } from "framer-motion"
import { Bot, User, CornerDownLeft, BrainCircuit, Mic, PlusCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import ChatMessageParser from "@/components/chat-message-parser"

const phasePrompts: { [key: string]: string[] } = {
  "phase1": [
    "Understanding self-regulation means knowing when and how to adjust your learning approach...",
    "Good self-regulated learners regularly ask themselves: 'Is this strategy working for me?'",
    "Analyzing your understanding of the SRL framework...",
  ],
  "phase2": [
    "Analyzing the task: A good learning objective is specific, measurable, and focuses on what you'll be able to DO.",
    "Breaking it down: Is your goal to remember, understand, or create? This will determine your study strategy.",
    "Resource planning: What materials do you need? How much time will you allocate?",
  ],
  "phase4": [
    "Setting SMART goals: Is your goal Specific, Measurable, Achievable, Relevant, and Time-bound?",
    "Mental Contrasting: Visualize success, but also anticipate the obstacles you might face.",
    "Implementation Intentions: Create 'if-then' plans to overcome the obstacles you identified.",
  ],
  "phase5": [
    "Effective monitoring: Don't just ask 'Do I understand this?' Ask 'How can I prove I understand this?'",
    "Self-assessment: Use practice tests or explain concepts to others to accurately gauge your knowledge.",
    "Adaptation is key: If a strategy isn't working, be ready to switch to a different, more effective one.",
  ],
  "default": [
    "Analyzing your response based on learning principles...",
    "Connecting your ideas to the optimal learning strategy...",
    "Formulating targeted feedback...",
  ],
  "task-analysis": [
    "How does this objective connect to what you already know?",
    "Is the cognitive level (knowledge, comprehension, analysis) clear?",
    "What specific action does the verb in your objective suggest?",
  ],
  "goal-setting": [
    "Is your goal specific and measurable?",
    "What potential obstacles might you face?",
    "How will you track your progress toward this goal?",
  ],
  "monitoring": [
    "How will you know if your strategy is working?",
    "What's your backup plan if you get stuck?",
    "What does success look like for this task?",
  ],
}

interface SolBotChatProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
  attemptNumber?: number;
  onNewMessage?: (message: any) => void;
  initialMessages?: any[];
  isLoading: boolean;
  isError: boolean;
  taskContext?: string;
}

export default function SolBotChat({
  userId,
  phase,
  component = "chatbot",
  onComplete,
  height,
  attemptNumber = 1,
  onNewMessage,
  initialMessages = [],
  isLoading: isLoadingProp,
  isError,
  taskContext,
}: SolBotChatProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const storedSessionId = localStorage.getItem("session_id")
      if (storedSessionId) {
        setSessionId(storedSessionId)
      } else {
        console.warn("No session_id found, redirecting to intro.")
        router.push("/intro")
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      router.push("/intro")
    }
  }, [router])

  const getLoadingMessage = useCallback(() => {
    const prompts = phasePrompts[taskContext || phase] || phasePrompts.default
    return prompts[Math.floor(Math.random() * prompts.length)]
  }, [phase, taskContext])

  useEffect(() => {
    // Set initial loading message
    setLoadingMessage(getLoadingMessage())

    // Set interval to cycle through loading messages
    const intervalId = setInterval(() => {
      setLoadingMessage(getLoadingMessage())
    }, 3000) // Change message every 3 seconds

    return () => clearInterval(intervalId)
  }, [getLoadingMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return

    console.log('💬 User message sent:', input.slice(0, 50) + (input.length > 50 ? '...' : ''))

    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Log user message to analytics
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'chat_message',
          phase: phase,
          component: component,
          metadata: {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error("Failed to log user message:", error)
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
          session_id: sessionId,
          message: input,
                      phase: phase,
                      component: component,
          is_submission: false,
          attempt_number: attemptNumber
        }),
      })
          
          if (!response.ok) {
        throw new Error("Failed to get response from server.")
      }

      const result = await response.json()
      
      // Handle error responses
      if (result.error || !result.data) {
        throw new Error(result.error || result.details || "Invalid response from server")
      }

      const assistantMessage = {
        role: "assistant",
        content: result.data.message || result.data.content || "I received your message but couldn't process it properly.",
        evaluation: result.data.evaluation,
      }
      
      setMessages(prev => [...prev, assistantMessage])
      if (onNewMessage) {
        onNewMessage(assistantMessage)
      }

      console.log('🤖 AI response received:', {
        contentLength: assistantMessage.content.length,
        hasEvaluation: !!assistantMessage.evaluation
      })

      // Log chat message to analytics
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: 'chat_message',
            phase: phase,
            component: component,
            metadata: {
              role: 'assistant',
              content: assistantMessage.content,
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (error) {
        console.error("Failed to log chat message:", error)
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-lg" style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
            <motion.div
            key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary))" }}>
                <Bot className="w-5 h-5" style={{ color: "hsl(var(--primary-foreground))" }} />
                </div>
              )}
            <div
              className={`max-w-md p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'rounded-br-none'
                  : 'rounded-bl-none'
              }`}
              style={{
                backgroundColor: msg.role === 'user' 
                  ? "hsl(var(--primary) / 0.15)" 
                  : "hsl(var(--muted))",
                color: "hsl(var(--foreground))",
                border: `1px solid ${msg.role === 'user' ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`
              }}
            >
              <ChatMessageParser content={msg.content} />
                                  </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
                <User className="w-5 h-5" style={{ color: "hsl(var(--foreground))" }} />
                </div>
              )}
            </motion.div>
        ))}
        {(isLoading || isLoadingProp) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary))" }}>
              <Bot className="w-5 h-5" style={{ color: "hsl(var(--primary-foreground))" }} />
            </div>
            <div className="max-w-md p-3 rounded-lg rounded-bl-none" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "hsl(var(--primary))" }}></div>
                <motion.div
                  key={loadingMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {loadingMessage}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-4" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}>
        <div className="relative">
              <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
                placeholder="Type your message..."
            className="rounded-lg pr-20"
            style={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))"
            }}
                rows={2}
            disabled={isLoading || isLoadingProp}
          />
          <Button
            onClick={handleSend}
            disabled={(isLoading || isLoadingProp) || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1.5 disabled:opacity-50"
            style={{ 
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))"
            }}
          >
            {(isLoading || isLoadingProp) ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary-foreground))", borderTopColor: "transparent" }}></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 