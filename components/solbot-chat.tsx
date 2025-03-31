"use client"

import { useState, useEffect, ReactNode } from "react"
import { motion } from "framer-motion"
import { Bot, Send, User, ArrowRight, CheckCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { v4 as uuidv4 } from 'uuid'
import MarkdownRenderer from "@/components/markdown-renderer"
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container")
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

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
          setThinkingIntervalId(null);
          
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
                  userId: userId,
                  phase: agentPhase,
                  component: component,
                  message: messageSent,
                  conversationId: conversationId
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
            
            console.log('Raw API response:', data)
            
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

    // Check if we need to enhance evaluation section
    if (content.includes("Specificity:") || content.includes("Knowledge Alignment:") || content.includes("Resource Planning:")) {
      // Find evaluation section and replace with enhanced version
      const sections = content.split(/\n\n|##/);
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // If this is the evaluation section with scores
        if ((section.includes("Specificity:") || section.includes("specificity:")) && 
            (section.includes("Knowledge Alignment:") || section.includes("knowledge alignment:") || section.includes("Resource Planning:"))) {
          
          // Extract scores (assuming they're in the format "Score: X" or "Score: X (comment)")
          const specificityMatch = section.match(/Specificity:\s*(\d+)/i);
          const knowledgeMatch = section.match(/Knowledge\s+Alignment:\s*(\d+)/i);
          const resourceMatch = section.match(/Resource\s+Planning:\s*(\d+)/i);
          
          const specificityScore = specificityMatch ? parseInt(specificityMatch[1]) : 0;
          const knowledgeScore = knowledgeMatch ? parseInt(knowledgeMatch[1]) : 0;
          const resourceScore = resourceMatch ? parseInt(resourceMatch[1]) : 0;
          
          const avgScore = ((specificityScore + knowledgeScore + resourceScore) / 3).toFixed(1);
          const avgScoreNum = parseFloat(avgScore);
          const supportLevel = avgScoreNum < 1.5 ? "HIGH" : avgScoreNum < 2.5 ? "MEDIUM" : "LOW";
          
          // Create enhanced evaluation HTML with color coding and progress bars
          const enhancedEvaluation = `
## 📊 Learning Progress Evaluation

| Criteria | Score | Feedback | How to Improve |
|----------|-------|----------|---------------|
| **Specificity** | \`${specificityScore}/3\` | ${getProgressBar(specificityScore)} | ${getImprovementTip("Specificity", specificityScore)} |
| **Knowledge Alignment** | \`${knowledgeScore}/3\` | ${getProgressBar(knowledgeScore)} | ${getImprovementTip("Knowledge Alignment", knowledgeScore)} |
| **Resource Planning** | \`${resourceScore}/3\` | ${getProgressBar(resourceScore)} | ${getImprovementTip("Resource Planning", resourceScore)} |

**Overall Progress:** ${getProgressBar(parseFloat(avgScore))} \`${avgScore}/3\`

${getSupportMessage(supportLevel, parseFloat(avgScore))}
`;
          sections[i] = enhancedEvaluation;
          break;
        }
      }
      
      // Reconstruct the content with enhanced evaluation
      return sections.join("\n\n");
    }

    // If no evaluation section found, just clean as before
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
    // Phase-specific improvement tips
    const phaseSpecificTips: Record<string, Record<string, Record<string, Record<number, string>>>> = {
      phase1: {
        general: {
          Specificity: {
            1: "Define what specific aspects of SRL you want to understand",
            2: "Set clear goals for how SRL will benefit your learning",
            3: "Your SRL learning goals are well-defined"
          },
          "Knowledge Alignment": {
            1: "Connect SRL concepts to your current learning experiences",
            2: "Identify which SRL strategies match your learning style",
            3: "Your SRL goals align well with your background"
          },
          "Resource Planning": {
            1: "Find specific SRL resources relevant to your field",
            2: "Create a plan to implement SRL in your daily studying",
            3: "Your SRL resource planning is comprehensive"
          }
        }
      },
      phase2: {
        general: {
          Specificity: {
            1: "Define concrete learning objectives for your psychology studies",
            2: "Add specific psychology sub-fields and theories to focus on",
            3: "Your psychology learning goals are well-defined"
          },
          "Knowledge Alignment": {
            1: "Connect psychology goals to your current knowledge level",
            2: "Identify which psychology concepts you need to review first",
            3: "Your psychology goals align well with your background"
          },
          "Resource Planning": {
            1: "Identify specific psychology textbooks, courses or resources",
            2: "Structure psychology resources by topic importance",
            3: "Your psychology resource planning is comprehensive"
          }
        }
      },
      phase3: {
        general: {
          Specificity: {
            1: "Break your complex learning goal into smaller objectives",
            2: "Define specific milestones for your learning journey",
            3: "Your learning breakdown is clear and actionable"
          },
          "Knowledge Alignment": {
            1: "Identify prerequisite knowledge needed for each sub-goal",
            2: "Map dependencies between different learning components",
            3: "Your learning components are well-aligned with your knowledge"
          },
          "Resource Planning": {
            1: "Assign specific resources to each learning component",
            2: "Create a roadmap showing when to use each resource",
            3: "Your resource allocation is comprehensive and efficient"
          }
        }
      },
      phase4: {
        long_term_goals: {
          Specificity: {
            1: "Define your long-term learning goals with clear outcomes",
            2: "Add specific timeframes and success criteria to your goals",
            3: "Your long-term goals are comprehensive and specific"
          },
          "Knowledge Alignment": {
            1: "Connect long-term goals to your career or personal aspirations",
            2: "Map how these goals build on your existing knowledge",
            3: "Your long-term goals align perfectly with your trajectory"
          },
          "Resource Planning": {
            1: "Identify long-term resources and tools you'll need",
            2: "Create a sustainable resource acquisition timeline",
            3: "Your long-term resource planning is robust and complete"
          }
        },
        short_term_goals: {
          Specificity: {
            1: "Create SMART goals with measurable outcomes",
            2: "Define weekly or monthly learning objectives",
            3: "Your short-term goals are clear and actionable"
          },
          "Knowledge Alignment": {
            1: "Link short-term goals to build toward your long-term vision",
            2: "Identify quick wins based on your current knowledge",
            3: "Your short-term goals effectively leverage your background"
          },
          "Resource Planning": {
            1: "List specific resources needed for immediate learning",
            2: "Schedule specific times to use each resource",
            3: "Your short-term resource planning is detailed and practical"
          }
        },
        contingency_strategies: {
          Specificity: {
            1: "Identify specific obstacles that might occur",
            2: "Create detailed if-then contingency plans",
            3: "Your contingency planning is thorough and specific"
          },
          "Knowledge Alignment": {
            1: "Analyze past learning challenges to prepare better",
            2: "Adapt strategies based on your learning strengths/weaknesses",
            3: "Your contingency plans are perfectly aligned with your needs"
          },
          "Resource Planning": {
            1: "Identify backup resources for each major learning goal",
            2: "Create a flexible schedule that accommodates setbacks",
            3: "Your backup resource planning is comprehensive"
          }
        }
      },
      phase5: {
        general: {
          Specificity: {
            1: "Define specific monitoring intervals and review points",
            2: "Create measurable progress indicators for each goal",
            3: "Your monitoring approach is detailed and systematic"
          },
          "Knowledge Alignment": {
            1: "Connect monitoring strategies to your learning style",
            2: "Design self-assessments that target your weak areas",
            3: "Your monitoring approach aligns perfectly with your needs"
          },
          "Resource Planning": {
            1: "Identify tools to track progress (journals, apps, etc.)",
            2: "Schedule regular reflection and adjustment times",
            3: "Your monitoring resource planning is comprehensive"
          }
        }
      }
    };

    // Get phase-specific tip if available
    if (phase && component && 
        phaseSpecificTips[phase] && 
        phaseSpecificTips[phase][component] && 
        phaseSpecificTips[phase][component][criterion] && 
        phaseSpecificTips[phase][component][criterion][score]) {
      return phaseSpecificTips[phase][component][criterion][score];
    }
    
    // Fall back to general tips if phase-specific ones aren't available
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
    
    // Response fragments to simulate streaming (show partial responses while waiting)
    const responseFragments = {
      phase1: [
        "Analyzing your learning interests...",
        "Identifying initial learning patterns...",
        "Preparing personalized guidance for your journey...",
        "Evaluating potential learning paths for you...",
        "Structuring initial recommendations based on your input..."
      ],
      phase2: [
        "Analyzing your learning objectives in detail...",
        "Evaluating resource requirements for your goals...",
        "Assessing knowledge gaps and prerequisites...",
        "Preparing a structured learning plan outline...",
        "Identifying key milestones for your learning journey..."
      ],
      phase3: [
        "Analyzing how to break down your complex goal...",
        "Structuring intermediate objectives for you...",
        "Mapping dependencies between learning components...",
        "Evaluating optimal sequencing for your learning path...",
        "Preparing adaptive scaffolding based on your needs..."
      ],
      phase4: [
        "Formulating specific, measurable learning objectives...",
        "Creating SMART goal structures for your learning...",
        "Designing actionable next steps for immediate progress...",
        "Establishing clear metrics to track your advancement...",
        "Preparing a time-bound learning framework for you..."
      ],
      default: [
        "Processing your request with care...",
        "Analyzing the best approach to help you...",
        "Preparing a thoughtful, personalized response...",
        "Structuring guidance tailored to your needs...",
        "Almost ready with your customized feedback..."
      ]
    }
    
    // Get appropriate fragments based on current phase
    const getPhaseFragments = () => {
      return responseFragments[phase as keyof typeof responseFragments] || responseFragments.default;
    }
    
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
    
    // Update the message every 2 seconds with a new thinking text
    // or a partial response fragment after a few cycles
    const intervalId = setInterval(() => {
      count = (count + 1) % thinkingTexts.length
      
      // After a few cycles, start showing response fragments to simulate streaming
      const content = count > 2 && count % 2 === 0 
        ? getPhaseFragments()[Math.floor(Math.random() * getPhaseFragments().length)]
        : thinkingTexts[count]
      
      setLoadingText(content)
      
      // Update the typing indicator message
      setMessages((prev) => 
        prev.map(msg => 
          msg.isTyping 
            ? { ...msg, content: content } 
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

  return (
    <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6 max-w-full">
      <CardContent className="p-0 max-w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-4 rounded-t-lg border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/80 to-blue-500/50 shadow-[0_0_15px_rgba(122,86,220,0.5)] flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 w-12 h-12 rounded-full bg-purple-500/30 -z-10"
              />
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500/20 -z-20"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SoLBot</h2>
              <p className="text-indigo-300 text-sm">Your AI Learning Coach</p>
            </div>
          </div>
          <div className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-indigo-300">Online</span>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div id="chat-container" style={{ height }} className="overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={`${message.id}-${index}`} className={`flex ${message.sender === "bot" ? "" : "justify-end"}`}>
              <div className={`flex ${message.sender === "bot" ? "" : "flex-row-reverse"} max-w-[80%]`}>
                <div className="flex-shrink-0 mr-3">
                  {message.sender === "bot" ? (
                    <div className="relative h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600/80 to-blue-500/50 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 w-10 h-10 rounded-full bg-purple-500/30 -z-10"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-300" />
                    </div>
                  )}
                </div>

                <div
                  className={`${
                    message.sender === "bot"
                      ? "bg-slate-800/50 border border-indigo-500/30 text-white/90"
                      : "bg-indigo-600/30 border border-indigo-500/30 text-white/90"
                  } rounded-lg p-4 break-words overflow-hidden`}
                >
                  {message.isTyping ? (
                    <div className="flex flex-col space-y-3 p-1 w-full min-w-[180px]">
                      <div className="text-sm text-indigo-300 font-medium ml-1">
                        {message.content}
                      </div>
                      <div className="flex space-x-2 items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDuration: "0.8s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDuration: "0.8s", animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDuration: "0.8s", animationDelay: "0.4s" }}></div>
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" style={{ animationDuration: "0.8s", animationDelay: "0.6s" }}></div>
                      </div>
                      
                      {/* Progress bar animation */}
                      <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                          initial={{ width: "10%" }}
                          animate={{ 
                            width: ["10%", "30%", "60%", "90%", "95%"],
                            transition: { 
                              duration: 10, 
                              ease: "easeInOut", 
                              repeat: Infinity,
                              repeatType: "reverse"
                            }
                          }}
                        />
                      </div>
                      
                      <div className="text-xs text-indigo-300/70 italic mt-1">
                        This might take a moment for complex responses...
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm">
                        {typeof message.content === 'string' 
                          ? (
                            // Only use ChatMessageParser for phases where clickable components are desired
                            // Disable for phases 2, 4, and 5 as requested
                            phase === "phase2" || phase === "phase4" || phase === "phase5"
                            ? <MarkdownRenderer content={cleanMessageContent(message.content)} />
                            : <ChatMessageParser 
                                content={cleanMessageContent(message.content)} 
                                onOptionSelect={(selected) => {
                                  // Create a temporary state for the input to pass to handleSendMessage
                                  setUserInput(selected);
                                  
                                  // Add the user message to the chat
                                  const newUserMessage: Message = {
                                    id: Date.now(),
                                    sender: "user",
                                    content: selected,
                                    timestamp: new Date(),
                                  };
                                  
                                  setMessages((prev) => [...prev, newUserMessage]);
                                  
                                  // Process the selected option as a message
                                  setTimeout(() => {
                                    // Call the onSendMessage callback if provided
                                    if (onSendMessage) {
                                      onSendMessage(selected);
                                    }
                                    
                                    // Send the message to the agent
                                    handleSendMessage();
                                    
                                    // Clear the input
                                    setUserInput("");
                                  }, 0);
                                }} 
                              />
                          ) 
                          : message.content
                        }
                      </div>
                      
                      {/* Scaffolding step indicator */}
                      {message.type === "scaffold" && message.scaffoldStep && message.scaffoldTotalSteps && (
                        <div className="mt-2 flex items-center justify-between text-xs text-indigo-300">
                          <div className="flex items-center gap-1">
                            <span>Step {message.scaffoldStep} of {message.scaffoldTotalSteps}</span>
                          </div>
                          {message.scaffoldHint && (
                            <div className="italic text-indigo-300/80">
                              Hint: {message.scaffoldHint}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Special content based on message type */}
                      {message.type === "video" && videoComponent && (
                        <div className="mt-4">{videoComponent}</div>
                      )}
                      
                      {message.type === "quiz" && quizComponent && (
                        <div className="mt-4">{quizComponent}</div>
                      )}
                      
                      {message.type === "feedback" && feedbackComponent && (
                        <div className="mt-4">{feedbackComponent}</div>
                      )}
                      
                      {message.type === "summary" && summaryComponent && (
                        <div className="mt-4">{summaryComponent}</div>
                      )}
                      
                      {message.showContinue && onContinue && (
                        <div className="mt-4">
                          <Button
                            onClick={() => {
                              if (!onPhaseComplete) {
                                // Fall back to regular continue if no onPhaseComplete
                                if (onContinue) {
                                  onContinue();
                                }
                                return;
                              }
                              
                              const nextStep = getNextPhaseInSequence(phase);
                              
                              // For Phase 4, if it's a task transition within the phase
                              if (phase === "phase4" && 
                                  (nextStep === "short_term_goals" || nextStep === "contingency_strategies")) {
                                // Send with score info to maintain progress tracking
                                onPhaseComplete(`${nextStep}:score:2.5`);
                              } else {
                                // Regular phase transition
                                onPhaseComplete(nextStep);
                              }
                            }}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 px-6"
                          >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        {allowInput && (
          <div className="border-t border-indigo-500/30 p-4">
            {useScaffolding && (
              <div className="mb-2 flex items-center justify-between text-xs text-indigo-300">
                <div>
                  <span>Step {currentScaffoldStep} of {scaffoldingSteps}</span>
                </div>
                {/* Character limit counter - only shows when approaching limit */}
                {charactersRemaining <= 100 && (
                  <div className={`${charactersRemaining < 0 ? 'text-red-400' : 'text-indigo-300'}`}>
                    {charactersRemaining} characters remaining
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <Textarea
                id="chat-message-input"
                name="chat-message"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                className="min-h-[80px] flex-1 bg-slate-800/50 border border-indigo-500/30 text-white resize-none"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                className={`bg-indigo-600 hover:bg-indigo-700 h-10 w-10 rounded-full p-0 flex items-center justify-center ${
                  isTyping ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isTyping || userInput.length === 0 || userInput.length > maxMessageLength}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Character limit warning */}
            {userInput.length > maxMessageLength && (
              <div className="mt-2 text-xs text-red-400">
                Your message exceeds the maximum allowed length. Please shorten it.
              </div>
            )}
          </div>
        )}

        {/* Always visible Continue button */}
        {alwaysShowContinue && onPhaseComplete && (
          <div className="border-t border-indigo-500/30 p-4 flex justify-center">
            <Button
              onClick={() => {
                if (!onPhaseComplete) return;
                
                const nextStep = getNextPhaseInSequence(phase);
                
                // For Phase 4, if it's a task transition within the phase
                if (phase === "phase4" && 
                    (nextStep === "short_term_goals" || nextStep === "contingency_strategies")) {
                  // Send with score info to maintain progress tracking
                  onPhaseComplete(`${nextStep}:score:2.5`);
                } else {
                  // Regular phase transition
                  onPhaseComplete(nextStep);
                }
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 px-6"
            >
              {phase === "phase4" && (component === "long_term_goals" || component === "short_term_goals") 
                ? "Continue" 
                : "Continue to Next Phase"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  )
} 