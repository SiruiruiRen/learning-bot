"use client"

import { useState, useEffect, ReactNode } from "react"
import { motion } from "framer-motion"
import { Bot, Send, User, ArrowRight, CheckCircle, ChevronUp, ChevronDown, CheckCircle2, AlertTriangle, Info, BookOpen } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { v4 as uuidv4 } from 'uuid'
import MarkdownRenderer from "./markdown-renderer"
import { getNextPhase } from "@/lib/phase-data"
import ChatMessageParser from "@/components/chat-message-parser"

export interface Message {
  id: number
  sender: "bot" | "user"
  content: string | ReactNode
  timestamp: Date
  isTyping?: boolean
  showContinue?: boolean
  type?: "text" | "video" | "quiz" | "activity" | "feedback" | "summary" | "scaffold"
  scaffoldStep?: number
  scaffoldTotalSteps?: number
  scaffoldHint?: string
  characterLimit?: number
  agentType?: string
  next_phase?: string
  evaluationScores?: {
    overall: number
    criteria: { name: string; score: number }[]
    supportLevel: string
  }
}

interface SolBotChatProps {
  initialMessages?: Message[]
  onSendMessage?: (message: string) => void
  onContinue?: () => void
  onPhaseComplete?: (nextPhase: string) => void
  onStageChange?: (stage: string) => void
  allowInput?: boolean
  showContinueButton?: boolean
  alwaysShowContinue?: boolean
  height?: string
  children?: ReactNode
  videoComponent?: ReactNode
  quizComponent?: ReactNode
  feedbackComponent?: ReactNode
  summaryComponent?: ReactNode
  useScaffolding?: boolean
  scaffoldingSteps?: number
  maxMessageLength?: number
  userId?: string
  phase?: string  // Maps directly to backend agent phase: 'phase1', 'phase2', 'phase4', 'phase5', 'summary'
  component?: string
  useAgent?: boolean
}

export default function SolBotChat({
  initialMessages = [],
  onSendMessage,
  onContinue,
  onPhaseComplete,
  onStageChange,
  allowInput = true,
  showContinueButton = false,
  alwaysShowContinue = true,
  height = "500px",
  children,
  videoComponent,
  quizComponent,
  feedbackComponent,
  summaryComponent,
  useScaffolding = false,
  scaffoldingSteps = 1,
  maxMessageLength = 500,
  userId = "",
  phase = "intro",
  component = "general",
  useAgent = false,
}: SolBotChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [userInput, setUserInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentScaffoldStep, setCurrentScaffoldStep] = useState(1)
  const [charactersRemaining, setCharactersRemaining] = useState(maxMessageLength)
  const [conversationId, setConversationId] = useState(uuidv4())
  const [loadingText, setLoadingText] = useState("SoLBot is thinking")
  const [thinkingIntervalId, setThinkingIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [currentVisibleCard, setCurrentVisibleCard] = useState<number>(0)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  
  // Predefined responses for phase1 (static content)
  const predefinedResponses: Record<string, Record<string, string>> = {
    phase1: {
      welcome: "Welcome to Phase 1! Here I'll guide you through the basics of Self-Regulated Learning. Let's start by understanding the key principles.",
      general: "Self-Regulated Learning involves planning your learning, monitoring your progress, controlling your strategies, and reflecting on your outcomes. This cyclical process helps you become a more effective learner.",
      default: "In Phase 1, we're focusing on building your understanding of the Self-Regulated Learning framework. This knowledge will form the foundation for the rest of our journey."
    }
  }
  
  // Update characters remaining when user types
  useEffect(() => {
    setCharactersRemaining(maxMessageLength - userInput.length)
  }, [userInput, maxMessageLength])

  // Auto-scroll to bottom of chat with one-card-at-a-time visibility
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container")
    if (chatContainer) {
      // Add cards intersection observer logic
      const cards = chatContainer.querySelectorAll('.message-card')
      
      if (cards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const index = Array.from(cards).indexOf(entry.target as Element)
              setCurrentVisibleCard(index)
            }
          })
        }, {
          root: chatContainer,
          threshold: 0.7 // 70% visibility required to consider a card "visible"
        })
        
        cards.forEach(card => {
          observer.observe(card)
        })
        
        return () => {
          cards.forEach(card => {
            observer.unobserve(card)
          })
        }
      }
      
      // Conditional scrolling behavior:
      // 1. On first load: scroll to first message (if there are messages)
      // 2. When bot is thinking: scroll to bottom to show thinking animation
      // 3. Otherwise: scroll to bottom for new messages
      
      if (isFirstLoad && cards.length > 0) {
        // On first load, scroll to the first bot message
        const firstBotMessage = chatContainer.querySelector('.message-card')
        if (firstBotMessage) {
          firstBotMessage.scrollIntoView({ behavior: 'smooth', block: 'start' })
          setIsFirstLoad(false)
        }
      } else if (isTyping) {
        // When bot is thinking, scroll to view the thinking animation
        chatContainer.scrollTop = chatContainer.scrollHeight
      } else {
        // For regular messages, scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }, [messages, isTyping, isFirstLoad])

  // Add effect to make sure initial messages display properly
  useEffect(() => {
    // Only run this on component mount
    if (initialMessages.length > 0) {
      // Short delay to ensure DOM is ready
      setTimeout(() => {
        const chatContainer = document.getElementById("chat-container")
        if (chatContainer) {
          const firstMessage = chatContainer.querySelector('.message-card')
          if (firstMessage) {
            firstMessage.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }, 300)
    }
  }, []) // Empty dependency array = run once on mount
  
  // Function to scroll to next card
  const scrollToNextCard = () => {
    const chatContainer = document.getElementById("chat-container")
    const cards = chatContainer?.querySelectorAll('.message-card')
    
    if (chatContainer && cards && currentVisibleCard < cards.length - 1) {
      const nextCard = cards[currentVisibleCard + 1]
      nextCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  
  // Function to scroll to previous card
  const scrollToPrevCard = () => {
    const chatContainer = document.getElementById("chat-container")
    const cards = chatContainer?.querySelectorAll('.message-card')
    
    if (chatContainer && cards && currentVisibleCard > 0) {
      const prevCard = cards[currentVisibleCard - 1]
      prevCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Function to provide contextual responses based on phase and component
  const getContextualResponse = (phase: string, component: string): string => {
    const responses: Record<string, Record<string, string>> = {
      phase4: {
        long_term_goals: "For long-term goals, focus on aligning them with your broader career or educational aspirations. Make sure they're challenging yet achievable.",
        short_term_goals: "Short-term SMART goals should be Specific, Measurable, Achievable, Relevant, and Time-bound. Break down larger goals into manageable chunks.",
        contingency_strategies: "When creating contingency strategies, think about potential obstacles and how you might adapt your approach if things don't go as planned."
      },
      phase5: {
        general: "When monitoring your learning, regular check-ins and adjustments are key to staying on track."
      }
    };
    
    // Return phase+component specific response, or phase general, or default
    return responses[phase]?.[component] || 
           responses[phase]?.["general"] || 
           "This stage involves thoughtful planning and reflection on your learning process.";
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim()) return
    if (userInput.length > maxMessageLength) return

    // Add user message
    const newUserMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: userInput,
      timestamp: new Date(),
      scaffoldStep: useScaffolding ? currentScaffoldStep : undefined,
    }

    setMessages((prev) => [...prev, newUserMessage])
    const messageSent = userInput
    setUserInput("")
    
    // Update scaffold step if using scaffolding
    if (useScaffolding && currentScaffoldStep < scaffoldingSteps) {
      setCurrentScaffoldStep(prev => prev + 1)
    }
    
    // Scroll to show user message immediately
    setTimeout(() => {
      const chatContainer = document.getElementById("chat-container")
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 50)
    
    // For phase1, use predefined responses instead of connecting to an agent
    if (phase === 'phase1') {
      try {
        // Use the same thinking animation as the agent responses
        const intervalId = startThinkingAnimation()
        
        // Simulate a delay to make it feel more natural
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Clear the thinking animation
        clearInterval(intervalId)
        setThinkingIntervalId(null)
        
        // Remove typing indicator
        setMessages((prev) => prev.filter((msg) => !msg.isTyping))
        
        // Get predefined response based on component
        const responseText = predefinedResponses.phase1[component as keyof typeof predefinedResponses.phase1] || 
                            predefinedResponses.phase1.default;
        
        // Determine if this should show a continue button (after 3 interactions or by configuration)
        const showPhase1Continue = messages.filter(m => m.sender === "user").length >= 3;
        
        // Add bot response
        const newBotMessage: Message = {
          id: Date.now(),
          sender: "bot",
          content: responseText,
          timestamp: new Date(),
          type: "text",
          showContinue: showPhase1Continue,
          next_phase: showPhase1Continue ? "phase2" : undefined
        }
        
        setMessages((prev) => [...prev, newBotMessage])
        setIsTyping(false)
        
        // If using local handler, still call it
        if (onSendMessage) {
          onSendMessage(messageSent)
        }
        
        return
      } catch (error) {
        console.error('Error with predefined response:', error)
        // Continue to fallback handling below
      }
    }
    
    if (useAgent && userId && phase !== 'phase1') {
      // Use backend agent integration
      try {
        // Start the thinking animation and get the interval ID
        const intervalId = startThinkingAnimation()
        
        // Map front-end page name to the correct agent phase if needed
        let agentPhase = phase
        if (phase === 'intro') {
          agentPhase = 'intro' // Intro page uses intro agent
        }
        
        // Check if backend is online first
        let isBackendAlive = false
        try {
          // Quick health check to see if backend is responding
          const healthCheckController = new AbortController();
          const healthCheckTimeout = setTimeout(() => healthCheckController.abort(), 2000);
          
          const healthCheck = await fetch('/api/chat/health', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: healthCheckController.signal
          })
          
          clearTimeout(healthCheckTimeout);
          
          // If we get any response from our frontend API, that's good enough
          // Even if it returns a 503 error, it means our NextJS server is working
          isBackendAlive = true;
          console.log('Frontend API health check successful');
          
          // Only log a warning if response was not OK
          if (!healthCheck.ok) {
            console.warn(`Backend health check returned status: ${healthCheck.status}. Will proceed anyway.`);
          }
        } catch (healthError) {
          console.error('Backend health check failed:', healthError)
          isBackendAlive = false
        }
        
        // Check if backend server is running
        if (!isBackendAlive) {
          // Clear the thinking animation interval
          clearInterval(intervalId);
          setThinkingIntervalId(null)
          
          // Remove typing indicator
          setMessages((prev) => prev.filter((msg) => !msg.isTyping))
          
          // Add fallback message
          const fallbackMessage: Message = {
            id: Date.now(),
            sender: "bot",
            content: `
I encountered some network issues while trying to access my knowledge base. Let me provide some general guidance based on what I already know:

For ${phase === "phase4" ? "long-term goals" : phase}, focus on:

- Making your goals specific and measurable
- Connecting them to your personal values and aspirations
- Setting realistic timelines that challenge you appropriately

Would you like to continue with the conversation? I'll try my best to assist even with limited connectivity.
            `,
            timestamp: new Date(),
            type: "text",
            // Don't show continue button as we want them to interact
          }
          
          setMessages(prev => [...prev, fallbackMessage])
          
          // Continue with user interaction despite backend issues
          return;
        }
        
        // Make API call to agent with retry logic
        console.log(`Sending message to agent: phase=${agentPhase}, component=${component}`)
        
        // Setup timeout for main API call
        const apiController = new AbortController();
        
        // Create a more resilient timeout that doesn't abort prematurely
        let apiTimeoutId: ReturnType<typeof setTimeout>;
        try {
          // Set a reasonable timeout but don't explicitly abort
          // This prevents AbortError: signal is aborted without reason
          apiTimeoutId = setTimeout(() => {
            console.log("API request is taking a long time, but continuing to wait...");
          }, 20000); // 20 second timeout for warning only
          
          let response;
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount <= maxRetries) {
            try {
              response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: userId,
                  phase: agentPhase,
                  component: component,
                  message: messageSent,
                  conversation_id: conversationId
                }),
                signal: apiController.signal
              });
              
              if (response.ok) {
                break; // Success, exit retry loop
              } else {
                // If response is not OK, increment retry count
                retryCount++;
                if (retryCount <= maxRetries) {
                  console.log(`Retrying request (${retryCount}/${maxRetries})...`);
                  // Wait a bit before retrying (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                } else {
                  throw new Error(`Failed after ${maxRetries} retries`);
                }
              }
            } catch (error) {
              // Only retry on network errors, not on aborts or other errors
              if (error instanceof Error && error.name !== 'AbortError') {
                retryCount++;
                if (retryCount <= maxRetries) {
                  console.log(`Network error, retrying (${retryCount}/${maxRetries})...`);
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                } else {
                  throw error; // Re-throw if max retries reached
                }
              } else if (error instanceof Error && error.name === 'AbortError') {
                console.warn('Request aborted due to timeout or user action');
                // Handle abort errors gracefully - provide partial response instead of failing
                const fallbackResponse = {
                  ok: true,
                  status: 200,
                  json: async () => ({
                    success: true,
                    data: {
                      message: `I'm still working on a comprehensive response to your question about ${messageSent.substring(0, 30)}...

Let me give you some initial thoughts while I continue processing:

${getContextualResponse(phase, component)}

Let me know if you have any specific questions about this topic!`,
                      phase: phase,
                      component: component,
                      agent_type: phase,
                      scaffolding_level: 2,
                      timestamp: new Date().toISOString(),
                      conversation_id: conversationId,
                      user_id: userId
                    }
                  })
                };
                
                // Use our fallback response instead of failing
                response = fallbackResponse;
                break; // Exit retry loop with fallback response
              } else {
                throw error; // Re-throw immediately for other errors
              }
            }
          }
          
          // Clear any timeout
          clearTimeout(apiTimeoutId);
          
          // Clear the thinking animation interval
          clearInterval(intervalId)
          setThinkingIntervalId(null)
          
          // Remove typing indicator
          setMessages((prev) => prev.filter((msg) => !msg.isTyping))
          
          // Check if response is undefined after all retries
          if (!response) {
            throw new Error("Failed to get a response from the server after retries");
          }
          
          if (!response.ok) {
            let errorText = "";
            
            // Handle different response types (our fallback response vs. actual fetch Response)
            if ('text' in response) {
              try {
                errorText = await (response as Response).text();
              } catch (textError) {
                errorText = "Could not read error details";
              }
            }
            
            throw new Error(`Failed to get response from agent (HTTP ${response.status}): ${errorText}`);
          }
          
          let responseData
          try {
            // Safely parse JSON response
            const data = await response.json()
            // Normalize the response format to handle both wrapped and unwrapped responses
            
            console.log('Raw API response:', JSON.stringify(data, null, 2))
            
            // Handle successful responses with data wrapper
            if (data.success === true && data.data) {
              responseData = data.data
            } else {
              // Fallback to the response as is
              responseData = data
            }
            
            console.log('Normalized agent response:', responseData)
            
            if (!responseData || typeof responseData !== 'object') {
              console.error('Invalid response format:', responseData)
              throw new Error(`Invalid response format: ${JSON.stringify(responseData)}`)
            }
            
            if (!responseData.message && responseData.error) {
              throw new Error(responseData.error)
            }
          } catch (parseError: unknown) {
            console.error('JSON parsing error:', parseError)
            throw new Error(`Error parsing agent response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
          }
          
          // Add bot response
          const newBotMessage: Message = {
            id: Date.now(),
            sender: "bot",
            content: responseData.message || "I'm sorry, I'm having trouble generating a response.",
            timestamp: new Date(),
            type: "text",
            showContinue: alwaysShowContinue || (responseData.next_phase && responseData.next_phase !== phase),
            next_phase: responseData.next_phase || getNextPhaseInSequence(phase)
          }
          
          setMessages((prev) => [...prev, newBotMessage])
          
          // Add handling for intro stage transitions
          if (phase === 'intro' && responseData.next_intro_stage && onStageChange) {
            onStageChange(responseData.next_intro_stage)
          }
          
          setIsTyping(false)
        } catch (error) {
          console.error('Error communicating with agent:', error)
          
          // Clear any ongoing animation interval
          if (thinkingIntervalId) {
            clearInterval(thinkingIntervalId)
            setThinkingIntervalId(null)
          }
          
          // Remove typing indicator
          setMessages((prev) => prev.filter((msg) => !msg.isTyping))
          
          // Add a friendly error message with visual styling
          const errorMessage: Message = {
            id: Date.now(),
            sender: "bot",
            content: `
## Connection Issue 🔌

I'm currently having trouble connecting to my knowledge base. 

### What you can do:
- Make sure the backend service is running
- Try refreshing the page
- Check your internet connection

For assistance, you can:
1. Run the backend service if it's not already running
2. Contact technical support if the issue persists

*Your patience is appreciated while I reconnect.*
            `,
            timestamp: new Date(),
            type: "text"
          }
          
          setMessages(prev => [...prev, errorMessage])
          setIsTyping(false)
          
          // Fallback to local handler if available
          if (onSendMessage) {
            onSendMessage(messageSent)
          }
        }
      } catch (error) {
        console.error('Error communicating with agent:', error)
        
        // Clear any ongoing animation interval
        if (thinkingIntervalId) {
          clearInterval(thinkingIntervalId)
          setThinkingIntervalId(null)
        }
        
        // Remove typing indicator
        setMessages((prev) => prev.filter((msg) => !msg.isTyping))
        
        // Add a friendly error message with visual styling
        const errorMessage: Message = {
          id: Date.now(),
          sender: "bot",
          content: `
## Connection Issue 🔌

I'm currently having trouble connecting to my knowledge base. 

### What you can do:
- Make sure the backend service is running
- Try refreshing the page
- Check your internet connection

For assistance, you can:
1. Run the backend service if it's not already running
2. Contact technical support if the issue persists

*Your patience is appreciated while I reconnect.*
          `,
          timestamp: new Date(),
          type: "text"
        }
        
        setMessages(prev => [...prev, errorMessage])
        setIsTyping(false)
        
        // Fallback to local handler if available
        if (onSendMessage) {
          onSendMessage(messageSent)
        }
      }
    } else if (onSendMessage) {
      // Use local handler if not using agent integration
      onSendMessage(messageSent)
    }
  }

  // Function to clean message content - strip evaluation scores and support levels
  const cleanMessageContent = (content: string): string => {
    if (!content || typeof content !== 'string') return content;

    // Remove anything in square brackets that contains evaluation information
    const patterns = [
      /\[(?:Note|Evaluation):[^\]]+\]/g,
      /\[.*?(?:score|Score|evaluation|Evaluation|support level|SUPPORT).*?\]/g, 
      /\[\s*(?:Alignment|Timeframe|Measurability|Overall Score|Average Score).*?\]/g,
      /\[.*?(?:HIGH|MEDIUM|LOW)\s+support.*?\]/gi
    ];

    let cleanedContent = content;
    patterns.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, '');
    });

    return cleanedContent.trim();
  }

  // Helper function to generate progress bars for scores
  const getProgressBar = (score: number): string => {
    // Create a visual progress bar
    let bar = "";
    const fullColor = score < 1.2 ? "🔴" : score < 2.2 ? "🟠" : "🟢";
    const emptyColor = "⚪";
    
    // Convert score to filled circles (max 3)
    const filled = Math.round(score);
    const empty = 3 - filled;
    
    bar = fullColor.repeat(filled) + emptyColor.repeat(empty);
    
    return bar;
  }
  
  // Helper function to get improvement tips for each criterion
  const getImprovementTip = (criterion: string, score: number): string => {
    // Default general tips
    if (criterion === "Specificity") {
      if (score <= 1) return "Define concrete learning objectives with measurable outcomes";
      if (score <= 2) return "Add timeframes and specific topics to your goals";
      return "Your goals are well-defined and specific";
    }
    
    if (criterion === "Knowledge Alignment") {
      if (score <= 1) return "Connect goals to your current knowledge level and background";
      if (score <= 2) return "Identify knowledge gaps and prerequisites more clearly";
      return "Your goals align well with your knowledge background";
    }
    
    if (criterion === "Resource Planning") {
      if (score <= 1) return "Identify specific materials, tools and mentors you'll need";
      if (score <= 2) return "Create a structured resource roadmap with alternatives";
      return "Your resource planning is comprehensive";
    }
    
    return "";
  }
  
  // Helper function to generate motivational messages based on support level
  const getSupportMessage = (supportLevel: string, score: number): string => {
    if (supportLevel === "HIGH") {
      return `> 💪 **Opportunity for Growth**: You're at the beginning of your learning journey! With more specific goals and resource planning, you'll see rapid improvement. What specific aspect would you like to clarify first?`;
    } else if (supportLevel === "MEDIUM") {
      return `> 🌱 **Building Momentum**: You're making good progress! With some refinement of your learning objectives and resources, you'll be well on your way to mastery. What specific element would you like to strengthen next?`;
    } else {
      return `> 🌟 **Strong Foundation**: Excellent work structuring your learning approach! You have well-defined objectives and resources. Let's focus on optimizing your learning strategy for even better results!`;
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const addBotMessage = (
    content: string | ReactNode, 
    type: "text" | "video" | "quiz" | "activity" | "feedback" | "summary" | "scaffold" = "text",
    showContinue = false,
    scaffoldOptions?: {
      step?: number,
      totalSteps?: number,
      hint?: string,
      characterLimit?: number
    }
  ) => {
    const newMessage: Message = {
      id: Date.now(),
      sender: "bot",
      content,
      timestamp: new Date(),
      type,
      showContinue: alwaysShowContinue || showContinue,
      scaffoldStep: scaffoldOptions?.step,
      scaffoldTotalSteps: scaffoldOptions?.totalSteps,
      scaffoldHint: scaffoldOptions?.hint,
      characterLimit: scaffoldOptions?.characterLimit,
      next_phase: getNextPhaseInSequence(phase)
    }
    
    setMessages(prev => [...prev, newMessage])
  }

  const simulateBotTyping = (callback: () => void) => {
    setIsTyping(true)

    // Add typing indicator
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "bot",
        content: "typing...",
        isTyping: true,
        timestamp: new Date(),
      },
    ])

    // Simulate typing delay
    setTimeout(() => {
      // Remove typing indicator
      setMessages((prev) => prev.filter((msg) => !msg.isTyping))

      // Execute callback
      callback()

      setIsTyping(false)
    }, 1500)
  }

  const startThinkingAnimation = () => {
    setIsTyping(true)
    let count = 0
    
    // Base thinking texts that apply to all phases
    const baseThinkingTexts = [
      "SoLBot is thinking"
    ]
    
    // Phase-specific thinking texts
    const phaseThinkingTexts: Record<string, string[]> = {
      intro: [
        "Getting to know you better",
        "Preparing your learning journey",
        "Customizing my approach for you"
      ],
      phase1: [
        "Reviewing motivation factors",
        "Considering your learning goals",
        "Preparing goal alignment response"
      ],
      phase2: [
        "Analyzing learning objectives",
        "Evaluating resource selection",
        "Applying appropriate scaffolding"
      ],
      phase4: [
        "Assessing goal-setting strategy",
        "Considering time management approach",
        "Evaluating planning effectiveness"
      ],
      phase5: [
        "Analyzing reflection depth",
        "Considering improvement strategies",
        "Evaluating learning transfer"
      ],
      summary: [
        "Synthesizing learning journey",
        "Preparing comprehensive summary",
        "Connecting learning milestones"
      ]
    }
    
    // Combine base texts with phase-specific texts
    const phaseTexts = phaseThinkingTexts[phase] || phaseThinkingTexts.intro
    const thinkingTexts = [...baseThinkingTexts, ...phaseTexts, "Almost ready"]
    
    // Add typing indicator with initial message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "bot",
        content: thinkingTexts[0],
        isTyping: true,
        timestamp: new Date(),
      },
    ])
    
    // Ensure we scroll to the thinking indicator after it's added
    setTimeout(() => {
      const chatContainer = document.getElementById("chat-container")
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 50)
    
    // Update the message every 2 seconds with a new thinking text
    const intervalId = setInterval(() => {
      count = (count + 1) % thinkingTexts.length
      setLoadingText(thinkingTexts[count])
      
      // Update the typing indicator message
      setMessages((prev) => 
        prev.map(msg => 
          msg.isTyping 
            ? { ...msg, content: thinkingTexts[count] } 
            : msg
        )
      )
    }, 2000)
    
    // Store interval ID for later cleanup
    setThinkingIntervalId(intervalId)
    
    return intervalId
  }

  // Add this helper function to aid with streaming simulation
  const updateThinkingMessage = (content: string) => {
    if (!isTyping) return
    
    setMessages((prev) => 
      prev.map(msg => 
        msg.isTyping 
          ? { ...msg, content } 
          : msg
      )
    )
  }

  // Helper function to determine the next phase in the sequence
  // Phase sequence: intro -> phase1 -> phase2 -> phase3 -> phase4 -> phase5 -> phase6 -> summary
  const getNextPhaseInSequence = (currentPhase: string) => {
    // For Phase 4, handle task navigation within the phase
    if (currentPhase === "phase4") {
      if (component === "long_term_goals") {
        return "short_term_goals"; // Navigate to short term goals task
      } else if (component === "short_term_goals") {
        return "contingency_strategies"; // Navigate to contingency strategies task
      } else if (component === "contingency_strategies") {
        return "phase5"; // Navigate to next phase after completing all tasks
      }
    }
    
    // Default phase sequence logic
    const phaseSequence = ["intro", "phase1", "phase2", "phase3", "phase4", "phase5", "phase6", "summary"];
    const currentIndex = phaseSequence.indexOf(currentPhase);
    
    if (currentIndex === -1 || currentIndex === phaseSequence.length - 1) {
      return "summary"; // Default to summary if not found or if it's the last phase
    }
    
    return phaseSequence[currentIndex + 1];
  };

  // Format message with preprocessing for Claude's headlines
  const formatStructuredMessage = (content: string) => {
    if (!content || typeof content !== 'string') return <MarkdownRenderer content={content} />;
    
    try {
      // Log the content we're trying to format for debugging
      console.log("Content being formatted:", content);

      // Split content into sections based on known section markers
      // This regex matches common section patterns with any emoji, formatting variations
      const assessmentRegex = /(\n|^).*?\b(Assessment|Looking at your learning objective|Looking at your.*?goal|Looking at your SMART goal|Looking at your monitoring|Looking at your implementation intentions)\b.*?(\n|$)/i;
      const guidanceRegex = /(\n|^).*?\b(Guidance|Let['']s develop this|Since we['']re starting|Given this|Template for|Here['']s a template)\b.*?(\n|$)/i;
      const nextStepsRegex = /(\n|^).*?\b(Next Steps|Please revise|Next, try to|What specific|Remember[\s,]|Consider:)\b.*?(\n|$)/i;
      
      // Find the indices of section markers
      const assessmentMatch = content.match(assessmentRegex);
      const guidanceMatch = content.match(guidanceRegex);
      const nextStepsMatch = content.match(nextStepsRegex);
      
      // Initialize section content
      let preambleContent = "";
      let assessmentContent = "";
      let guidanceContent = "";
      let nextStepsContent = "";
      
      // Extract each section content based on matches
      if (assessmentMatch && assessmentMatch.index !== undefined) {
        // Everything before assessment is preamble
        preambleContent = content.substring(0, assessmentMatch.index).trim();
        
        const assessmentStart = assessmentMatch.index + assessmentMatch[0].length;
        
        // If guidance exists, assessment ends there, otherwise check for next steps
        if (guidanceMatch && guidanceMatch.index !== undefined) {
          assessmentContent = content.substring(assessmentStart, guidanceMatch.index).trim();
          
          const guidanceStart = guidanceMatch.index + guidanceMatch[0].length;
          
          // If next steps exists, guidance ends there, otherwise to the end
          if (nextStepsMatch && nextStepsMatch.index !== undefined) {
            guidanceContent = content.substring(guidanceStart, nextStepsMatch.index).trim();
            nextStepsContent = content.substring(nextStepsMatch.index + nextStepsMatch[0].length).trim();
          } else {
            guidanceContent = content.substring(guidanceStart).trim();
          }
        } 
        // No guidance section found
        else if (nextStepsMatch && nextStepsMatch.index !== undefined) {
          assessmentContent = content.substring(assessmentStart, nextStepsMatch.index).trim();
          nextStepsContent = content.substring(nextStepsMatch.index + nextStepsMatch[0].length).trim();
        } else {
          assessmentContent = content.substring(assessmentStart).trim();
        }
      }
      // No assessment found but guidance exists
      else if (guidanceMatch && guidanceMatch.index !== undefined) {
        preambleContent = content.substring(0, guidanceMatch.index).trim();
        
        const guidanceStart = guidanceMatch.index + guidanceMatch[0].length;
        
        if (nextStepsMatch && nextStepsMatch.index !== undefined) {
          guidanceContent = content.substring(guidanceStart, nextStepsMatch.index).trim();
          nextStepsContent = content.substring(nextStepsMatch.index + nextStepsMatch[0].length).trim();
        } else {
          guidanceContent = content.substring(guidanceStart).trim();
        }
      }
      // Only next steps exists
      else if (nextStepsMatch && nextStepsMatch.index !== undefined) {
        preambleContent = content.substring(0, nextStepsMatch.index).trim();
        nextStepsContent = content.substring(nextStepsMatch.index + nextStepsMatch[0].length).trim();
      }
      // No sections found
      else {
        console.log("No sections detected, rendering as normal markdown");
        return <MarkdownRenderer content={content} />;
      }
      
      // Extract section headers for display
      const assessmentHeader = assessmentMatch?.[0]?.trim() || "Assessment";
      const guidanceHeader = guidanceMatch?.[0]?.trim() || "Guidance";
      const nextStepsHeader = nextStepsMatch?.[0]?.trim() || "Next Steps";
      
      console.log("Section headers extracted:", {
        assessment: assessmentHeader,
        guidance: guidanceHeader,
        nextSteps: nextStepsHeader
      });
      
      // Debug the sections detected
      console.log("Sections detected:", {
        preamble: preambleContent?.substring(0, 50) + "...",
        assessment: assessmentContent?.substring(0, 50) + "...",
        guidance: guidanceContent?.substring(0, 50) + "...",
        nextSteps: nextStepsContent?.substring(0, 50) + "..."
      });
      
      // Return a styled component with each section properly colored and formatted
      return (
        <div className="formatted-message space-y-5">
          {preambleContent && (
            <div className="text-teal-300">
              <MarkdownRenderer content={preambleContent} />
            </div>
          )}
          
          {(assessmentContent || assessmentHeader) && (
            <div className="mt-4">
              <div className="border-l-4 border-amber-500/70 pl-3 py-2 pb-3 bg-slate-800/30 rounded-md">
                {assessmentHeader && (
                  <div className="text-amber-400 font-medium text-lg mb-2">
                    {assessmentHeader.replace(/Looking at your.*?:/i, "Assessment").replace(/^.*?(Assessment).*?$/i, "$1")}
                  </div>
                )}
                <MarkdownRenderer content={assessmentContent} />
              </div>
            </div>
          )}
          
          {(guidanceContent || guidanceHeader) && (
            <div className="mt-4">
              <div className="border-l-4 border-teal-500/70 pl-3 py-2 pb-3 bg-slate-800/30 rounded-md">
                {guidanceHeader && (
                  <div className="text-teal-400 font-medium text-lg mb-2">
                    {guidanceHeader.replace(/Let['']s develop this.*/i, "Guidance").replace(/^.*?(Guidance).*?$/i, "$1").replace(/Since we['']re starting.*/i, "Guidance")}
                  </div>
                )}
                <MarkdownRenderer content={guidanceContent} />
              </div>
            </div>
          )}
          
          {(nextStepsContent || nextStepsHeader) && (
            <div className="mt-4">
              <div className="border-l-4 border-blue-500/70 pl-3 py-2 pb-3 bg-slate-800/30 rounded-md">
                {nextStepsHeader && (
                  <div className="text-blue-400 font-medium text-lg mb-2">
                    {nextStepsHeader.replace(/Please revise.*/i, "Next Steps").replace(/^.*?(Next Steps).*?$/i, "$1")}
                  </div>
                )}
                <MarkdownRenderer content={nextStepsContent} />
              </div>
            </div>
          )}
        </div>
      );
      
    } catch (error) {
      console.error('Error formatting structured message:', error);
      // Return original content if formatting fails
      return <MarkdownRenderer content={content} />;
    }
  };

  // Add a debugging utility to detect when we're in Phase 2
  useEffect(() => {
    if (phase === "phase2" || (typeof phase === 'string' && phase.includes("phase2"))) {
      console.log("Currently in Phase 2 - TaskAnalysis & ResourceIdentification", { phase });
    }
  }, [phase]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div
        id="chat-container"
        className="flex-1 overflow-y-auto p-4 space-y-4 relative mx-auto w-full max-w-4xl"
        style={{ height: height, maxHeight: height }}
      >
        {messages.map((message, index) => {
          // Skip typing indicators
          if (message.isTyping) {
            return (
              <div key={message.id} className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full mr-2 bg-teal-900/50 animate-glow">
                  <Bot className="h-5 w-5 text-teal-400" />
                </div>
                <div className="p-4 bg-slate-800/80 border border-teal-500/30 rounded-lg w-[80%] max-w-[80%] shadow-lg animate-pulse-slow">
                  <div className="text-sm text-white/90 mb-3 flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 mr-2">
                      <svg className="animate-spin w-5 h-5 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <span className="mr-2 font-medium bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300 animate-shimmer">{loadingText}</span>
                  </div>
                  
                  {/* Beautiful gradient progress bar with smooth movement */}
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3 p-0.5">
                    <div className="h-full rounded-full animate-progress-pulse"></div>
                  </div>
                  
                  {/* Enhanced neural network visualization */}
                  <div className="flex justify-center items-center gap-1.5 mt-3 py-1 bg-slate-800/80 rounded-full">
                    {[...Array(7)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-300"
                        style={{ 
                          animation: `pulseDelayed 1.5s ease-in-out ${i * 0.12}s infinite`,
                          opacity: 0.5 + (i * 0.05)
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Neural connection lines */}
                  <div className="flex justify-between py-1 mt-2 px-3">
                    <div className="flex flex-col space-y-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-0.5 bg-teal-500/20 rounded-full animate-shimmer"></div>
                      ))}
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-0.5 bg-cyan-500/20 rounded-full animate-shimmer" 
                             style={{ animationDelay: `${i * 0.2}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "items-start"} message-card`}
              style={{scrollMarginTop: '1rem'}}
            >
              {message.sender === "bot" && (
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full mr-2 bg-teal-900/50">
                  <Bot className="h-5 w-5 text-teal-400" />
                </div>
              )}

              <div className={`${message.sender === "bot" ? "max-w-[80%]" : "max-w-[75%]"}`}>
                <div className={`p-2.5 rounded-lg ${message.sender === "bot" ? "bg-slate-800/80 border border-teal-500/20" : "bg-purple-900/30 border border-purple-500/30 text-sm"}`}>
                  {typeof message.content === "string" ? (
                    message.type === "text" || !message.type ? (
                      <div className={`${message.sender === "bot" ? "text-white/90" : "text-white/90 text-sm leading-tight"}`}>
                        {message.sender === "bot" ? (
                          // Apply structured formatting to ALL bot messages
                          formatStructuredMessage(message.content)
                        ) : (
                          <MarkdownRenderer content={message.content} className={message.sender === "user" ? "extra-compact" : ""} />
                        )}
                        
                        {/* Conditional Scaffold Step Indicator */}
                        {message.scaffoldStep && message.scaffoldTotalSteps && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <div className="flex items-center justify-between text-xs text-white/60">
                              <span>Step {message.scaffoldStep} of {message.scaffoldTotalSteps}</span>
                              {message.scaffoldHint && (
                                <span className="text-teal-400">{message.scaffoldHint}</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Character limit indicator */}
                        {message.characterLimit && (
                          <div className="mt-2 text-xs text-white/50">
                            Character limit: {message.characterLimit}
                          </div>
                        )}
                        
                        {/* Evaluation components - only when needed */}
                        {message.evaluationScores && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.5 }}
                            className="mt-4 pt-3 border-t border-slate-700/50"
                          >
                            <div className="space-y-2">
                              {/* Score Progress */}
                              {message.evaluationScores.overall && (
                                <div>
                                  <div className="flex justify-between text-xs text-white/60 mb-1">
                                    <span>Overall Quality</span>
                                    <span>{message.evaluationScores.overall.toFixed(1)}/3.0</span>
                                  </div>
                                  <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden w-full">
                                    <div
                                      className={`absolute top-0 left-0 bottom-0 ${getProgressBar(message.evaluationScores.overall)}`}
                                      style={{ width: `${(message.evaluationScores.overall / 3) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Improvement Tips */}
                              {message.evaluationScores.criteria && message.evaluationScores.criteria.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-700/30 text-xs text-white/60">
                                  <p className="font-medium mb-1">Improvement focus:</p>
                                  <ul className="space-y-1">
                                    {message.evaluationScores.criteria.map((criterion, idx) => (
                                      <li key={idx} className="flex gap-2">
                                        <span className="text-teal-400">{criterion.name}:</span>
                                        <span>{getImprovementTip(criterion.name, criterion.score)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Support Level Indicator */}
                              {message.evaluationScores.supportLevel && (
                                <div className="mt-2 pt-2 border-t border-slate-700/30 text-xs">
                                  <p className="text-white/60 font-medium mb-1">Current support level:</p>
                                  <p className="text-teal-400">{getSupportMessage(message.evaluationScores.supportLevel, message.evaluationScores.overall || 2)}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      // Handle other message types (video, scaffold, etc.)
                      <div>
                        {message.type === "video" && videoComponent}
                        {message.type === "quiz" && quizComponent}
                        {message.type === "feedback" && feedbackComponent}
                        {message.type === "summary" && summaryComponent}
                      </div>
                    )
                  ) : (
                    <div>{message.content}</div>
                  )}
                </div>
                <div className={`text-xs mt-0.5 opacity-50 ${message.sender === "user" ? "text-right" : ""}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {message.sender === "user" && (
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ml-2 bg-purple-900/50">
                  <User className="h-4 w-4 text-purple-400" />
                </div>
              )}
            </motion.div>
          );
        })}

        {children}
      </div>
      
      {/* User Input */}
      {allowInput && (
        <div className="p-4 border-t border-slate-700/50 bg-gray-900/70 rounded-b-lg sticky bottom-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-800/80 border-slate-700 focus:border-teal-500/50 placeholder-white/30 text-white resize-none py-3 pr-20"
                rows={2}
                maxLength={maxMessageLength + 10} // Add a little buffer
              />
              <div className={`absolute bottom-2 right-2 text-xs ${charactersRemaining < 50 ? 'text-red-400' : 'text-white/50'}`}>
                {charactersRemaining}
              </div>
            </div>
            <Button
              disabled={!userInput.trim() || userInput.length > maxMessageLength}
              onClick={handleSendMessage}
              className={`px-4 h-10 flex-shrink-0 ${!userInput.trim() || userInput.length > maxMessageLength ? 'opacity-50 cursor-not-allowed' : ''} bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white`}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Continue Button (for phases that need it at the bottom) */}
      {showContinueButton && (
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/90 flex justify-center">
          <Button
            onClick={() => onContinue && onContinue()}
            className="px-8 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
          >
            Next Phase <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
} 