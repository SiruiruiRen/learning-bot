"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, ArrowRight, Send, User, Bot } from "lucide-react"
import { motion } from "framer-motion"
import MarkdownRenderer from "@/components/markdown-renderer"
import FeedbackDisplay from "@/components/feedback-display"
import { v4 as uuidv4 } from 'uuid'

const DIRECT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://solbot-backend.onrender.com"

interface GuidedMonitoringProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const MONITORING_QUESTIONS = [
  {
    id: "progress_checks",
    question: "How will you check your progress to know if you're on track?",
    hint: "How will you know if your studying is actually working?"
  },
  {
    id: "adaptation_triggers",
    question: "What specific signals will tell you that you need to change your learning strategy?",
    hint: "What would tell you it's time to try something different?"
  },
  {
    id: "strategy_alternatives",
    question: "What alternative learning strategies will you use if your first approach isn't effective? Give specific examples.",
    hint: "What would you switch to if your current approach isn't working?"
  }
]

const CHARACTER_LIMIT = 5000;
const loadingMessages = [
  "Good monitoring means checking progress regularly with objective measures, not just feelings...",
  "Effective learners have backup strategies ready when their first approach isn't working...",
  "Self-assessment works best when you use concrete evidence rather than gut feelings..."
];

type MessageContent = string | { progress_checks: string; adaptation_triggers: string; strategy_alternatives: string; };
type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
}

export default function GuidedMonitoring({
  userId,
  phase,
  component = "progress_monitoring",
  onComplete,
  height = "600px"
}: GuidedMonitoringProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [interactionState, setInteractionState] = useState<"guiding" | "confirming" | "chatting">("guiding");
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const [editingSingleQuestion, setEditingSingleQuestion] = useState<number | null>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id");
    if (storedSessionId) { setSessionId(storedSessionId); }
    setMessages([
      { id: uuidv4(), sender: "bot", content: "Let's develop your monitoring and adaptation system. I'll guide you through creating a comprehensive approach to track and improve your learning.", type: "question" },
      { id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[0].question, type: "question" }
    ]);
  }, []);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase5");
    if (chatContainer) { chatContainer.scrollTop = chatContainer.scrollHeight; }
  }, [messages, isLoading]);

  // Don't auto-complete when entering chatting state - let user continue interacting
  // onComplete should be called explicitly by user action (e.g., a "Complete" button)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessage(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLoading]);

  const handleSendResponse = () => {
    if (!userInput.trim() || userInput.length > CHARACTER_LIMIT) return;

    const questionId = MONITORING_QUESTIONS[currentQuestionIndex].id;
    const newResponses = { ...responses, [questionId]: userInput };
    setResponses(newResponses);

    const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
    let botMessages: Message[] = [];

    const confirmationContent = {
      progress_checks: newResponses["progress_checks"],
      adaptation_triggers: newResponses["adaptation_triggers"],
      strategy_alternatives: newResponses["strategy_alternatives"]
    };

    if (editingSingleQuestion !== null) {
      setEditingSingleQuestion(null);
      setInteractionState("confirming");
      botMessages.push({ id: uuidv4(), sender: "bot", content: confirmationContent, type: "confirmation" });
    } else if (currentQuestionIndex < MONITORING_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[nextQuestionIndex].question, type: "question" });
    } else {
      setInteractionState("confirming");
      botMessages.push({ id: uuidv4(), sender: "bot", content: confirmationContent, type: "confirmation" });
    }
    setMessages(prev => [...prev, userMessage, ...botMessages]);
    setUserInput("");
  };

  const submitToApi = async (message: string) => {
    if (!sessionId) return;
    setIsLoading(true);

    // Log user message
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
            content: message,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error("Failed to log user message:", error)
    }

    try {
      const response = await fetch(`${DIRECT_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId, message, phase,
          component, is_submission: true, attempt_number: 1
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || "Server error")
      }
      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error("Invalid response format from server")
      }

      const botFeedback: Message = { id: uuidv4(), sender: "bot", content: data.data.message || data.data.content || "Received feedback", type: "evaluation" };
      setMessages(prev => [...prev, botFeedback]);

      // Enable continue button
      if (onComplete) {
        onComplete();
      }
      
      // Set interaction state to chatting after feedback is received
      setInteractionState("chatting");

      // Log AI response
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
              content: botFeedback.content,
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (error) {
        console.error("Failed to log AI response:", error)
      }
    } catch (error) {
      const errorMessage: Message = { id: uuidv4(), sender: "bot", content: "Sorry, an error occurred while getting feedback.", type: "evaluation" };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInteractionState("chatting");
    }
  };

  const handleSubmitForFeedback = () => {
    const fullMonitoringPlan = `Progress Checks: ${responses["progress_checks"] || ""}\n\nAdaptation Triggers: ${responses["adaptation_triggers"] || ""}\n\nStrategy Alternatives: ${responses["strategy_alternatives"] || ""}`;
    submitToApi(fullMonitoringPlan);
  };
  
  const handleSendChatMessage = () => {
      if (!userInput.trim()) return;
      const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
      setMessages(prev => [...prev, userMessage]);
      const messageToSend = userInput;
      setUserInput("");
      submitToApi(messageToSend);
  }

  const handleEditSingleQuestion = (questionIndex: number) => {
    setEditingSingleQuestion(questionIndex);
    setInteractionState("guiding");
    setCurrentQuestionIndex(questionIndex);
    const questionId = MONITORING_QUESTIONS[questionIndex].id;
    setMessages(prev => [
      ...prev,
      { id: uuidv4(), sender: "bot", content: `Editing your response for: **${["Progress Checks", "Adaptation Triggers", "Strategy Alternatives"][questionIndex]}**`, type: "question" },
      { id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[questionIndex].question, type: "question" }
    ]);
    setUserInput(responses[questionId] || "");
  };

  const handleEditResponses = () => {
    setInteractionState("guiding");
    setCurrentQuestionIndex(0);
    setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's revise your monitoring system. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[MONITORING_QUESTIONS[0].id] || "");
  };
  
  const accent = "var(--accent-text)"
  const neutralSurface = "hsl(var(--card))"
  const neutralBorder = "hsl(var(--border))"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  }

   const renderInputArea = () => {
    if (interactionState === 'guiding') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs" style={{ color: mutedText }}>
            <div className="flex-1">Question {currentQuestionIndex + 1} of {MONITORING_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={MONITORING_QUESTIONS[currentQuestionIndex].hint}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 min-h-[80px]"
              style={{
                backgroundColor: neutralSurface,
                borderColor: neutralBorder,
                color: "hsl(var(--foreground))"
              }}
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendResponse(); }}}
            />
            <Button onClick={handleSendResponse} className="h-auto py-3" style={primaryButtonStyle} disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      );
    } else if (interactionState === 'confirming') {
      return (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleEditResponses} disabled={isLoading} style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}>Edit</Button>
          <Button onClick={handleSubmitForFeedback} disabled={isLoading} style={primaryButtonStyle}>
            <Check size={16} className="mr-2"/>Confirm & Submit
          </Button>
        </div>
      );
    } else { // 'chatting'
      return (
         <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Refine your monitoring system based on the feedback..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 min-h-[80px]"
              style={{
                backgroundColor: neutralSurface,
                borderColor: neutralBorder,
                color: "hsl(var(--foreground))"
              }}
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); }}}
            />
            <Button onClick={handleSendChatMessage} className="h-auto py-3" style={primaryButtonStyle} disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT}>
              <Send size={18} />
            </Button>
          </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        id="guided-chat-container-phase5"
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 p-4"
        style={{ height }}
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 w-full ${message.sender === "bot" ? "justify-start" : "justify-end"}`}
          >
            {message.sender === "bot" && (
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center" style={{ backgroundColor: accent }}>
                <Bot size={16} style={{ color: "#ffffff" }} />
              </div>
            )}
            <Card 
              className={`${message.type === 'evaluation' ? 'w-full' : 'max-w-[85%]'}`}
              style={{
                backgroundColor: message.sender === "bot" ? neutralSurface : "hsl(var(--primary) / 0.1)",
                borderColor: neutralBorder,
                color: "hsl(var(--foreground))"
              }}
            >
              <CardContent className="p-3 text-sm overflow-hidden max-w-full">
                 {message.type === 'confirmation' && typeof message.content === 'object' ? (
                    <div className="space-y-3">
                      <p>Excellent! Here is your complete monitoring and adaptation system. Please review it. <span style={{ color: mutedText, fontSize: "0.85em" }}>Click any section to edit it.</span></p>
                      {[
                        { key: "progress_checks" as const, label: "Progress Checks:", index: 0 },
                        { key: "adaptation_triggers" as const, label: "Adaptation Triggers:", index: 1 },
                        { key: "strategy_alternatives" as const, label: "Strategy Alternatives:", index: 2 },
                      ].map(({ key, label, index }) => (
                        <div
                          key={key}
                          className="p-3 rounded-md border transition-colors"
                          style={{ backgroundColor: "hsl(var(--muted) / 0.5)", borderColor: neutralBorder, cursor: interactionState === "confirming" ? "pointer" : "default" }}
                          onClick={() => { if (interactionState === "confirming") handleEditSingleQuestion(index); }}
                          onMouseEnter={(e) => { if (interactionState === "confirming") { e.currentTarget.style.borderColor = accent; e.currentTarget.style.backgroundColor = "hsl(var(--muted) / 0.7)"; }}}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = neutralBorder; e.currentTarget.style.backgroundColor = "hsl(var(--muted) / 0.5)"; }}
                        >
                          <h4 className="font-semibold mb-1" style={{ color: accent }}>{label}</h4>
                          <p className="whitespace-pre-wrap">{(message.content as Record<string, string>)[key]}</p>
                        </div>
                      ))}
                    </div>
                  ) : message.type === 'evaluation' ? (
                  <FeedbackDisplay content={message.content as string} />
                ) : (
                  <MarkdownRenderer content={message.content as string} />
                )}
              </CardContent>
            </Card>
            {message.sender === "user" && (
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted))" }}>
                <User size={16} style={{ color: "hsl(var(--foreground))" }} />
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center" style={{ backgroundColor: accent }}>
                <Bot size={16} style={{ color: "#ffffff" }} />
            </div>
            <div className="typing-indicator">
              <div className="typing-indicator-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="typing-indicator-message">{loadingMessages[currentLoadingMessage]}</span>
            </div>
          </motion.div>
        )}
      </div>
      <div className="border-t p-4" style={{ borderColor: neutralBorder }}>
        {renderInputArea()}
      </div>
      
      {/* Continue button moved to page level for better UX */}
    </div>
  )
} 