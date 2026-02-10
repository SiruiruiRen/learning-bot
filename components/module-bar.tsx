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
type ModuleColor = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'phase6';
type ColorClasses = {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  gradient: string;
  hex: string;
  textHex: string;
  accentHex: string;
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
      name: "Phase 1",
      icon: <BrainCircuit className="h-5 w-5" />,
      color: "phase1" as ModuleColor,
      phases: [1],
      phaseNames: ["What's SRL"],
      phaseIcons: [<BrainCircuit className="h-5 w-5" />],
      phaseDescriptions: [
        "Understand the self-regulated learning framework that will guide your learning journey",
      ],
      description: "Understand SRL",
    },
    {
      name: "Phase 2",
      icon: <Target className="h-5 w-5" />,
      color: "phase2" as ModuleColor,
      phases: [2],
      phaseNames: ["Understand Your Tasks"],
      phaseIcons: [<Target className="h-5 w-5" />],
      phaseDescriptions: [
        "Define your learning objectives and identify resources to support your learning goals",
      ],
      description: "Clarify tasks",
    },
    {
      name: "Phase 3",
      icon: <BookMarked className="h-5 w-5" />,
      color: "phase3" as ModuleColor,
      phases: [3],
      phaseNames: ["Effective Learning Strategies"],
      phaseIcons: [<BookMarked className="h-5 w-5" />],
      phaseDescriptions: [
        "Discover evidence-based learning techniques like retrieval practice and spaced repetition",
      ],
      description: "Learn strategies",
    },
    {
      name: "Phase 4",
      icon: <ListTodo className="h-5 w-5" />,
      color: "phase4" as ModuleColor,
      phases: [4],
      phaseNames: ["Achieve Your Goals"],
      phaseIcons: [<ListTodo className="h-5 w-5" />],
      phaseDescriptions: [
        "Create a structured plan with specific goals and contingency strategies for obstacles",
      ],
      description: "Plan goals",
    },
    {
      name: "Phase 5",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "phase5" as ModuleColor,
      phases: [5],
      phaseNames: ["Monitor Your Learning"],
      phaseIcons: [<TrendingUp className="h-5 w-5" />],
      phaseDescriptions: [
        "Build a system to track your progress and adjust your approach",
      ],
      description: "Monitor progress",
    },
    {
      name: "Phase 6",
      icon: <Medal className="h-5 w-5" />,
      color: "phase6" as ModuleColor,
      phases: [6],
      phaseNames: ["Summary & Post Assessment"],
      phaseIcons: [<Medal className="h-5 w-5" />],
      phaseDescriptions: [
        "Complete final assessment and review your learning journey",
      ],
      description: "Summarize",
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
  const isSummaryPage = pathname === '/summary';
  const displayPhase = isSummaryPage ? 6 : currentPhase;
  
  const currentModule =
    displayPhase > 0 ? modules.find((module) => module.phases.includes(displayPhase)) || modules[0] : null
  const currentModuleIndex = displayPhase > 0 ? modules.findIndex((module) => module.phases.includes(displayPhase)) : -1
  const currentPhaseIndex = displayPhase > 0 && currentModule ? currentModule.phases.indexOf(displayPhase) : -1
  const currentPhaseName = displayPhase > 0 && currentModule ? currentModule.phaseNames[currentPhaseIndex] : ""
  const currentPhaseIcon = displayPhase > 0 && currentModule && currentModule.phaseIcons ? currentModule.phaseIcons[currentPhaseIndex] : null

  // Get color classes for the current module
  const sharedBg = "bg-[hsl(var(--card))]"
  const sharedBgLight = "bg-[hsl(var(--card)_/_0.8)]"
  const sharedText = "text-[hsl(var(--foreground))]"
  const sharedBorder = "border-[hsl(var(--border))]"
  const accentHex = "#d8b26f"
  const colorMap: Record<ModuleColor, ColorClasses> = {
    phase1: {
      bg: sharedBg,
      bgLight: sharedBgLight,
      text: sharedText,
      border: sharedBorder,
      gradient: "from-[hsl(var(--card))] to-[hsl(var(--card))]",
      hex: accentHex,
      textHex: accentHex,
      accentHex,
    },
    phase2: {
      bg: sharedBg,
      bgLight: sharedBgLight,
      text: sharedText,
      border: sharedBorder,
      gradient: "from-[hsl(var(--card))] to-[hsl(var(--card))]",
      hex: accentHex,
      textHex: accentHex,
      accentHex,
    },
    phase3: {
      bg: sharedBg,
      bgLight: sharedBgLight,
      text: sharedText,
      border: sharedBorder,
      gradient: "from-[hsl(var(--card))] to-[hsl(var(--card))]",
      hex: accentHex,
      textHex: accentHex,
      accentHex,
    },
    phase4: {
      bg: sharedBg,
      bgLight: sharedBgLight,
      text: sharedText,
      border: sharedBorder,
      gradient: "from-[hsl(var(--card))] to-[hsl(var(--card))]",
      hex: accentHex,
      textHex: accentHex,
      accentHex,
    },
    phase5: {
      bg: sharedBg,
      bgLight: sharedBgLight,
      text: sharedText,
      border: sharedBorder,
      gradient: "from-[hsl(var(--card))] to-[hsl(var(--card))]",
      hex: accentHex,
      textHex: accentHex,
      accentHex,
    },
    phase6: {
      bg: sharedBg,
      bgLight: sharedBgLight,
      text: sharedText,
      border: sharedBorder,
      gradient: "from-[hsl(var(--card))] to-[hsl(var(--card))]",
      hex: accentHex,
      textHex: accentHex,
      accentHex,
    },
  }
  const colors = currentModule ? colorMap[currentModule.color] : colorMap.phase1

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
              <h2 className="text-base font-bold text-white">SoL2LBot</h2>
            </div>

            {displayPhase > 0 && currentModule ? (
              <button
                onClick={() => setExpandedSidebar(!expandedSidebar)}
                className={`flex items-center px-3 py-1.5 rounded-full transition-colors
                  ${colors.bgLight} ${colors.text} border ${colors.border}`}
              >
                <div className={`mr-1.5 ${colors.text}`}>
                  {currentPhaseIcon || currentModule.icon}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">
                  Phase {displayPhase} - {currentPhaseName}
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
                          phase <= displayPhase ? "bg-white" : "bg-slate-700"
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
                        const isActive = phase === displayPhase;
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

  // Desktop sidebar - theme-aware neutrals with phase accents
  const neutralSurface = "hsl(var(--card) / 0.9)"
  const neutralBorder = "hsl(var(--border) / 0.9)"
  const neutralMuted = "hsl(var(--foreground) / 0.75)"

  return (
    <div data-tour="sidebar" className="fixed left-3 top-1/2 transform -translate-y-1/2 z-30 hidden lg:block">
      <div
        className="backdrop-blur-md rounded-2xl p-3 shadow-xl w-auto border"
        style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
      >
        <div className="flex flex-col items-center">
          {/* Title */}
          <div className="text-xs font-medium mb-3 px-1" style={{ color: neutralMuted }}>JOURNEY</div>

          {/* Learning Journey Path */}
          <div className="relative flex flex-col items-center">
            {/* Background Path - positioned to not overlap with icons */}
            <div
              className="absolute top-[60px] bottom-0 w-0.5 left-1/2 transform -translate-x-1/2"
              style={{
                height: "calc(100% - 120px)",
                backgroundImage:
                  "repeating-linear-gradient(to bottom, hsl(var(--muted) / 0.45), hsl(var(--muted) / 0.45) 8px, transparent 8px, transparent 16px)"
              }}
            />
            
            {/* Start point */}
            <div className="relative mb-4 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                    className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-full border"
                    style={{
                      color: displayPhase === 0 ? "#9fc5ff" : neutralMuted,
                      borderColor: neutralBorder,
                      backgroundColor: displayPhase === 0 ? "hsl(var(--muted) / 0.25)" : "hsl(var(--card) / 0.78)"
                    }}
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
              {displayPhase === 0 && (
                <div className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 border-indigo-400/50 animate-pulse"></div>
              )}
            </div>
            
            {[
              { id: 1, label: "Phase 1: What's SRL", icon: <BrainCircuit className="h-4 w-4" />, color: colorMap.phase1, action: () => navigateToPhase(1) },
              { id: 2, label: "Phase 2: Understand Your Tasks", icon: <Target className="h-4 w-4" />, color: colorMap.phase2, action: () => router.push("/phase2") },
              { id: 3, label: "Phase 3: Effective Learning Strategies", icon: <BookMarked className="h-4 w-4" />, color: colorMap.phase3, action: () => router.push("/phase3") },
              { id: 4, label: "Phase 4: Achieve Your Goals", icon: <ListTodo className="h-4 w-4" />, color: colorMap.phase4, action: () => router.push("/phase4") },
              { id: 5, label: "Phase 5: Monitor Your Learning", icon: <TrendingUp className="h-4 w-4" />, color: colorMap.phase5, action: navigateToPhase5 },
              { id: 6, label: "Phase 6: Summary & Post Assessment", icon: <Medal className="h-4 w-4" />, color: colorMap.phase6, action: () => router.push("/phase6") },
            ].map((phase) => {
              const isActive = displayPhase === phase.id;
              const isCompleted = completedPhases.includes(phase.id);
              const accentBg = `${phase.color.textHex}33`;
              const bg = isActive
                ? accentBg
                : isCompleted
                  ? "hsl(var(--card) / 0.85)"
                  : "hsl(var(--card) / 0.8)";
              const textColor = isActive ? phase.color.textHex : isCompleted ? "hsl(var(--foreground))" : neutralMuted;
              const borderColor = isActive ? `${phase.color.textHex}66` : neutralBorder;
              const pulseColor = `${phase.color.textHex}80`;
              return (
                <div className="relative mb-4 z-10" key={phase.id}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                          style={{ backgroundColor: bg, color: textColor, border: borderColor }}
                          onClick={phase.action}
                        >
                          {phase.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-xs text-white">
                        <p className="text-white">{phase.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {isActive && (
                    <div
                      className="absolute -left-1 -top-1 w-12 h-12 rounded-full border-2 animate-pulse"
                      style={{ borderColor: pulseColor }}
                    ></div>
                  )}
                  {isCompleted && (
                    <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    </div>
                  )}
                </div>
              )
            })}
            
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
            className="rounded-full w-10 h-10 mt-2"
            style={{ color: neutralMuted }}
            onClick={() => router.push("/")}
            title="Return Home"
          >
            <Home className="h-5 w-5" />
          </Button>
          
          {/* Progress percentage */}
          <div
            className="mt-2 px-2 py-1 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: "hsl(var(--card) / 0.7)", color: neutralMuted }}
          >
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>
    </div>
  )
}

