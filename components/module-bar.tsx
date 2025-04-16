"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
  BrainCircuit, 
  Target, 
  LineChart, 
  Bot, 
  ChevronRight, 
  CheckCircle, 
  BookOpen, 
  ClipboardList, 
  Award, 
  Sparkles, 
  Home,
  BookMarked,
  GraduationCap,
  Lightbulb,
  PenTool,
  GanttChart,
  PieChart,
  Medal,
  Compass,
  MapPin,
  Map,
  Flag,
  BarChart2,
  ListTodo,
  TrendingUp,
  Workflow,
  Milestone,
  MoveRight
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface ModuleBarProps {
  currentPhase?: number // Make currentPhase optional
}

// Define color types
type ModuleColor = 'blue' | 'purple' | 'indigo';
type ColorClasses = {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  gradient: string;
};

export default function ModuleBar({ currentPhase = 0 }: ModuleBarProps) {
  const [expandedSidebar, setExpandedSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Don't show on landing page
  if (pathname === "/") {
    return null;
  }

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setExpandedSidebar(false)
      } else {
        setExpandedSidebar(true)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Define the modules and their phases
  const modules = [
    {
      name: "Goal Setting",
      icon: <Flag className="h-5 w-5" />,
      color: "blue" as ModuleColor,
      phases: [1, 2],
      phaseNames: ["What's SRL", "Understand Your Tasks"],
      phaseIcons: [<BrainCircuit className="h-5 w-5" />, <Target className="h-5 w-5" />],
      phaseDescriptions: [
        "Understand the self-regulated learning framework that will guide your learning journey",
        "Define your learning objectives and identify resources to support your learning goals",
      ],
      description: "Understanding how to organize your learning process",
    },
    {
      name: "Learning Strategies",
      icon: <Lightbulb className="h-5 w-5" />,
      color: "purple" as ModuleColor,
      phases: [3, 4],
      phaseNames: ["Effective Learning Strategies", "Achieve Your Goals"],
      phaseIcons: [<BookMarked className="h-5 w-5" />, <ListTodo className="h-5 w-5" />],
      phaseDescriptions: [
        "Discover evidence-based learning techniques like retrieval practice and spaced repetition",
        "Create a structured plan with specific goals and contingency strategies for obstacles",
      ],
      description: "Applying evidence-based techniques to learn effectively",
    },
    {
      name: "Monitor & Adapt",
      icon: <BarChart2 className="h-5 w-5" />,
      color: "indigo" as ModuleColor,
      phases: [5, 6],
      phaseNames: ["Monitor Your Learning", "Learning Journey Summary"],
      phaseIcons: [<TrendingUp className="h-5 w-5" />, <Medal className="h-5 w-5" />],
      phaseDescriptions: [
        "Build a system to track your progress and adjust your approach",
        "Review your complete learning system and prepare for implementation",
      ],
      description: "Tracking progress and adjusting your approach",
    },
  ]

  // Calculate total phases and overall progress
  const totalPhases = modules.reduce((sum, module) => sum + module.phases.length, 0)
  const currentPhaseOverall = currentPhase > 0 ? 
    modules.flatMap(m => m.phases).findIndex(p => p === currentPhase) + 1 : 0
  const progressPercentage = (currentPhaseOverall / totalPhases) * 100

  // Get completed phases (all phases that come before current phase)
  const completedPhases = currentPhase > 0 ? 
    modules.flatMap(m => m.phases).filter(p => p < currentPhase) : []

  // Function to navigate to specific phases
  const navigateToPhase = (phase: number) => {
    router.push(`/phase${phase}`)
  }

  // Function to navigate to Phase 5 specifically
  const navigateToPhase5 = () => {
    router.push("/phase5");
    // Force a reload to ensure we get the intro page
    setTimeout(() => {
      window.location.href = "/phase5";
    }, 100);
  }

  // Function to navigate to home
  const navigateToHome = () => {
    router.push("/intro")
  }

  // Function to navigate to summary
  const navigateToSummary = () => {
    router.push("/summary")
  }

  // Find the current module based on the current phase
  const currentModule =
    currentPhase > 0 ? modules.find((module) => module.phases.includes(currentPhase)) || modules[0] : null
  const currentModuleIndex = currentPhase > 0 ? modules.findIndex((module) => module.phases.includes(currentPhase)) : -1
  const currentPhaseIndex = currentPhase > 0 && currentModule ? currentModule.phases.indexOf(currentPhase) : -1
  const currentPhaseName = currentPhase > 0 && currentModule ? currentModule.phaseNames[currentPhaseIndex] : ""
  const currentPhaseIcon = currentPhase > 0 && currentModule && currentModule.phaseIcons ? currentModule.phaseIcons[currentPhaseIndex] : null

  // Get color classes for the current module
  const colorMap: Record<ModuleColor, ColorClasses> = {
    blue: {
      bg: "bg-blue-500",
      bgLight: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500/30",
      gradient: "from-blue-600 to-blue-400",
    },
    purple: {
      bg: "bg-purple-500",
      bgLight: "bg-purple-500/20",
      text: "text-purple-400",
      border: "border-purple-500/30",
      gradient: "from-purple-600 to-purple-400",
    },
    indigo: {
      bg: "bg-indigo-500",
      bgLight: "bg-indigo-500/20",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
      gradient: "from-indigo-600 to-indigo-400",
    },
  }
  const colors = currentModule ? colorMap[currentModule.color] : colorMap.indigo

  // Mobile header bar
  if (isMobile) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/20 sticky top-0 z-20 py-3 px-4 w-full">
        <div className="mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={navigateToHome}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/80 to-blue-500/50 flex items-center justify-center">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">SoLBot</h2>
            </div>

            {currentPhase > 0 && currentModule ? (
              <button
                onClick={() => setExpandedSidebar(!expandedSidebar)}
                className={`flex items-center px-3 py-1.5 rounded-full transition-colors
                  ${colors.bgLight} ${colors.text} border ${colors.border}`}
              >
                <div className={`mr-1.5 ${colors.text}`}>
                  {currentPhaseIcon || currentModule.icon}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">
                  Phase {currentPhase} - {currentPhaseName}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {modules.map((module, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToPhase(module.phases[0])}
                    className={`flex items-center px-3 py-1.5 rounded-full transition-colors
                      ${colorMap[module.color].bgLight} ${colorMap[module.color].text} border ${colorMap[module.color].border}`}
                  >
                    <div className={`${colorMap[module.color].text}`}>{module.icon}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {expandedSidebar && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              {/* Mini roadmap indicators at the top */}
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="h-1.5 bg-slate-800 rounded-full flex-1 overflow-hidden relative">
                  {/* Phase marker dots */}
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-between items-center px-0.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((phase) => (
                      <div 
                        key={phase}
                        className={`w-2 h-2 rounded-full ${
                          phase <= currentPhase ? "bg-white" : "bg-slate-700"
                        }`}
                        onClick={() => phase > 0 && navigateToPhase(phase)}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Progress filled bar */}
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-white/70 ml-2">
                  {Math.round(progressPercentage)}%
                </div>
              </div>

              <div className="flex flex-col space-y-1 w-full">
                {modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="w-full">
                    <div className={`flex items-center py-2 px-3 rounded-md mb-1
                      ${moduleIndex === currentModuleIndex ? 
                        `${colorMap[module.color].bgLight} ${colorMap[module.color].text}` : 
                        'hover:bg-slate-800/50'}`}>
                      <div className="mr-2">{module.icon}</div>
                      <span className="text-sm font-medium">{module.name}</span>
                    </div>
                    
                    <div className="ml-6 space-y-1 mb-2">
                      {module.phases.map((phase, phaseIndex) => {
                        const isActive = phase === currentPhase;
                        const isCompleted = completedPhases.includes(phase);
                        return (
                          <div
                            key={phase}
                            onClick={() => phase === 5 ? navigateToPhase5() : navigateToPhase(phase)}
                            className={`flex items-center py-1.5 px-3 rounded-md cursor-pointer text-sm
                              ${isActive ? 
                                `${colorMap[module.color].bgLight} ${colorMap[module.color].text}` : 
                                isCompleted ? 
                                  'text-emerald-400 hover:bg-slate-800/50' : 
                                  'text-white/50 hover:bg-slate-800/30'}`}
                          >
                            <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center">
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <div className={`h-2.5 w-2.5 rounded-full 
                                  ${isActive ? colorMap[module.color].bg : 'bg-gray-600'}`}>
                                </div>
                              )}
                            </div>
                            {/* Use phase-specific icon if available */}
                            {module.phaseIcons && (
                              <div className="mr-2">
                                {module.phaseIcons[phaseIndex]}
                              </div>
                            )}
                            <span>{module.phaseNames[phaseIndex]}</span>
                            {isActive && <MoveRight className="h-3 w-3 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop sidebar - using the original vertical circle navigation design with improved usability
  return (
    <div className="fixed left-3 top-1/2 transform -translate-y-1/2 z-30 hidden lg:block">
      <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl w-auto">
        <div className="flex flex-col items-center">
          {/* Title */}
          <div className="text-white/70 text-xs font-medium mb-3 px-1">JOURNEY</div>

          {/* Learning Journey Path */}
          <div className="relative flex flex-col items-center">
            {/* Background Path - positioned to not overlap with icons */}
            <div className="absolute top-[60px] bottom-0 w-0.5 bg-slate-700/50 left-1/2 transform -translate-x-1/2" 
              style={{ height: 'calc(100% - 120px)' }}></div>
            
            {/* Start point */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-10 h-10 flex items-center justify-center cursor-pointer
                        ${currentPhase === 0 ? "text-indigo-400" : "text-white/50 hover:text-white/80"}`}
                      onClick={() => router.push("/intro")}
                    >
                      <Compass className="h-5 w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs">
                    <p>Introduction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currentPhase === 0 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-indigo-400/50 animate-pulse"></div>
              )}
            </div>
            
            {/* Phase 1 */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                        ${currentPhase === 1 ? "bg-blue-600/80 text-white" : 
                          completedPhases.includes(1) ? "bg-blue-800/50 text-white/80" : "bg-slate-800 text-white/50 hover:bg-slate-700/70 hover:text-white/80"}`}
                      onClick={() => navigateToPhase(1)}
                    >
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs">
                    <p>Phase 1: What's SRL</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currentPhase === 1 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-blue-400/50 animate-pulse"></div>
              )}
              {completedPhases.includes(1) && (
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                </div>
              )}
            </div>
            
            {/* Phase 2 */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                        ${currentPhase === 2 ? "bg-teal-600/80 text-white" : 
                          completedPhases.includes(2) ? "bg-teal-800/50 text-white/80" : "bg-slate-800 text-white/50 hover:bg-slate-700/70 hover:text-white/80"}`}
                      onClick={() => router.push("/phase2")}
                    >
                      <Target className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs">
                    <p>Phase 2: Understand Your Tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currentPhase === 2 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-teal-400/50 animate-pulse"></div>
              )}
              {completedPhases.includes(2) && (
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                </div>
              )}
            </div>
            
            {/* Phase 3 */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                        ${currentPhase === 3 ? "bg-purple-600/80 text-white" : 
                          completedPhases.includes(3) ? "bg-purple-800/50 text-white/80" : "bg-slate-800 text-white/50 hover:bg-slate-700/70 hover:text-white/80"}`}
                      onClick={() => router.push("/phase3")}
                    >
                      <BookMarked className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs">
                    <p>Phase 3: Effective Learning Strategies</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currentPhase === 3 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-purple-400/50 animate-pulse"></div>
              )}
              {completedPhases.includes(3) && (
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                </div>
              )}
            </div>
            
            {/* Phase 4 */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                        ${currentPhase === 4 ? "bg-orange-600/80 text-white" : 
                          completedPhases.includes(4) ? "bg-orange-800/50 text-white/80" : "bg-slate-800 text-white/50 hover:bg-slate-700/70 hover:text-white/80"}`}
                      onClick={() => router.push("/phase4")}
                    >
                      <ListTodo className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs">
                    <p>Phase 4: Achieve Your Goals</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currentPhase === 4 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-orange-400/50 animate-pulse"></div>
              )}
              {completedPhases.includes(4) && (
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                </div>
              )}
            </div>
            
            {/* Phase 5 */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                        ${currentPhase === 5 ? "bg-amber-600/80 text-white" : 
                          completedPhases.includes(5) ? "bg-amber-800/50 text-white/80" : "bg-slate-800 text-white/50 hover:bg-slate-700/70 hover:text-white/80"}`}
                      onClick={navigateToPhase5}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs">
                    <p>Phase 5: Monitor Your Learning</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currentPhase === 5 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-amber-400/50 animate-pulse"></div>
              )}
              {completedPhases.includes(5) && (
                <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                </div>
              )}
            </div>
            
            {/* Phase 6/Summary */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                        ${currentPhase === 6 ? "bg-rose-600/80 text-white" : 
                          completedPhases.includes(6) ? "bg-rose-800/50 text-white/80" : "bg-slate-800 text-white/50 hover:bg-slate-700/70 hover:text-white/80"}`}
                      onClick={() => router.push("/summary")}
                    >
                      <Medal className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs">
                    <p>Phase 6: Learning Journey Summary</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currentPhase === 6 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-rose-400/50 animate-pulse"></div>
              )}
            </div>
            
            {/* Progress line overlay */}
            <div 
              className="absolute top-[60px] left-1/2 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-rose-500 rounded-full transform -translate-x-1/2 z-0"
              style={{ 
                height: `calc(${Math.min((currentPhaseOverall / totalPhases) * 100, 100)}% * 0.84)`,
                maxHeight: 'calc(100% - 120px)',
                transition: 'height 0.5s ease-in-out'
              }}
            ></div>
          </div>
          
          {/* Add separation between journey and home button */}
          <div className="h-2"></div>
          
          {/* Home button */}
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full w-10 h-10 text-white/50 hover:text-white hover:bg-white/10 mt-2"
            onClick={() => router.push("/")}
            title="Return Home"
          >
            <Home className="h-5 w-5" />
          </Button>
          
          {/* Progress percentage */}
          <div className="mt-2 bg-slate-800/80 px-2 py-1 rounded-full text-[10px] font-medium text-white/70">
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>
    </div>
  )
}

