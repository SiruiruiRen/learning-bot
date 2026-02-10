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

interface GuidedShortTermGoalProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const SHORT_TERM_QUESTIONS = [
  {
    id: "specific_goal",
    question: "What's your next milestone/short-term goal, and how will you know when you've reached it?",
    hint: "Example: 'My goal is to finish Chapter 5 of my textbook by Friday. I'll know I'm done when I can complete all the practice problems.'"
  },
  {
    id: "action_plan",
    question: "What are the key steps you'll take to reach this short-term goal?",
    hint: "Example: 'I will read one section every day and do the practice problems for that section each night.'"
  },
  {
    id: "timeline",
    question: "What is your precise schedule for completing this goal, including any checkpoints?",
    hint: "Example: 'Mon-Thurs: Read one section. Fri: Review and do all practice problems. Sat: Take a day off.'"
  }
]

const CHARACTER_LIMIT = 5000;
const loadingMessages = [ "Analyzing your SMART goal...", "Checking for actionable steps...", "Crafting targeted feedback..."];

type MessageContent = string | { specific_goal: string; action_plan: string; timeline: string; };
type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
}

export default function GuidedShortTermGoal({
  userId,
  phase,
  component = "short_term_goals",
  onComplete,
  height = "600px"
}: GuidedShortTermGoalProps) {
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
      { id: uuidv4(), sender: "bot", content: "Now let's create a specific short-term SMART goal.", type: "question" },
      { id: uuidv4(), sender: "bot", content: SHORT_TERM_QUESTIONS[0].question, type: "question" }
    ]);
  }, []);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase4-short");
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

    const questionId = SHORT_TERM_QUESTIONS[currentQuestionIndex].id;
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
            question_text: SHORT_TERM_QUESTIONS[currentQuestionIndex].question,
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

    if (currentQuestionIndex < SHORT_TERM_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: SHORT_TERM_QUESTIONS[nextQuestionIndex].question, type: "question" });
    } else {
      setInteractionState("confirming");
      const confirmationContent = {
        specific_goal: newResponses["specific_goal"],
        action_plan: newResponses["action_plan"],
        timeline: newResponses["timeline"]
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
      const response = await fetch('/api/chat', {
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
    const fullShortTermGoal = `Specific Goal: ${responses["specific_goal"] || ""}\n\nAction Plan: ${responses["action_plan"] || ""}\n\nTimeline: ${responses["timeline"] || ""}`;
    submitToApi(fullShortTermGoal);
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
        { id: uuidv4(), sender: "bot", content: "Let's revise your SMART goal. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: SHORT_TERM_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[SHORT_TERM_QUESTIONS[0].id] || "");
  };

  const renderInputArea = () => {
    if (interactionState === 'guiding') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs text-gray-400">
            <div className="flex-1">Question {currentQuestionIndex + 1} of {SHORT_TERM_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={SHORT_TERM_QUESTIONS[currentQuestionIndex].hint}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 bg-slate-800/50 border-slate-700 focus:border-purple-500 min-h-[80px]"
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendResponse(); }}}
            />
            <Button onClick={handleSendResponse} className="h-auto bg-purple-600 hover:bg-purple-500 py-3" disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      );
    } else if (interactionState === 'confirming') {
      return (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleEditResponses} disabled={isLoading}>Edit</Button>
          <Button onClick={handleSubmitForFeedback} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
            <Check size={16} className="mr-2"/>Confirm & Submit
          </Button>
        </div>
      );
    } else { // 'chatting'
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Refine your goal based on the feedback..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 bg-slate-800/50 border-slate-700 focus:border-purple-500 min-h-[80px]"
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); }}}
            />
            <Button onClick={handleSendChatMessage} className="h-auto bg-purple-600 hover:bg-purple-500 py-3" disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT}>
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
        id="guided-chat-container-phase4-short"
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
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-purple-600">
                <Bot size={16} />
              </div>
            )}
            <Card className={`${message.type === 'evaluation' ? 'w-full' : 'max-w-[85%]'} ${message.sender === "bot" ? "bg-slate-800/70" : "bg-purple-900/70"} border-slate-700`}>
              <CardContent className="p-3 text-sm overflow-hidden max-w-full">
                {message.type === 'confirmation' && typeof message.content === 'object' ? (
                  <div className="space-y-3">
                    <p>Thank you! Here is your complete SMART goal. Please review it.</p>
                    <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
                      <h4 className="font-semibold text-purple-400 mb-1">Specific Goal:</h4>
                      <p className="whitespace-pre-wrap">{message.content.specific_goal}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
                      <h4 className="font-semibold text-purple-400 mb-1">Action Plan:</h4>
                      <p className="whitespace-pre-wrap">{message.content.action_plan}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
                      <h4 className="font-semibold text-purple-400 mb-1">Timeline:</h4>
                      <p className="whitespace-pre-wrap">{message.content.timeline}</p>
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
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-slate-600">
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
            <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-purple-600">
                <Bot size={16} />
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

      <div className="border-t border-gray-700 p-4">
        {renderInputArea()}
      </div>
      
      {/* Continue button moved to page level for better UX */}
    </div>
  )
}