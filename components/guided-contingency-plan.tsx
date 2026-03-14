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

interface GuidedContingencyPlanProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const CONTINGENCY_QUESTIONS = [
  {
    id: "obstacle_identification",
    question: "What's a potential obstacle that could get in the way of your learning plan?",
    hint: "Hint: Think about distractions, bad habits, or situations that derail your study time."
  },
  {
    id: "if_then_plan",
    question: "Now, create an 'if-then' plan to overcome that obstacle.",
    hint: "Hint: Use the format 'IF [obstacle happens], THEN I will [specific action].'"
  },
  {
    id: "proactive_strategy",
    question: "What's one proactive step you can take to make this obstacle less likely to happen in the first place?",
    hint: "Hint: What can you set up before studying to prevent the obstacle?"
  }
]

const CHARACTER_LIMIT = 5000;
const loadingMessages = [ "Analyzing your plan...", "Identifying potential roadblocks...", "Crafting targeted feedback..."];

type MessageContent = string | { obstacle_identification: string; if_then_plan: string; proactive_strategy: string; };
type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
}

export default function GuidedContingencyPlan({
  userId,
  phase,
  component = "contingency_strategies",
  onComplete,
  height = "600px"
}: GuidedContingencyPlanProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [interactionState, setInteractionState] = useState<"guiding" | "confirming" | "chatting">("guiding");
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const [feedbackReceived, setFeedbackReceived] = useState(false);

  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id");
    if (storedSessionId) { setSessionId(storedSessionId); }
    setMessages([
      { id: uuidv4(), sender: "bot", content: "Let's create an IF-THEN plan to overcome obstacles.", type: "question" },
      { id: uuidv4(), sender: "bot", content: CONTINGENCY_QUESTIONS[0].question, type: "question" }
    ]);
  }, []);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase4-contingency");
    if (chatContainer) { chatContainer.scrollTop = chatContainer.scrollHeight; }
  }, [messages, isLoading]);

  // Automatically call onComplete when feedback is received (task is complete)
  useEffect(() => {
    if (feedbackReceived && onComplete) {
      onComplete();
    }
  }, [feedbackReceived, onComplete]);

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

    const questionId = CONTINGENCY_QUESTIONS[currentQuestionIndex].id;
    const newResponses = { ...responses, [questionId]: userInput };
    setResponses(newResponses);

    // Log individual question response for research analytics
    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'text_input',
          phase: phase,
          component: component,
          metadata: {
            field_name: questionId,
            input_value: userInput,
            question_index: currentQuestionIndex,
            question_text: CONTINGENCY_QUESTIONS[currentQuestionIndex].question,
            is_submission: false,
            attempt_number: 1,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error("Failed to log question response:", error)
    }

    const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
    let botMessages: Message[] = [];

    if (currentQuestionIndex < CONTINGENCY_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: CONTINGENCY_QUESTIONS[nextQuestionIndex].question, type: "question" });
    } else {
      setInteractionState("confirming");
      const confirmationContent = {
        obstacle_identification: newResponses["obstacle_identification"],
        if_then_plan: newResponses["if_then_plan"],
        proactive_strategy: newResponses["proactive_strategy"]
      };
      botMessages.push({ id: uuidv4(), sender: "bot", content: confirmationContent, type: "confirmation" });
    }
    setMessages(prev => [...prev, userMessage, ...botMessages]);
    setUserInput("");
  };
  
  const submitToApi = async (message: string) => {
    if (!sessionId) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${DIRECT_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId, message, phase,
          component, is_submission: true, attempt_number: 1
        })
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      const botFeedback: Message = { id: uuidv4(), sender: "bot", content: data.data.message, type: "evaluation" };
      setMessages(prev => [...prev, botFeedback]);
      setFeedbackReceived(true);
    } catch (error) {
      const errorMessage: Message = { id: uuidv4(), sender: "bot", content: "Sorry, an error occurred while getting feedback.", type: "evaluation" };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInteractionState("chatting");
    }
  };

  const handleSubmitForFeedback = () => {
    const fullContingencyPlan = `IF Trigger (Obstacle): ${responses["obstacle_identification"] || ""}\n\nTHEN Response (Action): ${responses["if_then_plan"] || ""}\n\nProactive Strategy: ${responses["proactive_strategy"] || ""}`;
    submitToApi(fullContingencyPlan);
  };

  const handleSendChatMessage = () => {
      if (!userInput.trim()) return;
      const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
      setMessages(prev => [...prev, userMessage]);
      const messageToSend = userInput;
      setUserInput("");
      submitToApi(messageToSend);
  }

  const handleEditResponses = () => {
    setInteractionState("guiding");
    setCurrentQuestionIndex(0);
    setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's revise your contingency plan. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: CONTINGENCY_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[CONTINGENCY_QUESTIONS[0].id] || "");
  };
  
  const renderInputArea = () => {
    if (interactionState === 'guiding') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="flex-1">Question {currentQuestionIndex + 1} of {CONTINGENCY_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={CONTINGENCY_QUESTIONS[currentQuestionIndex].hint}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 bg-[hsl(var(--card))] border-[hsl(var(--border))] focus:border-[#b8892e] min-h-[80px]"
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendResponse(); }}}
            />
            <Button onClick={handleSendResponse} className="h-auto bg-[#b8892e] hover:bg-[#96722d] py-3" disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      );
    } else if (interactionState === 'confirming') {
      return (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleEditResponses} disabled={isLoading}>Edit</Button>
          <Button onClick={handleSubmitForFeedback} disabled={isLoading} className="bg-[#b8892e] hover:bg-[#96722d]">
            <Check size={16} className="mr-2"/>Confirm & Submit
          </Button>
        </div>
      );
    } else { // 'chatting'
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Refine your plan based on the feedback..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 bg-[hsl(var(--card))] border-[hsl(var(--border))] focus:border-[#b8892e] min-h-[80px]"
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); }}}
            />
            <Button onClick={handleSendChatMessage} className="h-auto bg-[#b8892e] hover:bg-[#96722d] py-3" disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT}>
              <Send size={18} />
            </Button>
          </div>

        </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div
        id="guided-chat-container-phase4-contingency"
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
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-[#b8892e]">
                <Bot size={16} style={{ color: "#ffffff" }} />
              </div>
            )}
            <Card className={`${message.type === 'evaluation' ? 'w-full' : 'max-w-[85%]'} ${message.sender === "bot" ? "bg-[hsl(var(--card)_/_0.7)]" : "bg-[hsl(var(--primary)_/_0.15)]"} border-[hsl(var(--border))]`}>
              <CardContent className="p-3 text-sm overflow-hidden max-w-full">
                {message.type === 'confirmation' && typeof message.content === 'object' ? (
                  <div className="space-y-3">
                    <p>Thank you! Here is your complete contingency plan. Please review it.</p>
                    <div className="p-3 bg-[hsl(var(--muted)_/_0.4)] rounded-md border border-[hsl(var(--border))]">
                      <h4 className="font-semibold text-[var(--accent-text)] mb-1">IF Trigger (Obstacle):</h4>
                      <p className="whitespace-pre-wrap">{message.content.obstacle_identification}</p>
                    </div>
                    <div className="p-3 bg-[hsl(var(--muted)_/_0.4)] rounded-md border border-[hsl(var(--border))]">
                      <h4 className="font-semibold text-[var(--accent-text)] mb-1">THEN Response (Action):</h4>
                      <p className="whitespace-pre-wrap">{message.content.if_then_plan}</p>
                    </div>
                    <div className="p-3 bg-[hsl(var(--muted)_/_0.4)] rounded-md border border-[hsl(var(--border))]">
                      <h4 className="font-semibold text-[var(--accent-text)] mb-1">Proactive Strategy:</h4>
                      <p className="whitespace-pre-wrap">{message.content.proactive_strategy}</p>
                    </div>
                  </div>
                ) : message.type === 'evaluation' ? (
                  <FeedbackDisplay content={message.content as string} />
                ) : (
                  <MarkdownRenderer content={message.content as string} />
                )}
              </CardContent>
            </Card>
            {message.sender === "user" && (
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-[hsl(var(--muted))]">
                <User size={16} />
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-[#b8892e]">
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
      <div className="border-t border-[hsl(var(--border))] p-4">
        {renderInputArea()}
      </div>
      
      {/* Continue button moved to page level for better UX */}
    </div>
  )
}