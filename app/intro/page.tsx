"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BrainCircuit,
  Target,
  BookMarked,
  Medal,
  Sparkles,
  Compass,
  ListTodo,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import ModuleBar from "@/components/module-bar"
import GuidedTour from "@/components/guided-tour"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const phaseInfo = [
  {
    id: 1,
    title: "Phase 1: What's SRL",
    description: "Understand the self-regulated learning framework.",
    icon: BrainCircuit,
    path: "/phase1",
  },
  {
    id: 2,
    title: "Phase 2: Understand Your Tasks",
    description: "Define learning objectives and identify resources.",
    icon: Target,
    path: "/phase2",
  },
  {
    id: 3,
    title: "Phase 3: Effective Learning Strategies",
    description: "Discover evidence-based learning techniques.",
    icon: BookMarked,
    path: "/phase3",
  },
  {
    id: 4,
    title: "Phase 4: Achieve Your Goals",
    description: "Create a structured plan with specific goals.",
    icon: ListTodo,
    path: "/phase4",
  },
  {
    id: 5,
    title: "Phase 5: Monitor Your Learning",
    description: "Build a system to track your progress and adjust.",
    icon: TrendingUp,
    path: "/phase5",
  },
  {
    id: 6,
    title: "Phase 6: Learning Journey Summary",
    description: "Review your complete learning system.",
    icon: Medal,
    path: "/phase6",
  },
]

export default function IntroPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userYear, setUserYear] = useState("")
  const [userMajor, setUserMajor] = useState("")
  const [challengingCourse, setChallengingCourse] = useState("")
  const [coachTone, setCoachTone] = useState("warm")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const accent = "var(--accent-text)"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.78)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const headerSurface = "hsl(var(--card))"
  const mutedText = "hsl(var(--muted-foreground))"
  const pillSurface = "hsl(var(--muted) / 0.4)"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
  }

  useEffect(() => {
    setIsClient(true)
    // Clear previous session data for a clean start
    try {
      localStorage.removeItem("solbot_phase4_completed_tasks")
      localStorage.removeItem("solbot_long_term_goal")
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
    // Try to retrieve user info from localStorage to pre-fill the form
    try {
      const storedName = localStorage.getItem("solbot_user_name")
      if (storedName) setUserName(storedName)
      const storedEmail = localStorage.getItem("solbot_user_email")
      if (storedEmail) setUserEmail(storedEmail)
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = async () => {
    if (!userName || !userEmail) {
      alert("Please enter your name and email to begin.")
      return
    }
    setIsSubmitting(true)

    const profile_data = {
      year: userYear,
      major: userMajor,
      challenging_course: challengingCourse,
      coach_tone: coachTone,
    }

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          profile_data: profile_data,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.detail || "Failed to start session.");
      }
      
      localStorage.setItem("session_id", result.data.session_id);
      localStorage.setItem("user_id", result.data.user_id);
      localStorage.setItem("solbot_user_name", userName);
      localStorage.setItem("solbot_coach_tone", coachTone);

      router.push("/phase1");

    } catch (error) {
      console.error("Onboarding failed:", error);
      alert(`There was an error starting your session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen text-foreground flex items-center justify-center px-4" style={{ background: canvasGradient }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ backgroundColor: neutralSurface, borderColor: neutralBorder, color: mutedText }}
          >
            <Sparkles className="h-5 w-5" style={{ color: accent }} />
            <span className="text-base">Loading your experience...</span>
          </div>
          <p className="text-base" style={{ color: mutedText }}>
            Preparing your learning journey.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-foreground" style={{ background: canvasGradient }}>
      <GuidedTour />
      <div className="container mx-auto px-4 py-8 lg:pl-20">
        <ModuleBar currentPhase={0} />
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card style={{ backgroundColor: headerSurface, borderColor: neutralBorder }}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <Compass className="h-8 w-8" style={{ color: accent }} />
                  <CardTitle className="text-3xl font-bold text-center">
                    Science of Learning to Learn Bot
                  </CardTitle>
                </div>
                <p className="text-center text-lg" style={{ color: mutedText }}>
                  A 90-minute, evidence-based training to help you study more effectively.
                </p>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Card data-tour="main-ai" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Why this matters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-base" style={{ color: mutedText }}>
                <div className="space-y-2">
                  <p className="font-medium text-foreground text-lg">Do any of these sound familiar?</p>
                  <ul className="space-y-2 ml-1">
                    <li className="flex items-start gap-2 text-base">
                      <span style={{ color: accent }}>•</span>
                      Are you having trouble achieving the grades you want?
                    </li>
                    <li className="flex items-start gap-2 text-base">
                      <span style={{ color: accent }}>•</span>
                      Is studying taking too much of your time?
                    </li>
                    <li className="flex items-start gap-2 text-base">
                      <span style={{ color: accent }}>•</span>
                      Do you soon forget what you studied?
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-foreground text-lg">The SoLBot Advantage</p>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                    <p className="text-base">
                      <strong>Evidence-Based:</strong> This training teaches strategies proven to improve exam scores and course grades compared to standard studying.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                    <p className="text-base">
                      <strong>AI-Guided Coaching:</strong> SoLBot acts as your personal coach, providing interactive lessons and feedback to help you apply these skills to any course you choose.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Card data-tour="phases" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Your learning journey</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {phaseInfo.map((phase, index) => (
                  <div
                    key={phase.path}
                    className="w-full text-left flex items-start gap-3 rounded-xl border p-3"
                    style={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: neutralBorder,
                      boxShadow: "0 10px 22px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: pillSurface }}
                    >
                      <phase.icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{phase.title}</h4>
                      <p className="text-base" style={{ color: mutedText }}>{phase.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <Card data-tour="form" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Start your personalized session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base" style={{ color: mutedText }}>
                  We'll customize the AI coach to your specific context.
                </p>
                {isClient ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base font-medium text-foreground">Full Name</Label>
                      <Input
                        id="name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="border"
                        style={{ backgroundColor: "hsl(var(--card))", borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-medium text-foreground">Email Address</Label>
                      <Input
                        id="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="border"
                        style={{ backgroundColor: "hsl(var(--card))", borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                        placeholder="Enter your email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-base font-medium text-foreground">Academic Level</Label>
                      <Select value={userYear} onValueChange={setUserYear}>
                        <SelectTrigger
                          className="w-full border"
                          style={{ backgroundColor: "hsl(var(--card))", borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                        >
                          <SelectValue placeholder="Select academic level" />
                        </SelectTrigger>
                        <SelectContent
                          className="border"
                          style={{ backgroundColor: "hsl(var(--card))", borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                        >
                          <SelectItem value="Freshman">Undergraduate - Freshman</SelectItem>
                          <SelectItem value="Sophomore">Undergraduate - Sophomore</SelectItem>
                          <SelectItem value="Junior">Undergraduate - Junior</SelectItem>
                          <SelectItem value="Senior">Undergraduate - Senior</SelectItem>
                          <SelectItem value="Master">Graduate - Master's</SelectItem>
                          <SelectItem value="PhD">Graduate - Doctoral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="major" className="text-base font-medium text-foreground">Field of Study</Label>
                      <Input
                        id="major"
                        value={userMajor}
                        onChange={(e) => setUserMajor(e.target.value)}
                        className="border"
                        style={{ backgroundColor: "hsl(var(--card))", borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                        placeholder="Enter your major or field"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="course" className="text-base font-medium text-foreground">
                        Target Course <span className="text-sm font-normal" style={{ color: mutedText }}>(optional – for planning examples)</span>
                      </Label>
                      <Input
                        id="course"
                        value={challengingCourse}
                        onChange={(e) => setChallengingCourse(e.target.value)}
                        className="border"
                        style={{ backgroundColor: "hsl(var(--card))", borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                        placeholder="e.g., Organic Chemistry, Research Methods"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium text-foreground">How should SoLBot communicate with you?</Label>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          {[
                            { value: "warm" as const, label: "Warm & encouraging", tip: "Supportive and encouraging tone." },
                            { value: "direct" as const, label: "Concise & direct", tip: "Brief and to-the-point feedback." },
                          ].map((option) => (
                            <Tooltip key={option.value}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => setCoachTone(option.value)}
                                  className="flex-1 px-3 py-2 rounded-lg text-base font-medium border transition-all"
                                  style={{
                                    backgroundColor: coachTone === option.value ? "#b8892e" : "hsl(var(--card))",
                                    borderColor: coachTone === option.value ? "#b8892e" : neutralBorder,
                                    color: coachTone === option.value ? "#fff" : "hsl(var(--foreground))",
                                  }}
                                >
                                  {option.label}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px] text-sm">
                                <p>{option.tip}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !userName || !userEmail}
                      className="w-full font-semibold"
                      style={primaryButtonStyle}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[rgba(0,0,0,0.4)] mr-2" />
                          Initializing intervention session...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          Begin Learning Intervention
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: neutralBorder }}></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

