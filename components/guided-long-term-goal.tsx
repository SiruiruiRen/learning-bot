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

interface GuidedLongTermGoalProps {
  userId: string
  phase: string
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const LONGTERM_QUESTIONS = [
  {
    id: "specific_goal",
    question: "What meaningful goal would you like to accomplish by applying what you're learning in this course?",
    hint: "Choose a specific, achievable goal that connects to the course material. This could be mastering a particular concept, completing a project, or applying your knowledge in a real-world situation. "
  },
  {
    id: "goal_orientation",
    question: "How does this goal connect to your personal story and future aspirations?",
    hint: "Reflect on why this goal matters specifically to you. How does it align with your values or interests? Consider how accomplishing this goal fits into your broader life journey and who you're becoming."
  },
  {
    id: "visualization",
    question: "Take a moment to indulge in how it would feel to achieve this goal. Why would achieving this goal be so satisfying? Elaborate on what it would feel like to achieve this goal. Imagine the relevant events and experiences as vividly as possible.",
    hint: "Paint a detailed mental picture of your success: Where are you? What are you doing with your new knowledge or skills? Notice the emotions you experience—pride, relief, excitement. Consider both the practical benefits and how this achievement might change how you see yourself."
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
  "Long-term goals give direction to your learning journey...",
  "Goals aligned with personal values enhance motivation...",
  "Mastery-oriented goals lead to deeper understanding...",
  "Visualization helps make abstract goals concrete...",
  "Clear goals help you select effective learning strategies...",
  "Meaningful goals sustain effort during challenges..."
]

export default function GuidedLongTermGoal({
  userId, 
  phase, 
  component = "long_term_goals",
  onComplete,
  height = "600px"
}: GuidedLongTermGoalProps) {
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
        content: `Hi there! 👋 Let's define your long-term learning goal through vivid visualization.

Creating powerful learning goals involves three key elements:
• Goal Clarity: ✨ Clearly defined outcomes with specific, measurable achievements
• Identity Connection: 🧠 How this knowledge becomes part of who you are and transforms you
• Sensory Visualization: 🌈 Creating mental movies with rich details you can see, hear, and feel

I'll guide you to create a compelling mental image of your success that will motivate and direct your learning journey.`,
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: LONGTERM_QUESTIONS[0].question,
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
    const questionId = LONGTERM_QUESTIONS[currentQuestion].id
    setResponses(prev => ({
      ...prev,
      [questionId]: userInput
    }))
    
    setUserInput("")

    // Move to next question or confirmation
    if (currentQuestion < LONGTERM_QUESTIONS.length - 1) {
      // More questions to ask - provide local feedback without calling Claude
      setCurrentQuestion(prev => prev + 1)
      
      // Add next question after a brief delay
      setTimeout(() => {
        const nextQuestion: Message = {
          id: uuidv4(),
          sender: "bot",
          content: LONGTERM_QUESTIONS[currentQuestion + 1].question,
          timestamp: new Date(),
          type: "question"
        }
        setMessages(prev => [...prev, nextQuestion])
      }, 500)
    } else {
      // All questions answered, move to confirmation
      setIsConfirming(true)
      
      // Add confirmation message with separate answers clearly shown
      setTimeout(() => {
        const confirmationMessage: Message = {
          id: uuidv4(),
          sender: "bot",
          content: `Thank you for your thoughtful responses! Here is your complete long-term learning goal:`,
          timestamp: new Date(),
          type: "confirmation"
        }
        setMessages(prev => [...prev, confirmationMessage])
      }, 500)
    }
  }

  const handleConfirmAndSubmit = async () => {
    setIsEvaluating(true)
    
    // If the visualization response isn't saved yet but we're on the last question,
    // make sure to save the most recent user input as the visualization response
    if (!responses["visualization"] && currentQuestion === LONGTERM_QUESTIONS.length - 1) {
      setResponses(prev => ({
        ...prev,
        ["visualization"]: userInput
      }));
    }
    
    // Compile the full learning objective
    const fullLongTermGoal = `
Specific Goal: ${responses["specific_goal"] || ""}

Goal Orientation: ${responses["goal_orientation"] || ""}

Visualization: ${responses["visualization"] || ""}
    `.trim()
    
    try {
      console.log("Sending long-term goal to API:", {
        userId,
        phase,
        component,
        fullLongTermGoal
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
          message: fullLongTermGoal,
          conversation_id: conversationId,
          submission_type: "long_term_goal"
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
        content: `I encountered an error while evaluating your long-term goal: ${error.message || "Unknown error"}. Please try again or contact support if the problem persists.`,
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
      content: "Let's revise your long-term goal. Here's the first question again.",
      timestamp: new Date(),
      type: "question"
    }
    
    const firstQuestion: Message = {
      id: uuidv4(),
      sender: "bot",
      content: LONGTERM_QUESTIONS[0].question,
      timestamp: new Date(),
      type: "question"
    }
    
    setMessages(prev => [...prev, editMessage, firstQuestion])
    
    // Pre-fill the input with previous response
    setUserInput(responses[LONGTERM_QUESTIONS[0].id] || "")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendResponse()
    }
  }
  
  // Process chat message to convert markdown - simplified to only handle confirmation
  const processMessageContent = (content: string) => {
    // Special case for confirmation messages to display the goal properly
    if (content.includes("Thank you for your thoughtful responses! Here is your complete long-term learning goal")) {
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
              <h3 className="text-purple-300 font-medium">Goal Orientation:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["goal_orientation"] || ""}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-purple-300 font-medium">Visualization:</h3>
              <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
                {responses["visualization"] || ""}
              </div>
            </div>
          </div>
          
          <div className="text-slate-300 mt-2">
            Is this your complete long-term goal? If you'd like to make any changes, click "Edit Responses". Otherwise, click "Confirm & Submit" to proceed.
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
        content: `Hi there! 👋 Let's define your long-term learning goal through vivid visualization.

Creating powerful learning goals involves three key elements:
• Goal Clarity: ✨ Clearly defined outcomes with specific, measurable achievements
• Identity Connection: 🧠 How this knowledge becomes part of who you are and transforms you
• Sensory Visualization: 🌈 Creating mental movies with rich details you can see, hear, and feel

I'll guide you to create a compelling mental image of your success that will motivate and direct your learning journey.`,
        timestamp: new Date(),
        type: "question"
      },
      {
        id: uuidv4(),
        sender: "bot",
        content: LONGTERM_QUESTIONS[0].question,
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

  // Simple function to create a styled section
  const createSection = (title: string, content: string, borderColor: string) => {
    return content ? (
      <div className={`border-l-2 border-${borderColor}-500 pl-3 py-2 bg-slate-800/30 rounded-md my-2`}>
        <div className="font-medium text-lg mb-2 text-${borderColor}-400">{title}</div>
        <div className="whitespace-pre-wrap"><MarkdownRenderer content={content} /></div>
      </div>
    ) : null;
  };

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
                Question {currentQuestion + 1} of {LONGTERM_QUESTIONS.length}
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
                placeholder={LONGTERM_QUESTIONS[currentQuestion].hint}
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
                placeholder="Describe more details about how you visualize achieving your goal..."
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
                onClick={() => onComplete && onComplete("phase2/smart")}
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