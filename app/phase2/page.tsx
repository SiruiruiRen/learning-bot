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
    <div className="bg-slate-800/50 p-4 rounded-lg border border-teal-500/20 mb-4 max-w-4xl mx-auto">
      <h3 className="text-lg font-medium text-teal-300 mb-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-teal-900/60 flex items-center justify-center">
          <span className="text-teal-400">📚</span>
        </div>
        Why Prior Knowledge & Resources Matter
      </h3>
      
      <p className="text-white/80 mb-3">
        Connecting new learning to what you already know and selecting appropriate resources creates a foundation for efficient and effective learning.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-700/30 p-3 rounded border border-teal-500/10">
          <h4 className="text-teal-300 text-sm font-medium mb-2 flex items-center">
            <Search className="h-4 w-4 mr-1 text-teal-400" />
            Analyzing Prior Knowledge:
          </h4>
          <ul className="space-y-1">
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2"></div>
              Recognize knowledge gaps to address
            </li>
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2"></div>
              Connect new ideas to existing mental models
            </li>
          </ul>
        </div>
        
        <div className="bg-slate-700/30 p-3 rounded border border-teal-500/10">
          <h4 className="text-teal-300 text-sm font-medium mb-2 flex items-center">
            <BookOpen className="h-4 w-4 mr-1 text-teal-400" />
            Selecting Effective Resources:
          </h4>
          <ul className="space-y-1">
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2"></div>
              Choose materials appropriate to your level
            </li>
            <li className="flex items-center text-white/70 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-2"></div>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={phaseId} />
        
        {/* Fixed Phase Title that stays visible when scrolling */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-teal-500/20 py-3 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center">
              <Target className="h-6 w-6 text-teal-500 mr-2" />
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text">
                Task Analysis & Resource Identification
              </h2>
            </div>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Target className="h-8 w-8 text-teal-500" />
                <span className="bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
                  Task Analysis & Resource Identification
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 space-y-4 mb-6">
                <p>
                  {userName ? `Great work, ${userName}!` : "Great work!"} Now let's define your learning task in a way that sets you up for success.
                </p>
                <p>Define what you want to learn, how your current knowledge relates to it, and what resources you'll use.</p>
              </div>

              {/* Learning Objective Analysis - placed here */}
              <LearningObjectiveAnalysis />

              {/* Prior Knowledge and Resources Analysis */}
              <PriorKnowledgeResourceAnalysis />

              {/* Progress bar showing the flow - simplified version */}
              <div className="mt-6 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-teal-900 flex items-center justify-center text-teal-300 border border-teal-500">
                      1
                    </div>
                    <span className="ml-2 text-teal-300 font-medium">Watch Video</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-0.5 w-full bg-slate-700 relative">
                      <div className="absolute inset-y-0 left-0 bg-teal-500" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white/60 border border-slate-600">
                      2
                    </div>
                    <span className="ml-2 text-white/60">SolBot Chat</span>
                  </div>
                </div>
              </div>

              {/* Video Player Component */}
              <div className="mt-6 space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-teal-500/20">
                  <h3 className="text-lg font-medium text-teal-300 mb-3 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-teal-400" />
                    Watch: Introduction to Learning Task Analysis
                  </h3>
                  
                  {/* Video Player */}
                  <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4 shadow-lg border border-slate-700/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="bg-teal-500/20 p-4 rounded-full mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                          <PlayCircle className="h-8 w-8 text-teal-400" />
                        </div>
                        <p className="text-teal-300 text-sm">Video introduction to task analysis</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-white/80 text-sm">
                
                    <p className="mt-4 text-teal-300 font-medium flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-teal-300" />
                      After watching the video, you'll chat with SolBot to create your personalized Task Analysis & Resource Identification plan.
                    </p>
                  </div>
                </div>
                
                {/* Button to navigate to chat page */}
                <div className="flex justify-center mt-8">
                  <Button 
                    className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-6 py-6 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2"
                    onClick={() => router.push("/phase2/chat")}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium text-lg">Continue to Task Analysis Chat</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

