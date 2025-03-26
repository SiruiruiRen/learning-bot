"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PlayCircle, CheckCircle, Brain, MoveRight, Sparkles, BookMarked } from "lucide-react"
import KnowledgeCheck from "./knowledge-check"
import { Bot } from "lucide-react"
import SolBotChat from "@/components/solbot-chat"
import { getNextPhase } from "@/lib/phase-data"

// Import the ModuleBar component
import ModuleBar from "@/components/module-bar"

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

// Add this component after any existing imports but before the main component
const SelfExplanationTips = () => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-blue-500/20 mb-6">
      <h3 className="text-lg font-medium text-blue-300 mb-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-blue-900/60 flex items-center justify-center">
          <span className="text-blue-400">💭</span>
        </div>
        Self-Explanation Strategy Guide
      </h3>
      <p className="text-white/80 mb-2">
        Self-explanation is a powerful learning technique where you explain concepts to yourself in your own words.
      </p>
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className="text-blue-400 mt-0.5">1️⃣</div>
          <p className="text-white/80">Read through new material to get a general understanding</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-blue-400 mt-0.5">2️⃣</div>
          <p className="text-white/80">Close the source material and explain the concept in your own words</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-blue-400 mt-0.5">3️⃣</div>
          <p className="text-white/80">Check your explanation against the source to identify gaps</p>
        </div>
      </div>
    </div>
  );
};

// Add this component near the imports but before the main component
const SpacingEffectGuide = () => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-emerald-500/20 mb-6">
      <h3 className="text-lg font-medium text-emerald-300 mb-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-emerald-900/60 flex items-center justify-center">
          <span className="text-emerald-400">⏱️</span>
        </div>
        The Power of Spacing Effect
      </h3>
      <p className="text-white/80 mb-2">
        The spacing effect shows that distributing your study sessions over time is far more effective than cramming all at once.
      </p>
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-red-900/20 p-2 rounded-md border border-red-500/30">
            <h4 className="text-red-300 font-medium mb-1 flex items-center gap-1">
              <span>❌</span> Cramming
            </h4>
            <p className="text-white/70 text-sm">Studying all content in a single marathon session</p>
            <p className="text-white/70 text-sm">Result: Short-term retention only</p>
          </div>
          <div className="bg-green-900/20 p-2 rounded-md border border-green-500/30">
            <h4 className="text-green-300 font-medium mb-1 flex items-center gap-1">
              <span>✅</span> Spacing
            </h4>
            <p className="text-white/70 text-sm">Studying the same content across multiple sessions</p>
            <p className="text-white/70 text-sm">Result: Long-term retention and deeper understanding</p>
          </div>
        </div>
        <div className="p-2 bg-emerald-900/30 rounded-md border border-emerald-500/30">
          <h4 className="text-emerald-300 font-medium mb-1">Optimal Spacing Schedule</h4>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="flex items-center gap-1">
              <div className="text-emerald-400">1️⃣</div>
              <p className="text-white/80">First review: Right after learning</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="text-emerald-400">2️⃣</div>
              <p className="text-white/80">Second review: 1-2 days later</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Phase3Content() {
  const router = useRouter()
  const [viewingVideo, setViewingVideo] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userName, setUserName] = useState("")
  const [step, setStep] = useState(1)

  // Load user name from localStorage
  useEffect(() => {
    try {
      const storedName = localStorage.getItem("solbot_user_name")
      if (storedName) {
        setUserName(storedName)
      }
    } catch (error) {
      console.error("Error loading user name:", error)
    }
  }, [])

  // Knowledge check questions
  const knowledgeChecks = [
    {
      id: 1,
      title: "The Power of Self-Testing",
      question:
        "You just began a unit of a course and have 4 weeks of topics to cover before the unit exam. For each new lesson, the guided reading questions and course outlines make clear that there are a number of facts, definitions, and properties that you'll need to be able to recall when the exam comes. Pick the best strategy, from those below, that will enable you to rehearse this knowledge and ensure you can recall it.",
      options: [
        "Block out the entire day before the exam. Redo all your homework questions to be sure you've rehearsed fully.",
        "Block out the entire day before the exam. Reread all the chapters to be sure you're on top of all the material.",
        "After reading each chapter in advance of the day it is covered, reread each chapter repeatedly in advance of the exam.",
        "After turning in a homework assignment by the deadline, set up reminders in your calendar to re-complete that homework again at least a few times before the exam.",
      ],
      correctAnswer:
        "After turning in a homework assignment by the deadline, set up reminders in your calendar to re-complete that homework again at least a few times before the exam.",
      explanation:
        "Spaced repetition of practice questions is much more effective than cramming or passive rereading. Distributing your practice over time (spaced practice) leads to better long-term retention than concentrating your study in a single session (massed practice).",
    },
    {
      id: 2,
      title: "Spacing Effect and Distributed Practice",
      question: "Pick the study plan that makes best use of the spacing effect.",
      options: [
        "After each class period, Ana downloaded the class outline and looked it over, then she looked them all over right before the exam.",
        "Brad downloaded the course outlines dutifully and reviewed all that had been released every single night up until the exam.",
        "Cora set up a schedule where she would review the materials from a lesson that night, then again three days later, then a week later, then once more right before the exam.",
        "Deneshia downloaded the resources from the course site, and in the week before the exam, she reviewed them every other day.",
      ],
      correctAnswer:
        "Cora set up a schedule where she would review the materials from a lesson that night, then again three days later, then a week later, then once more right before the exam.",
      explanation:
        "Cora's approach uses optimal spacing intervals that increase over time, which research shows leads to better long-term retention. The spacing effect demonstrates that learning is more effective when study sessions are spaced out over time, with increasing intervals between reviews.",
    },
    {
      id: 3,
      title: "Self-Explanation Technique",
      question: "What is self-explanation?",
      options: [
        "It's when you work out a math problem in front of a classroom full of peers",
        "It's when you are trying to explain new information to yourself and make sense of the content",
        "It's when you repeatedly review tests you've already taken",
        "It's when you attend a peer-review session and they explain the concept to you",
      ],
      correctAnswer: "It's when you are trying to explain new information to yourself and make sense of the content",
      explanation:
        "Self-explanation involves actively making sense of new material by explaining it to yourself in your own words, which helps you integrate new information with what you already know. This deepens understanding significantly compared to passive reading or having others explain the content to you.",
    },
  ]

  // Video content
  const videoContent = {
    title: "Science of Learning: Key Strategies",
    description:
      "This comprehensive video covers three powerful learning techniques: retrieval practice, spacing effect, and self-explanation. These evidence-based strategies will transform how you study and retain information.",
    icon: <BookMarked className="h-10 w-10 text-purple-400" />,
  }

  const handleKnowledgeCheckComplete = () => {
    if (currentQuestionIndex < knowledgeChecks.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const handleWatchVideo = () => {
    setViewingVideo(true)
  }

  const handleCompleteVideo = () => {
    setViewingVideo(false)
    setVideoCompleted(true)
  }

  const handleComplete = () => {
    router.push("/phase4")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-slate-800 text-white py-8">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>

        {/* Nebula effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent opacity-30"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={3} />

      {/* Fixed Title Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/20 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <BookMarked className="h-7 w-7 text-purple-500 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
              Science of Learning Foundations
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
          <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <BookMarked className="h-8 w-8 text-purple-500" />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                  Science of Learning Foundations
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-white/80 space-y-4 mb-6">
                <div className="bg-indigo-900/20 p-5 rounded-lg border border-purple-500/30 mb-4">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent mb-3">
                    🧠 Science of Learning Strategies
                  </h2>
                  
                  <div className="space-y-4">
                    <p>
                      {userName ? `Great work so far, ${userName}!` : "Great work so far!"} Welcome to Phase 3, where you'll discover the science-backed techniques that transform average studying into effective learning.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                      <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                        <h3 className="font-bold text-purple-300 flex items-center gap-2">
                          <span className="bg-purple-900/50 w-7 h-7 rounded-full flex items-center justify-center text-white">1</span> 
                          Retrieval Practice
                        </h3>
                        <p className="text-sm mt-1">Test yourself</p>
                      </div>
                      
                      <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                        <h3 className="font-bold text-purple-300 flex items-center gap-2">
                          <span className="bg-purple-900/50 w-7 h-7 rounded-full flex items-center justify-center text-white">2</span> 
                          Spacing Effect
                        </h3>
                        <p className="text-sm mt-1">Distribute learning</p>
                      </div>
                      
                      <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                        <h3 className="font-bold text-purple-300 flex items-center gap-2">
                          <span className="bg-purple-900/50 w-7 h-7 rounded-full flex items-center justify-center text-white">3</span> 
                          Self-Explanation
                        </h3>
                        <p className="text-sm mt-1">Explain in your own words</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 text-sm">
                      <div className="flex-1">
                        <h4 className="font-bold text-indigo-300 mb-1">What you'll do:</h4>
                        <ul className="space-y-1">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <span>Watch a video on evidence-based learning strategies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <span>Take a quiz that reinforces key concepts</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-indigo-300 mb-1">Benefits you'll gain:</h4>
                        <ul className="space-y-1">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <span>Study less but learn more effectively</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <span>Retain information longer for practical application</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Place the learning strategy guide components here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <SelfExplanationTips />
                <SpacingEffectGuide />
              </div>

              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        videoCompleted
                          ? "bg-purple-500 text-white"
                          : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {videoCompleted ? <CheckCircle className="h-4 w-4" /> : "1"}
                    </div>
                    <span className={`text-sm ${videoCompleted ? "text-purple-400" : "text-indigo-400"}`}>
                      Watch Video
                    </span>
                  </div>

                  <div className="h-0.5 flex-1 mx-4 bg-gray-700">
                    <div
                      className={`h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ${
                        videoCompleted ? "w-full" : "w-0"
                      }`}
                    ></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        quizCompleted
                          ? "bg-purple-500 text-white"
                          : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {quizCompleted ? <CheckCircle className="h-4 w-4" /> : "2"}
                    </div>
                    <span className={`text-sm ${quizCompleted ? "text-purple-400" : "text-indigo-400"}`}>
                      Complete Quiz
                    </span>
                  </div>
                </div>
              </div>

              {!videoCompleted ? (
                <>
                  {!viewingVideo ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <Card className="bg-slate-800/50 border border-indigo-500/30 mb-6">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4 mb-4">
                            {videoContent.icon}
                            <div>
                              <h3 className="text-xl font-bold text-white">{videoContent.title}</h3>
                            </div>
                          </div>

                          <Separator className="my-4 bg-indigo-500/20" />

                          <p className="text-white/70 mb-6">{videoContent.description}</p>

                          <div className="bg-indigo-500/10 rounded-lg p-4 mb-6">
                            <h4 className="font-bold text-indigo-400 mb-2">In this video, you'll learn about:</h4>
                            <ul className="space-y-2">
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-white/80">
                                  <span className="font-semibold text-white">Retrieval Practice:</span> How
                                  testing yourself strengthens memory more than rereading
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-white/80">
                                  <span className="font-semibold text-white">Spacing Effect:</span> Why
                                  distributing your study sessions over time improves retention
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-white/80">
                                  <span className="font-semibold text-white">Self-Explanation:</span> How
                                  explaining concepts to yourself deepens understanding
                                </span>
                              </li>
                            </ul>
                          </div>

                          <Button
                            onClick={handleWatchVideo}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                          >
                            <PlayCircle className="mr-2 h-5 w-5" />
                            Watch Video (8 min)
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="space-y-6"
                    >
                      <Card className="bg-slate-800/50 border border-indigo-500/30 overflow-hidden">
                        <div className="aspect-video bg-black/50 flex flex-col items-center justify-center p-6">
                          <div className="text-center space-y-4">
                            <h3 className="text-xl font-bold text-white">Video: {videoContent.title}</h3>
                            <p className="text-white/60 text-sm">[This is a simulation of the video content]</p>

                            <div className="flex justify-center mt-4">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                              >
                                <PlayCircle className="h-16 w-16 text-indigo-400 opacity-70" />
                              </motion.div>
                            </div>
                          </div>

                          <Button
                            onClick={handleCompleteVideo}
                            className="mt-8 bg-white text-indigo-700 hover:bg-white/90"
                          >
                            Complete Video
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </>
              ) : !quizCompleted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-800/50 rounded-lg p-5 border border-indigo-500/30 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                      <h3 className="font-bold text-white">Video Completed!</h3>
                    </div>

                    <p className="text-white/80 mb-2">
                      Great job! Now let's test your understanding with a few questions about the learning strategies
                      covered in the video.
                    </p>

                    <div className="bg-indigo-500/10 rounded-lg p-4">
                      <p className="text-white/80 italic">
                        Answering these questions will help reinforce the concepts through retrieval practice - one of
                        the key strategies you just learned about!
                      </p>
                    </div>
                  </div>

                  {/* Knowledge check for current question */}
                  <KnowledgeCheck
                    key={knowledgeChecks[currentQuestionIndex].id}
                    questionNumber={currentQuestionIndex + 1}
                    question={knowledgeChecks[currentQuestionIndex].question}
                    options={knowledgeChecks[currentQuestionIndex].options}
                    correctAnswer={knowledgeChecks[currentQuestionIndex].correctAnswer}
                    explanation={knowledgeChecks[currentQuestionIndex].explanation}
                    onComplete={handleKnowledgeCheckComplete}
                    totalQuestions={knowledgeChecks.length}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Congratulations!</h3>
                      </div>

                      <p className="text-white/80 mb-6">
                        You've completed the Science of Learning Foundations phase. You now have a strong
                        understanding of key evidence-based learning strategies: retrieval practice, spacing effect,
                        and self-explanation.
                      </p>

                      <div className="bg-white/10 rounded-lg p-4 mb-6">
                        <h4 className="font-bold text-white mb-2">Key Takeaways:</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-white/80">
                              <span className="font-semibold text-white">Test yourself regularly</span> instead of
                              just rereading material
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-white/80">
                              <span className="font-semibold text-white">Space out your study sessions</span> over
                              time rather than cramming
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-white/80">
                              <span className="font-semibold text-white">Explain concepts in your own words</span> to
                              deepen understanding
                            </span>
                          </li>
                        </ul>
                      </div>

                      <Button
                        onClick={handleComplete}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30"
                      >
                        Continue to Strategic Planning
                        <MoveRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

