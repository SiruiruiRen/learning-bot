"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  School,
  CheckCircle,
  Target,
  MoveRight,
  BookOpen,
  BrainCircuit,
  Bot,
  ChevronRight,
  ChevronLeft,
  FileText,
  BookMarked,
  Video,
  Globe,
  Users,
  MessageSquare,
  Award,
  ArrowRight,
  Edit,
  PlayCircle,
  VideoIcon,
  Sparkles,
  ClipboardList,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

// Import the ModuleBar component
import ModuleBar from "@/components/module-bar"
import SolBotChat, { Message } from "@/components/solbot-chat"
import { phases, getPersonalizedMessages, getNextPhase } from "@/lib/phase-data"

// Add a message cleaning function to strip any possible score text
const cleanScoresFromMessage = (message: string): string => {
  if (!message || typeof message !== 'string') return message || '';
  
  // Remove evaluation scores in square brackets
  const patterns = [
    /\[\s*(?:Note|Evaluation)[^\]]+\]/g,
    /\[\s*(?:Alignment|Timeframe|Measurability|Average Score|Overall Score)[^\]]+\]/g,
    /\[\s*(?:score|Score|evaluation|Evaluation|support level|SUPPORT|HIGH|MEDIUM|LOW)[^\]]+\]/gi,
    /\[.*?\d+\.\d+.*?\]/g, // Catch anything with a decimal number in brackets
    /\[.*?(?:providing|Providing).*?support.*?\]/gi
  ];
  
  let cleanedMessage = message;
  patterns.forEach(pattern => {
    cleanedMessage = cleanedMessage.replace(pattern, '');
  });
  
  return cleanedMessage.trim();
};

// Define resource types
const resourceTypes = [
  { value: "textbook", label: "Textbook", icon: <BookMarked className="h-5 w-5" /> },
  { value: "lecture", label: "Lecture Notes", icon: <FileText className="h-5 w-5" /> },
  { value: "video", label: "Video Lectures", icon: <Video className="h-5 w-5" /> },
  { value: "online", label: "Online Resources", icon: <Globe className="h-5 w-5" /> },
  { value: "study_group", label: "Study Groups", icon: <Users className="h-5 w-5" /> },
  { value: "office_hours", label: "Office Hours", icon: <MessageSquare className="h-5 w-5" /> },
]

// Add this component near the imports but before the main component
const LearningObjectiveAnalysis = () => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/20 mb-4 max-w-4xl mx-auto">
      <h3 className="text-lg font-medium text-purple-300 mb-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-purple-900/60 flex items-center justify-center">
          <span className="text-purple-400">🎯</span>
        </div>
        How to Analyze Learning Objectives
      </h3>
      <p className="text-white/80 mb-2">
        Learning objectives reveal what your instructor expects you to know and the cognitive level required.
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-purple-300 font-medium">Knowledge Level:</p>
          <p className="text-white/70">Define, List, Recall, Identify</p>
        </div>
        <div>
          <p className="text-purple-300 font-medium">Comprehension Level:</p>
          <p className="text-white/70">Explain, Describe, Summarize</p>
        </div>
        <div>
          <p className="text-purple-300 font-medium">Application Level:</p>
          <p className="text-white/70">Apply, Demonstrate, Solve</p>
        </div>
        <div>
          <p className="text-purple-300 font-medium">Analysis Level:</p>
          <p className="text-white/70">Compare, Analyze, Differentiate</p>
        </div>
      </div>
    </div>
  );
};

// Add new component for analyzing prior knowledge and resources
const PriorKnowledgeResourceAnalysis = () => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-blue-500/20 mb-4 max-w-4xl mx-auto">
      <h3 className="text-lg font-medium text-blue-300 mb-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-blue-900/60 flex items-center justify-center">
          <span className="text-blue-400">📚</span>
        </div>
        Why Prior Knowledge & Resources Matter
      </h3>
      
      <p className="text-white/80 mb-3">
        Connecting new learning to what you already know and selecting appropriate resources creates a foundation for efficient and effective learning.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-700/30 p-3 rounded border border-blue-500/10">
          <h4 className="text-blue-300 text-sm font-medium mb-2 flex items-center">
            <Search className="h-4 w-4 mr-1 text-blue-400" />
            Analyzing Prior Knowledge:
          </h4>
          <ul className="space-y-1">
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
              Recognize knowledge gaps to address
            </li>
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
              Connect new ideas to existing mental models
            </li>
          </ul>
        </div>
        
        <div className="bg-slate-700/30 p-3 rounded border border-blue-500/10">
          <h4 className="text-blue-300 text-sm font-medium mb-2 flex items-center">
            <BookOpen className="h-4 w-4 mr-1 text-blue-400" />
            Selecting Effective Resources:
          </h4>
          <ul className="space-y-1">
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
              Choose materials appropriate to your level
            </li>
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
              Seek diverse formats for complex topics
            </li>
          </ul>
        </div>
      </div>
      
    </div>
  );
};

export default function Phase2Content() {
  const router = useRouter()
  const phaseId = 2
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDefined, setTaskDefined] = useState(false)
  const [resourcesSelected, setResourcesSelected] = useState(false)
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [step, setStep] = useState(1)
  const [stepComplete, setStepComplete] = useState(false)
  const [chatInitialized, setChatInitialized] = useState(false)
  const [showResourceSelector, setShowResourceSelector] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0) // Track the current card
  const [videoWatched, setVideoWatched] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)

  // Define the cards for easy reference
  const cards = [
    { id: "intro", title: "Task Analysis & Resource Identification" },
    { id: "objectives", title: "How to Analyze Learning Objectives" },
    { id: "resources", title: "Why Prior Knowledge & Resources Matter" },
    { id: "video", title: "Watch: Introduction to Learning Task Analysis" },
  ]

  // Function to navigate to the next card
  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      // If we're on the last card, go to the chat page
      router.push("/phase2/chat")
    }
  }

  // Function to navigate to the previous card
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  // Function to handle video completion
  const handleVideoComplete = () => {
    setVideoWatched(true)
    // Save to localStorage that user has watched the video
    try {
      const stateToSave = {
        ...JSON.parse(localStorage.getItem(`solbot_phase${phaseId}_state`) || '{}'),
        videoWatched: true
      }
      localStorage.setItem(`solbot_phase${phaseId}_state`, JSON.stringify(stateToSave))
    } catch (error) {
      console.error(`Error saving video watched state:`, error)
    }
  }

  // Load saved state from localStorage on component mount
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem(`solbot_phase${phaseId}_state`)
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          if (state.taskDefined !== undefined) setTaskDefined(state.taskDefined)
          if (state.resourcesIdentified !== undefined) setResourcesSelected(state.resourcesIdentified)
          if (state.taskDescription) setTaskDescription(state.taskDescription)
          if (state.selectedResources) setSelectedResources(state.selectedResources)
          if (state.videoWatched !== undefined) setVideoWatched(state.videoWatched)
        } catch (parseError) {
          console.error(`Error parsing saved state for phase ${phaseId}:`, parseError)
          // Clear corrupted state
          localStorage.removeItem(`solbot_phase${phaseId}_state`)
        }
      }
    } catch (error) {
      console.error(`Error loading phase ${phaseId} state:`, error)
    }
  }

  // Load user data on component mount
  useEffect(() => {
    // Load user name from localStorage
    const storedName = localStorage.getItem("solbot_user_name")
    if (storedName) {
      setUserName(storedName)
    }
    
    // Load userId from localStorage
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setUserId(storedUserId)
    }
    
    loadSavedState()
  }, [])

  // Save state to localStorage when it changes
  useEffect(() => {
    const saveState = () => {
      try {
        const stateToSave = {
          taskDefined,
          resourcesIdentified: resourcesSelected,
          taskDescription,
          selectedResources,
        }
        const stateJson = JSON.stringify(stateToSave)
        localStorage.setItem(`solbot_phase${phaseId}_state`, stateJson)
      } catch (error) {
        console.error(`Error saving Phase ${phaseId} state:`, error)
      }
    }

    saveState()
  }, [taskDefined, resourcesSelected, taskDescription, selectedResources, phaseId])

  const handleTaskComplete = () => {
    setTaskDefined(true);
    setShowResourceSelector(true);
  }

  const handleResourceToggle = (resourceValue: string) => {
    setSelectedResources(prev => {
      if (prev.includes(resourceValue)) {
        return prev.filter(r => r !== resourceValue);
      } else {
        return [...prev, resourceValue];
      }
    });
  }

  const handleResourcesSubmit = () => {
    if (selectedResources.length === 0) return;
    setResourcesSelected(true);
    
    // Create a message with the selected resources
    const resourceMessage = `I've selected these resources: ${selectedResources.map(r => 
      resourceTypes.find(type => type.value === r)?.label
    ).join(", ")}`;
    
    // Send the selected resources to the chat
    if (onSendMessage) {
      onSendMessage(resourceMessage);
    }
  }
  
  // Send message handler
  const onSendMessage = (message: string) => {
    console.log("Message sent:", message);
  }

  const handlePhaseComplete = (nextPhase: string) => {
    // If nextPhase already contains "phase", don't add it again
    if (nextPhase.startsWith("phase")) {
      router.push(`/${nextPhase}`);
    } else {
      router.push(`/phase${nextPhase}`);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={2} />

        {/* Fixed Title Header */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-blue-500/20 py-3 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center">
              <Target className="h-6 w-6 text-blue-500 mr-2" />
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-sky-500 bg-clip-text">
                Phase 2: Task Analysis
              </h2>
            </div>
          </div>
        </div>
        
        {/* Card navigation indicators */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-30 flex flex-col gap-2">
          <button 
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className={`rounded-full p-2 transition-all ${currentCardIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100 bg-slate-700/50 hover:bg-slate-700/80'}`}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          
          {/* Card indicators */}
          <div className="flex flex-col items-center gap-1.5">
            {cards.map((_, i) => (
              <div 
                key={i}
                className={`rounded-full transition-all ${i === currentCardIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                onClick={() => setCurrentCardIndex(i)}
              ></div>
            ))}
          </div>
          
          <button 
            onClick={nextCard}
            disabled={currentCardIndex === cards.length - 1}
            className={`rounded-full p-2 transition-all ${currentCardIndex === cards.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100 bg-slate-700/50 hover:bg-slate-700/80'}`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <Card className="bg-slate-900/60 backdrop-blur-md border border-blue-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Target className="h-8 w-8 text-blue-500" />
                <span className="bg-gradient-to-r from-blue-400 to-sky-500 bg-clip-text text-transparent">
                  Task Analysis & Resource Identification
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Card content based on the current index */}
              {currentCardIndex === 0 && (
                <div className="text-white/80 space-y-4 mb-6">
                  <p>
                    {userName ? `Great work, ${userName}!` : "Great work!"} Now let's define your learning task in a way that sets you up for success.
                  </p>
                  <p>Define what you want to learn, how your current knowledge relates to it, and what resources you'll use.</p>
                </div>
              )}

              {/* Learning Objective Analysis */}
              {currentCardIndex === 1 && <LearningObjectiveAnalysis />}

              {/* Prior Knowledge and Resources Analysis */}
              {currentCardIndex === 2 && <PriorKnowledgeResourceAnalysis />}

              {/* Video section */}
              {currentCardIndex === 3 && (
                <div className="mt-6 space-y-6">
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-teal-500/20">
                    <h3 className="text-lg font-medium text-teal-300 mb-3 flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-teal-400" />
                      Watch: Introduction to Learning Task Analysis
                    </h3>
                    
                    {/* Video Player */}
                    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4 shadow-lg border border-slate-700/50">
                      {videoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
                        </div>
                      )}
                      <video
                        className="w-full h-full"
                        controls
                        onLoadedData={() => setVideoLoading(false)}
                        onCanPlay={() => setVideoLoading(false)}
                        onEnded={handleVideoComplete}
                        src="/video/SoL_phase2.mp4"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    
                    <div className="text-white/80 text-sm">
                      {videoWatched ? (
                        <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                          <p className="text-blue-300 font-medium flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-blue-400" />
                            Video Completed!
                          </p>
                        </div>
                      ) : (
                        <p className="mt-4 text-blue-300 font-medium flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2 text-blue-300" />
                          After watching the video, you'll chat with SolBot to create your personalized Task Analysis & Resource Identification plan.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation buttons at the bottom of each card */}
              <div className="flex justify-between mt-8">
                {currentCardIndex > 0 ? (
                  <Button 
                    variant="outline"
                    className="text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
                    onClick={prevCard}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                ) : <div></div>} {/* Empty div to maintain flex spacing */}
                
                {currentCardIndex < cards.length - 1 ? (
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white px-6 py-2 rounded-lg"
                    onClick={nextCard}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white px-6 py-3 rounded-full font-medium shadow-lg"
                    onClick={nextCard}
                  >
                    Continue to Chat <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

