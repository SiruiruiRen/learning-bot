"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Medal, ChevronRight, CheckCircle } from "lucide-react"
import ModuleBar from "@/components/module-bar"

export default function Phase6Page() {
  const router = useRouter()
  const [courseName, setCourseName] = useState<string>("your course")
  const [answer, setAnswer] = useState<string>("")
  const [aimingGrade, setAimingGrade] = useState<string>("")
  const [expectedGrade, setExpectedGrade] = useState<string>("")
  const [preparationLevel, setPreparationLevel] = useState<string>("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const GRADE_OPTIONS = ["F", "D", "C", "B", "A"]
  const PREP_OPTIONS = ["Very prepared", "Mostly", "Somewhat", "Not very", "Not at all"]

  const accent = "var(--accent-text)"
  const accentHex = "#7a5a1e"  // for opacity patterns only
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
  }

  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id")
    const storedUserId = localStorage.getItem("user_id")
    
    if (storedSessionId) setSessionId(storedSessionId)
    if (storedUserId) setUserId(storedUserId)

    // Fetch course name from user profile
    const fetchCourseName = async () => {
      if (storedUserId) {
        try {
          const response = await fetch(`/api/user/${storedUserId}`)
          if (response.ok) {
            const userData = await response.json()
            if (userData.profile_data) {
              const profileData = typeof userData.profile_data === 'string' 
                ? JSON.parse(userData.profile_data) 
                : userData.profile_data
              if (profileData.challenging_course) {
                setCourseName(profileData.challenging_course)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching course name:", error)
          // Fallback: try to get from session metadata or localStorage
          try {
            if (storedSessionId) {
              const sessionResponse = await fetch(`/api/summary?session_id=${storedSessionId}`)
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json()
                if (sessionData.user?.profileData) {
                  const profileData = typeof sessionData.user.profileData === 'string'
                    ? JSON.parse(sessionData.user.profileData)
                    : sessionData.user.profileData
                  if (profileData.challenging_course) {
                    setCourseName(profileData.challenging_course)
                  }
                }
              }
            }
          } catch (fallbackError) {
            console.error("Fallback course name fetch failed:", fallbackError)
          }
        }
      }
    }

    fetchCourseName()
  }, [])

  const handleSubmit = async () => {
    if (!answer.trim()) return

    setIsSubmitted(true)

    // Log submission and save answer
    if (sessionId) {
      try {
        // Log event
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: 'post_assessment_submitted',
            phase: 'phase6',
            component: 'final_assessment',
            metadata: {
              course_name: courseName,
              answer_length: answer.length,
              aiming_grade: aimingGrade || null,
              expected_grade: expectedGrade || null,
              preparation_level: preparationLevel || null,
              timestamp: new Date().toISOString()
            }
          })
        })
        
        // Also save the answer as user data for research purposes
        if (userId) {
          await fetch(`/api/user-data/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data_type: 'final_exam_preparation_plan',
              value: answer,
              metadata: {
                course_name: courseName,
                phase: 'phase6',
                timestamp: new Date().toISOString()
              }
            })
          }).catch(err => console.error("Failed to save answer:", err))
        }
      } catch (error) {
        console.error("Failed to log submission:", error)
      }
    }

    // Navigate to summary after a short delay
    setTimeout(() => {
      router.push("/summary")
    }, 1500)
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{ background: canvasGradient, color: "hsl(var(--foreground))" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(140%_120%_at_80%_20%,rgba(0,0,0,0.04),transparent),radial-gradient(160%_140%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>

      <ModuleBar currentPhase={6} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4" style={{ backgroundColor: "hsl(var(--card) / 0.9)", borderColor: neutralBorder }}>
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Medal className="h-7 w-7 mr-2" style={{ color: accent }} />
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: accent }}>
              Phase 6: Summary & Final Assessment
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <Card style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Medal className="h-8 w-8" style={{ color: accent }} />
                <span style={{ color: accent }}>
                  Final Assessment
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="min-h-[500px] p-6">
              {!isSubmitted ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-lg" style={{ color: "hsl(var(--foreground))" }}>
                      Think about your upcoming exam in <strong style={{ color: accent }}>{courseName}</strong>.
                    </p>
                    <p className="text-base" style={{ color: mutedText }}>
                      Based on what you learned in this training, describe your complete plan to prepare for this exam.
                    </p>
                  </div>

                  {/* Scale questions (Shunki-selected) */}
                  <div className="space-y-4 p-4 rounded-lg border" style={{ backgroundColor: "hsl(var(--muted) / 0.3)", borderColor: neutralBorder }}>
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Quick check-in:</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs block mb-1.5" style={{ color: mutedText }}>What grade are you aiming to earn?</label>
                        <div className="flex flex-wrap gap-1.5">
                          {GRADE_OPTIONS.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setAimingGrade(g)}
                              className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
                              style={{
                                borderColor: aimingGrade === g ? accent : neutralBorder,
                                backgroundColor: aimingGrade === g ? `${accentHex}20` : "transparent",
                                color: aimingGrade === g ? accent : "hsl(var(--foreground))"
                              }}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs block mb-1.5" style={{ color: mutedText }}>What grade do you think you will achieve?</label>
                        <div className="flex flex-wrap gap-1.5">
                          {GRADE_OPTIONS.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setExpectedGrade(g)}
                              className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
                              style={{
                                borderColor: expectedGrade === g ? accent : neutralBorder,
                                backgroundColor: expectedGrade === g ? `${accentHex}20` : "transparent",
                                color: expectedGrade === g ? accent : "hsl(var(--foreground))"
                              }}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs block mb-1.5" style={{ color: mutedText }}>How well have you prepared to achieve the grade you are aiming for?</label>
                        <div className="flex flex-wrap gap-1.5">
                          {PREP_OPTIONS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPreparationLevel(p)}
                              className="px-2.5 py-1.5 text-xs rounded-lg border transition-colors"
                              style={{
                                borderColor: preparationLevel === p ? accent : neutralBorder,
                                backgroundColor: preparationLevel === p ? `${accentHex}20` : "transparent",
                                color: preparationLevel === p ? accent : "hsl(var(--foreground))"
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                      Your Exam Preparation Plan:
                    </label>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Describe your complete plan to prepare for your exam, including how you'll use the learning strategies, goal-setting, and monitoring techniques you learned..."
                      className="min-h-[300px]"
                      style={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: neutralBorder,
                        color: "hsl(var(--foreground))"
                      }}
                    />
                    {!answer.trim() && (
                      <p className="text-sm text-red-500">* This question is required</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={!answer.trim()}
                      className="font-semibold"
                      style={primaryButtonStyle}
                      title="Submit your assessment"
                    >
                      Submit Assessment
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center space-y-4 py-8"
                >
                  <CheckCircle className="h-16 w-16" style={{ color: accent }} />
                  <h3 className="text-2xl font-bold" style={{ color: accent }}>
                    Assessment Submitted!
                  </h3>
                  <p style={{ color: mutedText }}>
                    Thank you for completing the training. Redirecting to your summary...
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
