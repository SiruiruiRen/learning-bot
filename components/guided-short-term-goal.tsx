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
    question: "What specific short-term goal will you work on next, and how will you measure your success?",
    hint: "Example: 'Complete a 2000-word research paper on renewable energy impacts that includes at least 5 peer-reviewed sources by March 15th' rather than just 'Write a paper'"
  },
  {
    id: "action_plan",
    question: "What specific actions will you take to achieve this goal?",
    hint: "Example: 'Write 500 words daily between 9-11am, tracking progress in a writing log. Research 3 sources every Tuesday at the library. Schedule two 1-hour review sessions with my mentor on March 1st and 10th'"
  },
  {
    id: "timeline",
    question: "What is your precise schedule for completing this goal, including any checkpoints?",
    hint: "Example: 'March 1st - Complete outline and research. March 5th - Finish rough draft. March 10th - Complete final draft. March 12th - Proofread. March 15th - Submit final paper'"
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
  "Specific goals are easier to achieve...",
  "Measurable criteria track your progress...",
  "Action plans create a roadmap for success...",
  "Timeline commitments improve follow-through...",
  "Realistic goals build confidence and momentum...",
  "Short-term goals are building blocks for long-term success...",
]

export default function GuidedShortTermGoal({
  userId, 
  phase, 
  component = "short_term_goals",
  onComplete,
  height = "600px"
}: GuidedShortTermGoalProps) {
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
        content: `Hi there! 👋 Now let's create a specific short-term SMART goal that will help you progress toward your long-term goal.

Looking at what makes an excellent SMARTshort-term goal:
• Specific: 🎯 Clearly defined with exact outcomes
• Measurable: 📊 Includes metrics to track progress
• Achievable: ✅ Realistic given your current resources and constraints
• Relevant: 🔄 Directly supports your long-term learning goal
• Time-bound: ⏱️ Has a clear deadline for completion

I'll guide you through each element of a SMART goal to ensure your success.`,
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: SHORT_TERM_QUESTIONS[0].question,
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
    const questionId = SHORT_TERM_QUESTIONS[currentQuestion].id
    setResponses(prev => ({
      ...prev,
      [questionId]: userInput
    }))
    
    setUserInput("")

    // Move to next question or confirmation
    if (currentQuestion < SHORT_TERM_QUESTIONS.length - 1) {
      // More questions to ask - provide local feedback without calling Claude
      setCurrentQuestion(prev => prev + 1)
      
      // Add next question after a brief delay
      setTimeout(() => {
        const nextQuestion: Message = {
          id: uuidv4(),
          sender: "bot",
          content: SHORT_TERM_QUESTIONS[currentQuestion + 1].question,
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
          content: `Thank you for your responses! Here is your complete SMART goal:`,
          timestamp: new Date(),
          type: "confirmation"
        }
        setMessages(prev => [...prev, confirmationMessage])
      }, 500)
    }
  }

  const handleConfirmAndSubmit = async () => {
    setIsEvaluating(true)
    
    // Compile the full SMART goal
    const fullShortTermGoal = `
Specific Goal: ${responses["specific_goal"] || ""}

Action Plan: ${responses["action_plan"] || ""}

Timeline: ${responses["timeline"] || ""}
    `.trim()
    
    try {
      console.log("Sending short-term SMART goal to API:", {
        userId,
        phase,
        component,
        fullShortTermGoal
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
          message: fullShortTermGoal,
          conversation_id: conversationId,
          submission_type: "short_term_goal"
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
        content: `I encountered an error while evaluating your SMART goal: ${error.message || "Unknown error"}. Please try again or contact support if the problem persists.`,
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
      content: "Let's revise your SMART goal. Here's the first question again.",
      timestamp: new Date(),
      type: "question"
    }
    
    const firstQuestion: Message = {
      id: uuidv4(),
      sender: "bot",
      content: SHORT_TERM_QUESTIONS[0].question,
      timestamp: new Date(),
      type: "question"
    }
    
    setMessages(prev => [...prev, editMessage, firstQuestion])
    
    // Pre-fill the input with previous response
    setUserInput(responses[SHORT_TERM_QUESTIONS[0].id] || "")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendResponse()
    }
  }
  
  // Process chat message to convert markdown - simplified to only handle confirmation
  const processMessageContent = (content: string) => {
    // Special case for confirmation messages to display the SMART goal properly
    if (content.includes("Thank you for your responses! Here is your complete SMART goal")) {
      return (
        <div className="flex flex-col space-y-3">
          <div>{content}</div>
          
          <div className="bg-slate-800 rounded-md border border-purple-500/50 p-4 mt-2 space-y-4">
            <div className="space-y-2">
              <h3 className="text-purple-300 font-medium">Specific Goal:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["specific_goal"] || ""}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-purple-300 font-medium">Action Plan:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["action_plan"] || ""}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-purple-300 font-medium">Timeline:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["timeline"] || ""}
              </div>
            </div>
          </div>
          
          <div className="text-slate-300 mt-2">
            Is this your complete short-term SMART goal? If you'd like to make any changes, click "Edit Responses". Otherwise, click "Confirm & Submit" to proceed.
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
      <div className="border-l-4 border-purple-500/40 pl-3 rounded">
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
        content: `Hi there! 👋 Now let's create a specific short-term SMART goal that will help you progress toward your long-term goal.

Looking at what makes an excellent short-term goal:
• Specific: 🎯 Clearly defined with exact outcomes
• Measurable: 📊 Includes metrics to track progress
• Achievable: ✅ Realistic given your current resources and constraints
• Relevant: 🔄 Directly supports your long-term learning goal
• Time-bound: ⏱️ Has a clear deadline for completion

I'll guide you through each element of a SMART goal to ensure your success.`,
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: SHORT_TERM_QUESTIONS[0].question,
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
                Question {currentQuestion + 1} of {SHORT_TERM_QUESTIONS.length}
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
                placeholder={SHORT_TERM_QUESTIONS[currentQuestion].hint}
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
                placeholder="Ask a question about your SMART goal..."
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
                onClick={() => onComplete && onComplete("phase4/ifthen")}
                className="bg-purple-600 hover:bg-purple-500"
              >
                Next Task <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
} 
