"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, ArrowRight, Send, User, Bot, AlertTriangle, CheckCircle2, Info, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import MarkdownRenderer from "@/components/markdown-renderer"
import { v4 as uuidv4 } from 'uuid'
import { formatMessageContent } from "@/lib/message-formatter"

interface GuidedContingencyPlanProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const CONTINGENCY_QUESTIONS = [
  {
    id: "if_trigger",
    question: "Identify your 'IF' statements: What specific obstacles, challenges, or triggers might prevent you from achieving your learning goals?",
    hint: "List the exact internal barriers (such as knowledge gaps, procrastination habits, or focus issues) and external challenges (such as scheduling conflicts, resource limitations, or environmental distractions) that could derail your progress. Be as specific as possible about when and how these obstacles typically appear."
  },
  {
    id: "then_response",
    question: "Identify your 'THEN' statements: For each obstacle identified, what specific action steps will you take in response?",
    hint: "Detail the exact steps you'll take, including when, where, and how you'll implement your response (e.g., 'I will immediately schedule a 15-minute focused review session using the Feynman technique' rather than just 'I will study more')"
  },
  {
    id: "feasibility",
    question: "Consider what you'll need (time, tools, help) to follow through. What might make your plans hard to implement, and how can you prepare for that?",
    hint: "Consider the resources, time, and effort required to execute your plans. What might make your responses difficult to implement, and how can you address those barriers?"
  }
]

type Message = {
  id: string
  sender: "bot" | "user"
  content: string
  type?: "question" | "response" | "confirmation" | "evaluation" | "chat" | "error" 
  timestamp: Date
}

// Loading messages that cycle during evaluation
const loadingMessages = [
  "If-then plans bypass the need for willpower...",
  "Anticipating obstacles is key to overcoming them...",
  "Specific triggers make responses automatic...",
  "Mental contrasting connects goals with obstacles...",
  "Planning for distractions protects study time...",
  "Implementation intentions turn goals into habits..."
]

export default function GuidedContingencyPlan({
  userId, 
  phase, 
  component = "contingency_strategies",
  onComplete,
  height = "600px"
}: GuidedContingencyPlanProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState(uuidv4())
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        sender: "bot",
        content: `Hi there! 👋 Now let's create effective 'IF-THEN' plans to help you overcome potential distractions and obstacles while studying.

Looking at what makes an excellent contingency plan:
• Specific Triggers: 🔍 Your "IF" statements should pinpoint specific situations(obstacles) that challenge your focus
• Detailed Responses: 🛠️ Your "THEN" actions should be clear, immediate steps you can take when obstacles appear
• Practical Solutions: ⚖️ Your responses are realistic and feasible. Your strategies should work within your available time, environment, and resources

Now let's make a plan to handle obstacles. Create simple 'IF-THEN' statements that prepare you for challenges you might face when working toward your goal.`,
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: CONTINGENCY_QUESTIONS[0].question,
        timestamp: new Date(),
        type: "question"
      }
    ])
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container")
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  // Cycle through loading messages during evaluation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEvaluating) {
      interval = setInterval(() => {
        setCurrentLoadingMessage(prev => (prev + 1) % loadingMessages.length);
      }, 2000); // Faster cycling speed for better engagement
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEvaluating]);

  const handleSendResponse = async () => {
    if (!userInput.trim()) return

    // Add user message
    const newMessage: Message = {
      id: uuidv4(),
      sender: "user",
      content: userInput,
      timestamp: new Date(),
      type: "response"
    }

    setMessages(prev => [...prev, newMessage])
    
    // Store the response for the current question
    const questionId = CONTINGENCY_QUESTIONS[currentQuestion].id
    setResponses(prev => ({
      ...prev,
      [questionId]: userInput
    }))
    
    setUserInput("")

    // Move to next question or confirmation
    if (currentQuestion < CONTINGENCY_QUESTIONS.length - 1) {
      // More questions to ask - provide local feedback without calling Claude
      setCurrentQuestion(prev => prev + 1)
      
      // Add next question after a brief delay
      setTimeout(() => {
        const nextQuestion: Message = {
          id: uuidv4(),
          sender: "bot",
          content: CONTINGENCY_QUESTIONS[currentQuestion + 1].question,
          timestamp: new Date(),
          type: "question"
        }
        setMessages(prev => [...prev, nextQuestion])
      }, 500)
    } else {
      // All questions answered, move to confirmation
      setIsConfirming(true)
      
      // Add confirmation message
      setTimeout(() => {
        const confirmationMessage: Message = {
          id: uuidv4(),
          sender: "bot",
          content: `Thank you for your responses! Here is your complete contingency plan:`,
          timestamp: new Date(),
          type: "confirmation"
        }
        setMessages(prev => [...prev, confirmationMessage])
      }, 500)
    }
  }

  const handleConfirmAndSubmit = async () => {
    setIsEvaluating(true)
    
    // Compile the full contingency plan
    const fullContingencyPlan = `
IF Triggers: ${responses["if_trigger"] || ""}

THEN Responses: ${responses["then_response"] || ""}

Feasibility Considerations: ${responses["feasibility"] || ""}
    `.trim()
    
    try {
      console.log("Sending contingency strategies to API:", {
        userId,
        phase,
        component,
        fullContingencyPlan
      });
      
      // Send to the dedicated submit endpoint for evaluation
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId || "anonymous", // Ensure userId is not empty
          phase: phase,
          component: component,
          message: fullContingencyPlan,
          conversation_id: conversationId,
          submission_type: "contingency_plan"
        })
      })
      
      // Log the response status for debugging
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error details:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json()
      console.log("API response data:", data);
      
      if (data.success && data.data) {
        setEvaluationResult(data.data)
        
        // Add evaluation response
        const resultMessage: Message = {
          id: uuidv4(),
          sender: "bot",
          content: data.data.message,
          timestamp: new Date(),
          type: "evaluation"
        }
        setMessages(prev => [...prev, resultMessage])
        
        // If next_phase is available, make it possible to continue
        if (data.data.next_phase && onComplete) {
          // Show next phase button after delay
          setTimeout(() => {
            // Button will be rendered based on evaluationResult having next_phase
          }, 1000)
        }
      } else {
        throw new Error('Invalid response format: ' + JSON.stringify(data))
      }
    } catch (error: any) {
      console.error('Error during evaluation:', error)
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        sender: "bot",
        content: `I encountered an error while evaluating your contingency strategies: ${error.message || "Unknown error"}. Please try again or contact support if the problem persists.`,
        timestamp: new Date(),
        type: "evaluation"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleEditResponses = () => {
    // Go back to first question
    setCurrentQuestion(0)
    setIsConfirming(false)
    
    // Add message about editing
    const editMessage: Message = {
      id: uuidv4(),
      sender: "bot",
      content: "Let's revise your contingency strategies. Here's the first question again.",
      timestamp: new Date(),
      type: "question"
    }
    
    const firstQuestion: Message = {
      id: uuidv4(),
      sender: "bot",
      content: CONTINGENCY_QUESTIONS[0].question,
      timestamp: new Date(),
      type: "question"
    }
    
    setMessages(prev => [...prev, editMessage, firstQuestion])
    
    // Pre-fill the input with previous response
    setUserInput(responses[CONTINGENCY_QUESTIONS[0].id] || "")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendResponse()
    }
  }
  
  // Process chat message to convert markdown
  const processMessageContent = (content: string) => {
    // Special case for confirmation messages to display the contingency plan properly
    if (content.includes("Thank you for your responses! Here is your complete contingency plan")) {
      return (
        <div className="flex flex-col space-y-3">
          <div>{content}</div>
          
          <div className="bg-slate-800 rounded-md border border-amber-500/50 p-4 mt-2 space-y-4">
            <div className="space-y-2">
              <h3 className="text-amber-300 font-medium">If-Then Structure:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["if_trigger"] || ""}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-amber-300 font-medium">Response Specificity:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["then_response"] || ""}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-amber-300 font-medium">Feasibility:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["feasibility"] || ""}
              </div>
            </div>
          </div>
          
          <div className="text-slate-300 mt-2">
            Is this your complete contingency plan? If you'd like to make any changes, click "Edit Responses". Otherwise, click "Confirm & Submit" to proceed.
          </div>
        </div>
      );
    }
    
    // Use the imported formatMessageContent function to format structured responses
    // This handles proper formatting for sections like ## Assessment, ## Guidance, and ## Next Steps
    return formatMessageContent(content);
  }
  
  // Reset and start over the process
  const handleStartOver = () => {
    setUserInput("");
    setMessages([
      {
        id: uuidv4(),
        sender: "bot",
        content: `Hi there! 👋 Now let's create effective if-then plans to help you overcome potential distractions and obstacles while studying.

Looking at what makes an excellent contingency plan:
• Specific Triggers: 🔍 The "IF" part clearly identifies exact situations when your plan goes into action
• Detailed Responses: 🛠️ The "THEN" part details exactly what steps you'll take when obstacles arise
• Practical Solutions: ⚖️ Your responses are realistic and feasible given your resources and constraints

I'll guide you through creating implementation intentions that will help you anticipate challenges and respond effectively to stay on track with your learning goals.`,
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: CONTINGENCY_QUESTIONS[0].question,
        timestamp: new Date(),
        type: "question"
      }
    ]);
    setResponses({});
    setCurrentQuestion(0);
    setIsConfirming(false);
    setIsEvaluating(false);
    setEvaluationResult(null);
  }

  // Handle sending a response (not part of guided questions)
  const handleSendChatMessage = async () => {
    if (!userInput.trim()) return
    
    // Add user message to chat
    const newMessage: Message = {
      id: uuidv4(),
      sender: "user",
      content: userInput,
      timestamp: new Date(),
      type: "chat"
    }
    
    setMessages(prev => [...prev, newMessage])
    setUserInput("")
    setIsSubmitting(true)
    
    // Show loading animation
    setIsEvaluating(true)
    
    try {
      // Direct chat with Claude (free-form mode)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId || "anonymous",
          phase: phase,
          component: component,
          message: userInput,
          conversation_id: conversationId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // Add Claude's response to chat
        const responseMessage: Message = {
          id: uuidv4(),
          sender: "bot",
          content: data.data.message,
          timestamp: new Date(),
          type: "chat"
        }
        
        setMessages(prev => [...prev, responseMessage])
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Error during chat:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        sender: "bot",
        content: `I encountered an error: ${error.message || "Unknown error"}. Please try again.`,
        timestamp: new Date(),
        type: "error"
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSubmitting(false)
      setIsEvaluating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        id="guided-chat-container"
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 p-4"
        style={{ height }}
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-2 ${message.sender === "bot" ? "justify-start" : "justify-end"}`}
          >
            {message.sender === "bot" && (
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-purple-600">
                <Bot size={16} />
              </div>
            )}
            
            <Card className={`max-w-[75%] ${message.sender === "bot" ? "bg-slate-800/70" : "bg-purple-900/70"} border-0 shadow-md`}>
              <CardContent className="p-3">
                <div className="text-sm">
                  {typeof message.content === 'string' 
                    ? processMessageContent(message.content) 
                    : message.content}
                </div>
              </CardContent>
            </Card>
            
            {message.sender === "user" && (
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-slate-600">
                <User size={16} />
              </div>
            )}
          </motion.div>
        ))}
        
        {isEvaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 mb-2"
            key="loading-indicator"
          >
            <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-purple-600">
              <Bot size={16} />
            </div>
            <div 
              className="typing-indicator"
              data-message={loadingMessages[currentLoadingMessage]}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="border-t border-gray-700 p-4">
        {!isConfirming && !isEvaluating && !evaluationResult ? (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-xs text-gray-400">
              <div className="flex-1">
                Question {currentQuestion + 1} of {CONTINGENCY_QUESTIONS.length}
              </div>
              <div>
                {userInput.length} / 1500 characters
              </div>
            </div>
            
            <div className="flex gap-2 items-start">
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-slate-600 mt-2">
                <User size={16} />
              </div>
              <Textarea
                placeholder={CONTINGENCY_QUESTIONS[currentQuestion].hint}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1500}
                className="flex-1 bg-slate-800/50 border-slate-700 focus:border-purple-500 min-h-[80px]"
                rows={3}
              />
              <Button 
                onClick={handleSendResponse}
                className="h-auto bg-purple-600 hover:bg-purple-500 py-3"
                disabled={!userInput.trim() || isSubmitting}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        ) : isConfirming && !evaluationResult ? (
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              onClick={handleEditResponses}
              className="border-slate-600"
              disabled={isEvaluating}
            >
              Edit Responses
            </Button>
            <Button
              onClick={handleConfirmAndSubmit}
              className="bg-purple-600 hover:bg-purple-500"
              disabled={isEvaluating}
            >
              <Check size={16} className="mr-2" />
              Confirm & Submit
            </Button>
          </div>
        ) : evaluationResult ? (
          // Post-evaluation input for continued conversation
          <div className="flex flex-col space-y-2">
            <div className="flex gap-2 items-start">
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-slate-600 mt-2">
                <User size={16} />
              </div>
              <Textarea
                placeholder="Ask a question about your contingency strategies..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendChatMessage()
                  }
                }}
                maxLength={1500}
                className="flex-1 bg-slate-800/50 border-slate-700 focus:border-purple-500 min-h-[80px]"
                rows={3}
              />
              <Button 
                onClick={handleSendChatMessage}
                className="h-auto bg-purple-600 hover:bg-purple-500 py-3"
                disabled={!userInput.trim() || isSubmitting}
              >
                <Send size={18} />
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => onComplete && onComplete("phase5")}
                className="bg-purple-600 hover:bg-purple-500"
              >
                Next Phase <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
} 