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

interface GuidedLearningObjectiveProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const OBJECTIVE_QUESTIONS = [
  {
    id: "goal_clarity",
    question: "For your chosen course/task: What are you learning right now? Describe the key topics, skills, and objectives involved.",
    hint: "Example: 'In my algebra course, I'm learning to solve quadratic equations. I need to master factoring and the quadratic formula.'"
  },
  {
    id: "background_connection",
    question: "What learning materials and resources do you have access to?",
    hint: "Example: 'My textbook (Chapter 5), the professor's lecture slides, and Khan Academy videos on this topic.'"
  },
  {
    id: "study_resources",
    question: "How will you use these resources to maximize your learning?",
    hint: "Example: 'I'll read the textbook chapter first, then watch the videos for any concepts that are still unclear.'"
  }
];

const CHARACTER_LIMIT = 5000;
const loadingMessages = [
  "Analyzing your learning objective...",
  "How does this objective connect to what you already know?",
  "Is the cognitive level (knowledge, comprehension, analysis) clear?",
  "What specific action does the verb in your objective suggest?",
  "Connecting to pedagogical principles...",
  "Crafting personalized feedback..."
];

type MessageContent = string | { task: string; resources: string; strategy: string; };
type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
}

export default function GuidedLearningObjective({
  userId, 
  phase, 
  component = "learning_objectives",
  onComplete,
  height = "600px"
}: GuidedLearningObjectiveProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [interactionState, setInteractionState] = useState<"guiding" | "confirming" | "chatting">("guiding");
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const [chatAnalyticsId, setChatAnalyticsId] = useState<string | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      const storedSessionId = localStorage.getItem("session_id");
      if (storedSessionId) {
        setSessionId(storedSessionId);
        
        // Create a chat analytics entry
        try {
          const response = await fetch('/api/analytics/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: storedSessionId,
              phase: phase,
              component: component,
              start_time: new Date().toISOString(),
            }),
          });
          const data = await response.json();
          if (data.id) {
            setChatAnalyticsId(data.id);
          }
        } catch (error) {
          console.error("Failed to create chat analytics entry:", error);
        }
      }
      
      setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's define your learning objective. I'll guide you through the process step by step.", type: "question" },
        { id: uuidv4(), sender: "bot", content: OBJECTIVE_QUESTIONS[0].question, type: "question" }
      ]);
    };
    
    initializeChat();
  }, [phase, component]);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase2");
    if (chatContainer) { chatContainer.scrollTop = chatContainer.scrollHeight; }
  }, [messages, isLoading]);
  
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

    const questionId = OBJECTIVE_QUESTIONS[currentQuestionIndex].id;
    const newResponses = { ...responses, [questionId]: userInput };
    setResponses(newResponses);

    const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
    let botMessages: Message[] = [];

    if (currentQuestionIndex < OBJECTIVE_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: OBJECTIVE_QUESTIONS[nextQuestionIndex].question, type: "question" });
    } else {
      setInteractionState("confirming");
      const confirmationContent = {
        task: newResponses["goal_clarity"],
        resources: newResponses["background_connection"],
        strategy: newResponses["study_resources"]
      };
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
      const response = await fetch('/api/chat', {
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

      // Update chat analytics entry
      if (chatAnalyticsId) {
        try {
          await fetch(`/api/analytics/chat/${chatAnalyticsId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              end_time: new Date().toISOString(),
              message_count: messages.length + 2, // User message + Bot feedback
            }),
          });
        } catch (error) {
          console.error("Failed to update chat analytics entry:", error);
        }
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
    const fullObjective = `Course/Learning Task: ${responses["goal_clarity"]}\n\nAvailable Resources: ${responses["background_connection"]}\n\nStrategic Resource Utilization: ${responses["study_resources"]}`;
    submitToApi(fullObjective);
  };
  
  const handleSendChatMessage = () => {
      if (!userInput.trim()) return;
      const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
      setMessages(prev => [...prev, userMessage]);
      const messageToSend = userInput;
      setUserInput("");
      submitToApi(messageToSend);
  }

  const handleEdit = () => {
    setInteractionState("guiding");
    setCurrentQuestionIndex(0);
    setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's revise your learning objective. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: OBJECTIVE_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[OBJECTIVE_QUESTIONS[0].id] || "");
  };
  
  const accent = "#d8b26f"
  const neutralSurface = "hsl(var(--card))"
  const neutralBorder = "hsl(var(--border))"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: `linear-gradient(135deg, ${accent}, #e6c98c)`,
    color: "#1f1408",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  }

  const renderInputArea = () => {
    if (interactionState === 'guiding') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs" style={{ color: mutedText }}>
            <div className="flex-1">Question {currentQuestionIndex + 1} of {OBJECTIVE_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={OBJECTIVE_QUESTIONS[currentQuestionIndex].hint}
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
          <Button variant="outline" onClick={handleEdit} disabled={isLoading} style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}>Edit</Button>
          <Button onClick={handleSubmitForFeedback} disabled={isLoading} style={primaryButtonStyle}>
            <Check size={16} className="mr-2"/>Confirm & Submit
          </Button>
        </div>
      );
    } else { // 'chatting'
      return (
         <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Refine your learning objective based on the feedback..."
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
      <div id="guided-chat-container-phase2" className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 w-full ${message.sender === "bot" ? "justify-start" : "justify-end"}`}
          >
            {message.sender === "bot" && (
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center" style={{ backgroundColor: accent }}>
                <Bot size={16} style={{ color: "#1f1408" }} />
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
                    <p>Thank you! Here is your complete learning objective. Please review it.</p>
                    <div className="p-3 rounded-md border" style={{ backgroundColor: "hsl(var(--muted) / 0.5)", borderColor: neutralBorder }}>
                      <h4 className="font-semibold mb-1" style={{ color: accent }}>Course/Learning Task:</h4>
                      <p className="whitespace-pre-wrap">{message.content.task}</p>
                    </div>
                    <div className="p-3 rounded-md border" style={{ backgroundColor: "hsl(var(--muted) / 0.5)", borderColor: neutralBorder }}>
                      <h4 className="font-semibold mb-1" style={{ color: accent }}>Available Resources:</h4>
                      <p className="whitespace-pre-wrap">{message.content.resources}</p>
                    </div>
                    <div className="p-3 rounded-md border" style={{ backgroundColor: "hsl(var(--muted) / 0.5)", borderColor: neutralBorder }}>
                      <h4 className="font-semibold mb-1" style={{ color: accent }}>Strategic Resource Utilization:</h4>
                      <p className="whitespace-pre-wrap">{message.content.strategy}</p>
                    </div>
                  </div>
                ) : message.type === 'evaluation' ? (
                  <FeedbackDisplay 
                    content={message.content as string}
                    evaluation={message.evaluation}
                    userMessage={messages.find(m => m.sender === "user" && m.type === "response")?.content as string}
                    phase={phase}
                    component={component}
                    sessionId={localStorage.getItem("session_id") || undefined}
                    currentStyle={localStorage.getItem("solbot_coach_tone") || "warm"}
                  />
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
                    <Bot size={16} style={{ color: "#1f1408" }} />
                </div>
                <div className="typing-indicator" data-message={loadingMessages[currentLoadingMessage]}>
                    <span></span><span></span><span></span>
                </div>
            </motion.div>
        )}
      </div>
      <div className="border-t p-4" style={{ borderColor: neutralBorder }}>
        {renderInputArea()}
      </div>
      
      {/* Remove the continue button since there's already a "Next to Phase 3" button outside the chat */}
    </div>
  )
} 