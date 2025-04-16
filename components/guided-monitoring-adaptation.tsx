"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, ArrowRight, Send, User, Bot, AlertTriangle, CheckCircle2, Info, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import MarkdownRenderer from "@/components/markdown-renderer"
import { v4 as uuidv4 } from 'uuid'

interface GuidedMonitoringAdaptationProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const MONITORING_QUESTIONS = [
  {
    id: "progress_metrics",
    question: "What specific metrics or indicators will you track to monitor your progress?",
    hint: "Example: 'Completion of weekly practice problems, quiz scores, ability to implement concepts in my projects'"
  },
  {
    id: "reflection_schedule",
    question: "How and when will you schedule regular reflection on your learning progress?",
    hint: "Example: 'I'll do a 15-minute review every Friday afternoon and a more comprehensive monthly assessment'"
  },
  {
    id: "adaptation_approach",
    question: "How will you adjust your learning plan if you discover your current approach isn't working?",
    hint: "Example: 'I'll seek feedback from peers, try alternative learning resources, or adjust my timeline if necessary'"
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
  "Regular monitoring prevents learning gaps...",
  "Adaptation is a sign of effective learning...",
  "Progress metrics create accountability...",
  "Alternative strategies build learning resilience...",
  "Early adjustments prevent larger problems...",
  "Expert learners continuously monitor progress...",
]

export default function GuidedMonitoringAdaptation({
  userId, 
  phase, 
  component = "general",
  onComplete,
  height = "600px"
}: GuidedMonitoringAdaptationProps) {
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
        content: "In this final phase, we'll create a system for monitoring your progress and adapting your strategy as needed. This will help you stay on track with your learning goals.",
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: MONITORING_QUESTIONS[0].question,
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
    const questionId = MONITORING_QUESTIONS[currentQuestion].id
    setResponses(prev => ({
      ...prev,
      [questionId]: userInput
    }))
    
    setUserInput("")

    // Move to next question or confirmation
    if (currentQuestion < MONITORING_QUESTIONS.length - 1) {
      // More questions to ask - provide local feedback without calling Claude
      setCurrentQuestion(prev => prev + 1)
      
      // Add next question after a brief delay
      setTimeout(() => {
        const nextQuestion: Message = {
          id: uuidv4(),
          sender: "bot",
          content: MONITORING_QUESTIONS[currentQuestion + 1].question,
          timestamp: new Date(),
          type: "question"
        }
        setMessages(prev => [...prev, nextQuestion])
      }, 500)
    } else {
      // All questions answered, move to confirmation
      setIsConfirming(true)
      
      // Update responses with the final answer
      const updatedResponses = {
        ...responses,
        [questionId]: userInput
      };
      
      // Log the responses for debugging
      console.log("Responses for confirmation:", updatedResponses);
      
      // Compile the full monitoring and adaptation plan with explicit formatting
      const fullMonitoringPlan = `
Progress Metrics: ${updatedResponses["progress_metrics"] || ""}

Reflection Schedule: ${updatedResponses["reflection_schedule"] || ""}

Adaptation Approach: ${updatedResponses["adaptation_approach"] || ""}
      `.trim()
      
      // Add confirmation message
      setTimeout(() => {
        const confirmationMessage: Message = {
          id: uuidv4(),
          sender: "bot",
          content: `Thank you for your responses! Here is your complete monitoring and adaptation plan:\n\n${fullMonitoringPlan}\n\nIs this your complete plan? If you'd like to make any changes, please let me know. Otherwise, click "Confirm & Submit" to proceed.`,
          timestamp: new Date(),
          type: "confirmation"
        }
        setMessages(prev => [...prev, confirmationMessage])
      }, 500)
    }
  }

  const handleConfirmAndSubmit = async () => {
    setIsEvaluating(true)
    
    // Log the responses for debugging
    console.log("Responses for submission:", responses);
    
    // Compile the full monitoring and adaptation plan with capitalized headings for clarity
    const fullMonitoringPlan = `
PROGRESS METRICS: ${responses["progress_metrics"] || ""}

REFLECTION SCHEDULE: ${responses["reflection_schedule"] || ""}

ADAPTATION APPROACH: ${responses["adaptation_approach"] || ""}
    `.trim()
    
    try {
      console.log("Sending monitoring and adaptation plan to API:", {
        userId,
        phase,
        component,
        fullMonitoringPlan
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
          message: fullMonitoringPlan,
          conversation_id: conversationId,
          submission_type: "monitoring_adaptation"
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
        content: `I encountered an error while evaluating your monitoring plan: ${error.message || "Unknown error"}. Please try again or contact support if the problem persists.`,
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
      content: "Let's revise your monitoring and adaptation plan. Here's the first question again.",
      timestamp: new Date(),
      type: "question"
    }
    
    const firstQuestion: Message = {
      id: uuidv4(),
      sender: "bot",
      content: MONITORING_QUESTIONS[0].question,
      timestamp: new Date(),
      type: "question"
    }
    
    setMessages(prev => [...prev, editMessage, firstQuestion])
    
    // Pre-fill the input with previous response
    setUserInput(responses[MONITORING_QUESTIONS[0].id] || "")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendResponse()
    }
  }
  
  // Process chat message to convert markdown
  const processMessageContent = (content: string) => {
    // Special case for confirmation messages to display the monitoring plan properly
    if (content.includes("Thank you for your responses! Here is your complete monitoring and adaptation plan")) {
      return (
        <div className="flex flex-col space-y-3">
          <div>{content}</div>
          
          <div className="bg-slate-800 rounded-md border border-blue-500/50 p-4 mt-2 space-y-4">
            <div className="space-y-2">
              <h3 className="text-blue-300 font-medium">Progress Metrics:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["progress_metrics"] || ""}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-blue-300 font-medium">Reflection Schedule:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["reflection_schedule"] || ""}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-blue-300 font-medium">Adaptation Approach:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["adaptation_approach"] || ""}
              </div>
            </div>
          </div>
          
          <div className="text-slate-300 mt-2">
            Is this your complete monitoring and adaptation plan? If you'd like to make any changes, click "Edit Responses". Otherwise, click "Confirm & Submit" to proceed.
          </div>
        </div>
      );
    }
    
    // Extract sections using section headers pattern
    if (content.includes("## Assessment") || content.includes("## Guidance") || content.includes("## Next Steps")) {
      // Split the content into sections
      const sections: {[key: string]: string} = {
        intro: "",
        assessment: "",
        guidance: "",
        nextSteps: ""
      };
      
      // Process the content to identify sections
      const lines = content.split('\n');
      let currentSection = "intro";
      
      for (const line of lines) {
        // Check for section markers and transition to that section
        if (line.startsWith("## Assessment")) {
          currentSection = "assessment";
          continue; // Skip the header line
        }
        else if (line.startsWith("## Guidance")) {
          currentSection = "guidance";
          continue; // Skip the header line
        }
        else if (line.startsWith("## Next Steps")) {
          currentSection = "nextSteps";
          continue; // Skip the header line
        }
        
        // Add line to current section
        sections[currentSection] += line + '\n';
      }
      
      // Clean up each section by trimming
      Object.keys(sections).forEach(key => {
        sections[key] = sections[key].trim();
      });
      
      // Format with colored borders and sections
      return (
        <div className="flex flex-col space-y-4">
          {sections.intro && (
            <div className="text-white/90">
              <MarkdownRenderer content={sections.intro} />
            </div>
          )}
          
          {sections.assessment && (
            <div className="border-l-4 border-amber-500 pl-3 py-3 bg-slate-800/40 rounded-md shadow-md">
              <div className="text-amber-400 font-medium text-lg mb-3 flex items-center">
                <span className="text-amber-400 mr-2 text-xl">⚠️</span>
                Assessment
              </div>
              <MarkdownRenderer content={sections.assessment} />
            </div>
          )}
          
          {sections.guidance && (
            <div className="border-l-4 border-purple-500 py-3 rounded-md overflow-hidden shadow-md">
              <div className="bg-purple-800/20 mb-3 py-2 pl-3 border-b border-purple-500/30">
                <div className="text-purple-300 font-semibold text-lg flex items-center">
                  <span className="text-purple-300 mr-2 text-xl">📝</span>
                  Guidance
                </div>
              </div>
              <div className="bg-slate-800/40 px-4 py-3 border border-slate-700/60">
                <MarkdownRenderer content={sections.guidance} className="prose prose-invert max-w-none text-slate-100" />
              </div>
            </div>
          )}
          
          {sections.nextSteps && (
            <div className="border-l-4 border-blue-500 pl-3 py-3 bg-slate-800/40 rounded-md shadow-md">
              <div className="text-blue-400 font-medium text-lg mb-3 flex items-center">
                <span className="text-blue-400 mr-2 text-xl">📝</span>
                Next Steps
              </div>
              <MarkdownRenderer content={sections.nextSteps} />
            </div>
          )}
        </div>
      );
    }
    
    // For regular messages with no special formatting
    return (
      <div className="border-l-4 border-amber-500/40 pl-3 rounded">
        <MarkdownRenderer content={content} />
      </div>
    );
  }

  // Reset and start over the process
  const handleStartOver = () => {
    setUserInput("");
    setMessages([
      {
        id: uuidv4(),
        sender: "bot",
        content: "In this final phase, we'll create a system for monitoring your progress and adapting your strategy as needed. This will help you stay on track with your learning goals.",
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: MONITORING_QUESTIONS[0].question,
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
                Question {currentQuestion + 1} of {MONITORING_QUESTIONS.length}
              </div>
              <div>
                {userInput.length} / 500 characters
              </div>
            </div>
            
            <div className="flex gap-2 items-start">
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-slate-600 mt-2">
                <User size={16} />
              </div>
              <Textarea
                placeholder={MONITORING_QUESTIONS[currentQuestion].hint}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
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
                placeholder="Ask a question about your monitoring plan..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendChatMessage()
                  }
                }}
                maxLength={500}
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
                onClick={() => onComplete && onComplete("summary")}
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