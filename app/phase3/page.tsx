"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PlayCircle, CheckCircle, Brain, MoveRight, Sparkles, BookMarked, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, HelpCircle, AlertCircle, ArrowRight } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  // Define the cards for easy reference
  const cards = [
    { id: "intro", title: "Learning Strategies" },
    { id: "self-explanation", title: "Self-Explanation Strategy" },
    { id: "spacing-effect", title: "The Power of Spacing Effect" },
    { id: "knowledge-check", title: "Knowledge Check" },
  ]

  // Function to navigate to the next card
  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      // If we're on the last card, complete the phase
      handleComplete()
    }
  }

  // Function to navigate to the previous card
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

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

  // Handle moving to next question
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

  // Knowledge Check Component
  const KnowledgeCheckQuiz = () => {
    // Use a key to force complete component remount between questions
    return (
      <KnowledgeCheckQuestion 
        key={`question-${currentQuestionIndex}`}
        question={knowledgeChecks[currentQuestionIndex]}
        questionIndex={currentQuestionIndex}
        totalQuestions={knowledgeChecks.length}
        onNextQuestion={() => {
          if (currentQuestionIndex < knowledgeChecks.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
          } else {
            setQuizCompleted(true);
          }
        }}
      />
    );
  };

  // Separate component for individual questions to ensure clean state
  const KnowledgeCheckQuestion = ({ 
    question, 
    questionIndex, 
    totalQuestions, 
    onNextQuestion 
  }: { 
    question: any, 
    questionIndex: number, 
    totalQuestions: number, 
    onNextQuestion: () => void
  }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    
    const handleSubmit = () => {
      if (!selectedOption) return;
      
      const correct = selectedOption === question.correctAnswer;
      setIsCorrect(correct);
      setSubmitted(true);
    };
    
    const handleTryAgain = () => {
      setSelectedOption(null);
      setSubmitted(false);
    };
    
    return (
      <Card className="bg-slate-800/50 border border-indigo-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Knowledge Check {questionIndex + 1}</h3>
            </div>
            <span className="text-sm text-white/60">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          </div>

          <p className="text-white/90 mb-6">{question.question}</p>

          <RadioGroup
            value={selectedOption || ""}
            onValueChange={setSelectedOption}
            className="space-y-3"
            disabled={submitted}
          >
            {question.options.map((option: string, index: number) => (
              <div
                key={index}
                className={`flex items-start space-x-2 rounded-lg border p-3 transition-colors ${
                  submitted && option === question.correctAnswer
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : submitted && option === selectedOption
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/10"
                }`}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor={`option-${index}`}
                    className={`text-sm font-medium ${
                      submitted && option === question.correctAnswer
                        ? "text-emerald-400"
                        : submitted && option === selectedOption
                          ? "text-red-400"
                          : "text-white/80"
                    }`}
                  >
                    {option}
                  </Label>
                </div>
                {submitted && option === question.correctAnswer && (
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                )}
                {submitted && option === selectedOption && option !== question.correctAnswer && (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </RadioGroup>

          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-6 p-4 rounded-lg ${
                isCorrect ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-red-500/20 border border-red-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className={`font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                    {isCorrect ? "Correct!" : "Not quite right"}
                  </h4>
                  <p className="text-white/80 mt-1">{question.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex justify-between items-center">
            <div>
              {!submitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedOption}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                >
                  Submit Answer
                </Button>
              ) : !isCorrect ? (
                <Button
                  onClick={handleTryAgain}
                  variant="outline"
                  className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                >
                  Try Again
                </Button>
              ) : null}
            </div>
            
            {/* Next/Complete button for correct answers */}
            {submitted && isCorrect && (
              <Button
                onClick={onNextQuestion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg"
              >
                {questionIndex < totalQuestions - 1 ? "Next Question" : "Complete Quiz"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
                <BookMarked className="h-8 w-8 text-blue-500" />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  {cards[currentCardIndex].title}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Introduction Card */}
              {currentCardIndex === 0 && (
                <div className="space-y-6">
                  <div className="text-white/80 space-y-4">
                    <p>
                      {userName ? `Welcome, ${userName}!` : "Welcome!"} In this phase, you'll explore evidence-based learning strategies backed by cognitive science.
                    </p>
                    <p>
                      Discover powerful techniques such as self-explanation and the spacing effect that can significantly improve your learning efficiency and retention.
                    </p>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20">
                    <h3 className="text-lg font-medium text-blue-300 mb-2">In This Phase You'll Learn:</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-400 mt-0.5">📊</div>
                        <p className="text-white/80">How to use evidence-based learning strategies</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-blue-400 mt-0.5">🔄</div>
                        <p className="text-white/80">The power of spacing effect and distributed practice</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-blue-400 mt-0.5">🧠</div>
                        <p className="text-white/80">Self-explanation techniques for deeper understanding</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Self-Explanation Strategy Card */}
              {currentCardIndex === 1 && <SelfExplanationTips />}
              
              {/* Spacing Effect Guide Card */}
              {currentCardIndex === 2 && <SpacingEffectGuide />}
              
              {/* Knowledge Check Card */}
              {currentCardIndex === 3 && (
                <div>
                  <div className="text-white/80 mb-4">
                    <p>Let's test your understanding of these evidence-based learning strategies.</p>
                  </div>
                  <KnowledgeCheckQuiz />
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
                
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg"
                  onClick={nextCard}
                  disabled={currentCardIndex === 3 && !quizCompleted}
                >
                  {currentCardIndex < cards.length - 1 ? 'Next' : 'Complete & Continue'} <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

