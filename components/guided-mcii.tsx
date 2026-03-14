"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, Send, User, Bot } from "lucide-react"
import { motion } from "framer-motion"
import MarkdownRenderer from "@/components/markdown-renderer"
import FeedbackDisplay from "@/components/feedback-display"
import { v4 as uuidv4 } from 'uuid'

const DIRECT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://solbot-backend.onrender.com"

interface GuidedMCIIProps {
  userId: string
  phase: string
  component?: string
  onComplete?: () => void
  height?: string
}

const MCII_QUESTIONS = [
  {
    id: "pick_goal",
    question: "Pick a goal you would like to achieve. For the purposes of this module, please choose a goal related to the course containing this module. State the goal you selected below.",
    hint: "Pick something specific you want to achieve in this course."
  },
  {
    id: "indulge",
    question: "Take a moment and consider how it would feel to achieve the goal – Why would achieving this goal be so satisfying? Imagine the relevant events and experiences as vividly as possible – really let your mind go! Elaborate in writing on what it would feel like to achieve the goal.",
    hint: "Let your imagination go — what would success feel like?"
  },
  {
    id: "consider_obstacles",
    question: "Sometimes things do not work out as well as we would have liked. Think about the obstacles that might prevent you from achieving your goal. What is the most challenging obstacle that stands in your way? What other obstacles might make it hard for you to achieve your goal? Consider your own thoughts and habits – what obstacles of your own creation might make it harder to achieve your goal? Spend some time reflecting on these obstacles. In the space provided, name the central obstacle. Think about it deeply and imagine the relevant events and experiences as vividly as possible, then elaborate in writing on what could prevent you from achieving your goal.",
    hint: "What personal habits or tendencies could get in your way?"
  },
  {
    id: "implementation_intention",
    question: "Now please make an implementation intention that will help you to approach your goal. You may find it useful to think of the main obstacle that you identified and create an implementation intention that can help you overcome this obstacle in particular. To remind you, an implementation intention should have the following format: \"If (I am in a situation X), then (I will do Y).\" Please complete your implementation intention below. Once you're done writing, remember to repeat the implementation intention to yourself a few times and visualize performing it.",
    hint: "Write a concrete 'If __, then I will __' plan."
  }
]

const CHARACTER_LIMIT = 5000;
const loadingMessages = [
  "Analyzing your MCII plan...",
  "Evaluating goal clarity and implementation intentions...",
  "Assessing mental contrasting quality...",
  "Reviewing obstacle identification and feasibility..."
];

type MessageContent = string | { 
  pick_goal: string; 
  indulge: string; 
  consider_obstacles: string; 
  implementation_intention: string; 
};

type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
}

export default function GuidedMCII({
  userId,
  phase,
  component = "mcii",
  onComplete,
  height = "600px"
}: GuidedMCIIProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [interactionState, setInteractionState] = useState<"guiding" | "confirming" | "chatting">("guiding");
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const [feedbackReceived, setFeedbackReceived] = useState(false);
  const [chatAnalyticsId, setChatAnalyticsId] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<string | null>(null);
  const [showRetryOption, setShowRetryOption] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      const storedSessionId = localStorage.getItem("session_id");
      if (storedSessionId) {
        setSessionId(storedSessionId);
        
        // Load any saved responses to prevent data loss
        try {
          const savedResponses = localStorage.getItem(`solbot_temp_responses_${component}_${phase}`);
          if (savedResponses) {
            const parsedResponses = JSON.parse(savedResponses);
            setResponses(parsedResponses);
            console.log("Restored saved responses from localStorage");
          }
        } catch (error) {
          console.warn("Could not load saved responses:", error);
        }
        
        try {
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: storedSessionId,
              event_type: 'chat_started',
              phase: phase,
              component: component,
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
        { id: uuidv4(), sender: "bot", content: "Welcome to the MCII (Mental Contrasting with Implementation Intentions) exercise! I'll guide you through four steps to create a powerful strategic plan for achieving your learning goal.", type: "question" },
        { id: uuidv4(), sender: "bot", content: MCII_QUESTIONS[0].question, type: "question" }
      ]);
    };
    initializeChat();
  }, [phase, component]);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase4-mcii");
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

    const questionId = MCII_QUESTIONS[currentQuestionIndex].id;
    const newResponses = { ...responses, [questionId]: userInput };
    setResponses(newResponses);

    // Save responses to localStorage to prevent data loss
    try {
      localStorage.setItem(`solbot_temp_responses_${component}_${phase}`, JSON.stringify(newResponses));
    } catch (error) {
      console.warn("Could not save responses to localStorage:", error);
    }

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
            question_text: MCII_QUESTIONS[currentQuestionIndex].question,
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

    if (currentQuestionIndex < MCII_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: MCII_QUESTIONS[nextQuestionIndex].question, type: "question" });
    } else {
      setInteractionState("confirming");
      botMessages.push({
        id: uuidv4(),
        sender: "bot",
        content: {
          pick_goal: newResponses["pick_goal"],
          indulge: newResponses["indulge"],
          consider_obstacles: newResponses["consider_obstacles"],
          implementation_intention: newResponses["implementation_intention"],
        },
        type: "confirmation",
      });
    }
    setMessages(prev => [...prev, userMessage, ...botMessages]);
    setUserInput("");
  };

  const submitToApi = async (message: string, isRetry: boolean = false) => {
    if (!sessionId) return;
    setIsLoading(true);
    setShowRetryOption(false);

    // Save the request for potential retry
    setLastFailedRequest(message);

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
      setFeedbackReceived(true);
      setLastFailedRequest(null); // Clear on success

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
    } catch (error: any) {
      console.error("Chat API error:", error);
      
      // Create user-friendly error message with retry option
      const errorContent = error.message?.includes("timeout") || error.message?.includes("took longer") 
        ? "I'm taking longer than usual to analyze your thoughtful response. This often happens with complex educational content that requires careful consideration.\n\n**Your work is saved** - you can try again for feedback or continue to the next task."
        : "I encountered a temporary issue while providing feedback on your response.\n\n**Your work is saved** - please try again or continue to the next task.";
      
      const errorMessage: Message = { 
        id: uuidv4(), 
        sender: "bot", 
        content: errorContent, 
        type: "evaluation" 
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowRetryOption(true); // Show retry option on error
    } finally {
      setIsLoading(false);
      setInteractionState("chatting");
    }
  };

  const handleRetryFeedback = () => {
    if (lastFailedRequest) {
      submitToApi(lastFailedRequest, true);
    }
  };

  const handleSubmitForFeedback = () => {
    const fullMCIIPlan = `Goal: ${responses["pick_goal"] || ""}\n\nIndulge (Visualization): ${responses["indulge"] || ""}\n\nConsider Obstacles: ${responses["consider_obstacles"] || ""}\n\nImplementation Intention: ${responses["implementation_intention"] || ""}`;
    
    // Save the MCII plan to localStorage
    try {
      localStorage.setItem("solbot_mcii_plan", JSON.stringify(responses));
    } catch (error) {
      console.error("Failed to save MCII plan to localStorage:", error);
    }

    submitToApi(fullMCIIPlan);
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
        { id: uuidv4(), sender: "bot", content: "Let's revise your MCII plan. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: MCII_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[MCII_QUESTIONS[0].id] || "");

    if (sessionId) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'revision_submitted',
          phase: phase,
          component: component,
          metadata: {
            attempt_number: (messages.filter(m => m.type === 'evaluation').length) + 1,
            content_changes: responses,
          },
        }),
      });
    }
  };
  
  const handleCompleteChat = () => {
    if (chatAnalyticsId && sessionId) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'chat_ended',
          metadata: {
            chat_analytics_id: chatAnalyticsId,
            message_count: messages.length,
          },
        }),
      });
    }
    
    // Clean up temporary saved responses on successful completion
    try {
      localStorage.removeItem(`solbot_temp_responses_${component}_${phase}`);
    } catch (error) {
      console.warn("Could not clean up temporary responses:", error);
    }
    
    if (onComplete) {
      onComplete();
    }
  };
  
   const accent = "var(--accent-text)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
  }

  const renderInputArea = () => {
    if (interactionState === 'guiding') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs" style={{ color: mutedText }}>
            <div className="flex-1">Step {currentQuestionIndex + 1} of {MCII_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={MCII_QUESTIONS[currentQuestionIndex].hint}
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
        <div className="flex flex-col space-y-4">
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Refine your MCII plan based on the feedback..."
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
          {showRetryOption && (
            <div className="flex justify-center mt-2">
              <Button onClick={handleRetryFeedback} variant="outline" style={{ borderColor: accent, color: accent }}>
                Try Again for Feedback
              </Button>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        id="guided-chat-container-phase4-mcii"
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
                backgroundColor: neutralSurface, 
                borderColor: neutralBorder,
                color: "hsl(var(--foreground))"
              }}
            >
              <CardContent className="p-3 text-sm overflow-hidden max-w-full">
                 {message.type === 'confirmation' && typeof message.content === 'object' ? (
                    <div className="space-y-3">
                      <p>Thank you for your thoughtful responses! Here is your complete MCII plan. Please review it.</p>
                      <div className="p-3 rounded-md border" style={{ backgroundColor: "hsl(var(--muted) / 0.4)", borderColor: neutralBorder }}>
                        <h4 className="font-semibold mb-1" style={{ color: accent }}>1. Goal:</h4>
                        <p className="whitespace-pre-wrap">{message.content.pick_goal}</p>
                      </div>
                      <div className="p-3 rounded-md border" style={{ backgroundColor: "hsl(var(--muted) / 0.4)", borderColor: neutralBorder }}>
                        <h4 className="font-semibold mb-1" style={{ color: accent }}>2. Indulge (Visualization):</h4>
                        <p className="whitespace-pre-wrap">{message.content.indulge}</p>
                      </div>
                      <div className="p-3 rounded-md border" style={{ backgroundColor: "hsl(var(--muted) / 0.4)", borderColor: neutralBorder }}>
                        <h4 className="font-semibold mb-1" style={{ color: accent }}>3. Consider Obstacles:</h4>
                        <p className="whitespace-pre-wrap">{message.content.consider_obstacles}</p>
                      </div>
                      <div className="p-3 rounded-md border" style={{ backgroundColor: "hsl(var(--muted) / 0.4)", borderColor: neutralBorder }}>
                        <h4 className="font-semibold mb-1" style={{ color: accent }}>4. Implementation Intention:</h4>
                        <p className="whitespace-pre-wrap">{message.content.implementation_intention}</p>
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
