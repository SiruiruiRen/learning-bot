// Define the phase content structure

export interface PhaseData {
  id: number
  title: string
  subtitle: string
  description: string
  initialMessages: PhaseMessage[]
  nextPhase: number
}

export interface PhaseMessage {
  id: number
  sender: "bot" | "user"
  content: string
  timestamp: Date
  isTyping?: boolean
  showContinue?: boolean
  type?: "text" | "video" | "quiz" | "activity" | "feedback" | "summary"
}

// Initialize all phase data
export const phases: Record<number, PhaseData> = {
  1: {
    id: 1,
    title: "What's SRL",
    subtitle: "Master the art of learning effectively",
    description: "Discover the science-backed approach that transforms average students into exceptional learners.",
    initialMessages: [
      {
        id: 1,
        sender: "bot",
        content: "Ready to unlock your learning potential? Let's discover how top performers approach their studies differently.",
        timestamp: new Date(),
      },
      {
        id: 2,
        sender: "bot",
        content: "Self-regulated learning is the hidden skill behind academic excellence. It's not just what you study, but how you approach the entire learning process.",
        timestamp: new Date(Date.now() + 100),
      },
      {
        id: 3,
        sender: "bot",
        content: "Check out this quick video to see the self-regulated learning cycle in action - a game-changer for your study habits!",
        timestamp: new Date(Date.now() + 200),
        type: "video",
      },
    ],
    nextPhase: 2,
  },
  2: {
    id: 2,
    title: "Understand Your Tasks",
    subtitle: "Define what success looks like",
    description: "Learn to precisely map out your learning path before beginning - the key to avoiding wasted time and effort.",
    initialMessages: [
      {
        id: 1,
        sender: "bot",
        content: "Now that you understand the framework, let's get strategic about your specific learning needs.",
        timestamp: new Date(),
      },
      {
        id: 2,
        sender: "bot",
        content: "The most successful learners start with crystal-clear objectives. Vague goals lead to unfocused studying and frustration.",
        timestamp: new Date(Date.now() + 100),
      },
      {
        id: 3,
        sender: "bot",
        content: "This quick video shows how to break down any learning challenge into actionable objectives you can actually accomplish.",
        timestamp: new Date(Date.now() + 200),
        type: "video",
      },
    ],
    nextPhase: 3,
  },
  3: {
    id: 3,
    title: "Effective Learning Strategies",
    subtitle: "Study smarter, not harder",
    description: "Discover scientifically-proven techniques that make information stick in your long-term memory.",
    initialMessages: [
      {
        id: 1,
        sender: "bot",
        content: "With clear objectives set, it's time to upgrade your learning toolkit with proven techniques.",
        timestamp: new Date(),
      },
      {
        id: 2,
        sender: "bot",
        content: "Forget highlighting and re-reading - research shows these popular methods are surprisingly ineffective. Let's explore what actually works.",
        timestamp: new Date(Date.now() + 100),
      },
      {
        id: 3,
        sender: "bot",
        content: "This video reveals the science-backed strategies that top students use to master complex material with less frustration.",
        timestamp: new Date(Date.now() + 200),
        type: "video",
      },
    ],
    nextPhase: 4,
  },
  4: {
    id: 4,
    title: "Achieve Your Goals",
    subtitle: "Create your roadmap to mastery",
    description: "Transform vague intentions into a concrete action plan with built-in accountability.",
    initialMessages: [
      {
        id: 1,
        sender: "bot",
        content: "Armed with effective strategies, let's create a structured plan you'll actually follow.",
        timestamp: new Date(),
      },
      {
        id: 2,
        sender: "bot",
        content: "SMART goals transform wishful thinking into achievable results. They're your roadmap to learning success.",
        timestamp: new Date(Date.now() + 100),
      },
      {
        id: 3,
        sender: "bot",
        content: "Watch how to create goals that motivate rather than overwhelm, with realistic milestones to keep you on track.",
        timestamp: new Date(Date.now() + 200),
        type: "video",
      },
    ],
    nextPhase: 5,
  },
  5: {
    id: 5,
    title: "Monitor Your Learning",
    subtitle: "Stay on course and pivot when needed",
    description: "Learn to track your progress objectively and make data-driven adjustments to your approach.",
    initialMessages: [
      {
        id: 1,
        sender: "bot",
        content: "Even the best plan needs fine-tuning. Let's develop your ability to monitor and adapt your learning approach.",
        timestamp: new Date(),
      },
      {
        id: 2,
        sender: "bot",
        content: "Self-assessment is often flawed - we'll build a system to accurately measure your progress and identify blind spots.",
        timestamp: new Date(Date.now() + 100),
      },
      {
        id: 3,
        sender: "bot",
        content: "This video demonstrates practical monitoring techniques that reveal what's working and what needs adjustment in your learning system.",
        timestamp: new Date(Date.now() + 200),
        type: "video",
      },
    ],
    nextPhase: 6,
  },
  6: {
    id: 6,
    title: "Learning Journey Summary",
    subtitle: "Your personalized success blueprint",
    description: "Consolidate your custom learning system and prepare for confident, effective implementation.",
    initialMessages: [
      {
        id: 1,
        sender: "bot",
        content: "Congratulations on building your complete learning system! Let's review your personalized blueprint for success.",
        timestamp: new Date(),
      },
      {
        id: 2,
        sender: "bot",
        content: "You've crafted a powerful approach to learning that combines planning, effective strategies, clear goals, and adaptive methods.",
        timestamp: new Date(Date.now() + 100),
      },
      {
        id: 3,
        sender: "bot",
        content: "Take a moment to reflect on your transformation - from following standard study advice to creating a custom system backed by cognitive science.",
        timestamp: new Date(Date.now() + 200),
        type: "summary",
      },
    ],
    nextPhase: 1, // Loop back to start if needed
  },
}

// Helper function to get personalized messages with username
export const getPersonalizedMessages = (phaseId: number, userName?: string): PhaseMessage[] => {
  const phase = phases[phaseId]
  if (!phase) return []

  // Create a copy of the messages
  const messages = [...phase.initialMessages]
  
  // Personalize first message if username is available
  if (userName && messages.length > 0) {
    const firstMessage = { ...messages[0] }
    firstMessage.content = `Hi ${userName}! ${firstMessage.content}`
    messages[0] = firstMessage
  }
  
  return messages
}

// Get the next phase
export const getNextPhase = (currentPhase: number): number => {
  return phases[currentPhase]?.nextPhase || 1
} 