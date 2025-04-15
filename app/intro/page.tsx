"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BrainCircuit, 
  Target, 
  LineChart, 
  BookMarked, 
  Medal, 
  Sparkles, 
  Compass, 
  Flag, 
  ListTodo, 
  TrendingUp 
} from "lucide-react"
import ModuleBar from "@/components/module-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function IntroPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userYear, setUserYear] = useState<string>("")
  const [userMajor, setUserMajor] = useState<string>("")
  const [challengingCourse, setChallengingCourse] = useState<string>("")
  const [confidence, setConfidence] = useState<string>("")
  const [motivation, setMotivation] = useState<string>("")
  const [otherMotivation, setOtherMotivation] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Load user data on component mount - client-side only
  useEffect(() => {
    setIsClient(true)
    try {
      const storedUserId = localStorage.getItem("userId")
      if (storedUserId) {
        setUserId(storedUserId)
      } else {
        // Generate a fallback ID if not in localStorage
        const fallbackId: string = `user-${Math.random().toString(36).substring(2, 9)}`
        setUserId(fallbackId)
        localStorage.setItem("userId", fallbackId)
      }
      
      const storedName = localStorage.getItem("solbot_user_name")
      if (storedName) {
        setUserName(storedName)
      }
      
      const storedEmail = localStorage.getItem("solbot_user_email")
      if (storedEmail) {
        setUserEmail(storedEmail)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      // Generate a temporary ID that won't be persisted
      setUserId(`temp-${Math.random().toString(36).substring(2, 9)}` as any)
    }
  }, [])

  const handleSubmit = () => {
    setIsSubmitting(true)
    
    // Create a safe userId from the name (if provided) or use the existing one
    let newUserId = userId;
    if (userName.trim()) {
      // Create a URL-safe version of the name to use as user ID
      newUserId = `user-${userName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
    
    // Save user information to localStorage
    if (userName) {
      localStorage.setItem("solbot_user_name", userName)
    }
    if (userEmail) {
      localStorage.setItem("solbot_user_email", userEmail)
    }
    if (userYear) {
      localStorage.setItem("solbot_user_year", userYear)
    }
    if (userMajor) {
      localStorage.setItem("solbot_user_major", userMajor)
    }
    if (challengingCourse) {
      localStorage.setItem("solbot_challenging_course", challengingCourse)
    }
    if (confidence) {
      localStorage.setItem("solbot_confidence", confidence)
    }
    if (motivation) {
      localStorage.setItem("solbot_motivation", motivation === "Other" ? otherMotivation : motivation)
    }
    
    // Navigate to the next phase
    setTimeout(() => {
      router.push("/phase1")
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-indigo-900 text-white py-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect with indigo tone */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={0} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-indigo-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Compass className="h-7 w-7 text-indigo-500 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Welcome to SoLBot
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Compass className="h-8 w-8 text-indigo-500" />
                <span className="bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
                  Welcome to SoLBot
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 space-y-4 mb-6">
                <p>
                  SoLBot is your AI learning coach, here to transform how you learn using 
                  <span className="text-blue-400 font-medium"> research-backed methods</span> from cognitive science.
                </p>
                
                <div className="bg-slate-800/50 p-4 rounded-lg border border-indigo-500/20">
                  <p className="mb-3">Together, we'll build your personalized learning system through <strong>6 interactive phases</strong>:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <BrainCircuit className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span><span className="text-indigo-300 font-medium">Phase 1:</span> Master the Self-Regulated Learning Framework</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span><span className="text-purple-300 font-medium">Phase 2:</span> Define Clear Learning Objectives</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <BookMarked className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span><span className="text-blue-300 font-medium">Phase 3:</span> Discover Science-Based Learning Strategies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ListTodo className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><span className="text-emerald-300 font-medium">Phase 4:</span> Create Your Strategic Learning Plan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span><span className="text-amber-300 font-medium">Phase 5:</span> Monitor Progress and Adapt Your Approach</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Medal className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span><span className="text-rose-300 font-medium">Phase 6:</span> Complete Your Learning Success Blueprint</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg border border-indigo-500/20 mt-6">
                  <h3 className="text-lg font-medium text-indigo-300 mb-4">Learning Outcomes</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="text-blue-400 font-bold">🔍</div>
                      <div>
                        <span className="text-blue-300 font-medium">Metacognitive Awareness</span> - 
                        Develop deeper understanding of your learning processes
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="text-purple-400 font-bold">📊</div>
                      <div>
                        <span className="text-purple-300 font-medium">Strategic Planning</span> - 
                        Master techniques to organize and prioritize academic tasks
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="text-emerald-400 font-bold">⚙️</div>
                      <div>
                        <span className="text-emerald-300 font-medium">Adaptive Learning</span> - 
                        Customize approaches to different subject matters and contexts
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="text-amber-400 font-bold">📈</div>
                      <div>
                        <span className="text-amber-300 font-medium">Performance Enhancement</span> - 
                        Improve academic outcomes through evidence-based methods
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* User Information Form */}
              <div className="mt-8 bg-slate-800/70 p-6 rounded-lg border border-indigo-500/30">
                <h3 className="text-xl font-medium text-indigo-300 mb-4">Let's get to know you</h3>
                
                {isClient ? (
                <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">What's your name?</Label>
                    <Input
                      id="name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-slate-800 border-indigo-500/30 focus:border-indigo-400 text-white"
                      placeholder="Your name"
                    />
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">What's your email?</Label>
                    <Input
                      id="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="bg-slate-800 border-indigo-500/30 focus:border-indigo-400 text-white"
                      placeholder="Your email"
                    />
                  </div>
                  
                  {/* Academic Year */}
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-white">What year are you in school?</Label>
                    <Select value={userYear} onValueChange={setUserYear}>
                      <SelectTrigger className="bg-slate-800 border-indigo-500/30 focus:border-indigo-400 text-white">
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-indigo-500/30">
                        <SelectItem value="Freshman">Freshman</SelectItem>
                        <SelectItem value="Sophomore">Sophomore</SelectItem>
                        <SelectItem value="Junior">Junior</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Master">Master</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Major */}
                  <div className="space-y-2">
                    <Label htmlFor="major" className="text-white">What's your major or field of study?</Label>
                    <Input
                      id="major"
                      value={userMajor}
                      onChange={(e) => setUserMajor(e.target.value)}
                      className="bg-slate-800 border-indigo-500/30 focus:border-indigo-400 text-white"
                      placeholder="Your major or field of study"
                    />
                  </div>
                  
                  {/* Challenging Course */}
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-white">Which course do you find most challenging right now?</Label>
                    <Input
                      id="course"
                      value={challengingCourse}
                      onChange={(e) => setChallengingCourse(e.target.value)}
                      className="bg-slate-800 border-indigo-500/30 focus:border-indigo-400 text-white"
                      placeholder="Your most challenging course"
                    />
                  </div>
                  
                  {/* Confidence */}
                  <div className="space-y-2">
                    <Label className="text-white">How confident do you feel about your current study methods?</Label>
                    <RadioGroup value={confidence} onValueChange={setConfidence} className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Very confident" id="confidence-1" />
                        <Label htmlFor="confidence-1" className="text-white">Very confident</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Somewhat confident" id="confidence-2" />
                        <Label htmlFor="confidence-2" className="text-white">Somewhat confident</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Not very confident" id="confidence-3" />
                        <Label htmlFor="confidence-3" className="text-white">Not very confident</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Need lots of improvement" id="confidence-4" />
                        <Label htmlFor="confidence-4" className="text-white">Need lots of improvement</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Motivation */}
                  <div className="space-y-2">
                    <Label className="text-white">What motivates you most in your studies?</Label>
                    <RadioGroup value={motivation} onValueChange={setMotivation} className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Career goals" id="motivation-1" />
                        <Label htmlFor="motivation-1" className="text-white">Career goals</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Personal interest" id="motivation-2" />
                        <Label htmlFor="motivation-2" className="text-white">Personal interest</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Academic achievement" id="motivation-3" />
                        <Label htmlFor="motivation-3" className="text-white">Academic achievement</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Making family proud" id="motivation-4" />
                        <Label htmlFor="motivation-4" className="text-white">Making family proud</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="motivation-5" />
                        <Label htmlFor="motivation-5" className="text-white">Other</Label>
                      </div>
                    </RadioGroup>
                    
                    {motivation === "Other" && (
                      <Input
                        value={otherMotivation}
                        onChange={(e) => setOtherMotivation(e.target.value)}
                        className="mt-2 bg-slate-800 border-indigo-500/30 focus:border-indigo-400 text-white"
                        placeholder="Please specify"
                      />
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !userName}
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 mt-4"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </div>
                    ) : (
                      "Begin Your Learning Journey"
                    )}
                  </Button>
                </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Add subtle animated gradient background */}
      <div className="fixed inset-0 -z-20 opacity-25 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-blue-900/20 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>
    </div>
  )
}

