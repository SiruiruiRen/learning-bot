"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PlayCircle, CheckCircle, Brain, MoveRight, Sparkles, BookMarked, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, HelpCircle, AlertCircle, ArrowRight, Map, BookOpen, Video, FileQuestion } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import VideoPlayer from "@/components/video-player"
import KnowledgeCheck from "./knowledge-check"
import PrePostKnowledgeCheck from "@/components/pre-post-knowledge-check"
import { phase3KnowledgeChecks } from "@/lib/knowledge-check-questions"
import { Bot } from "lucide-react"
import SolBotChat from "@/components/solbot-chat"
import { getNextPhase } from "@/lib/phase-data"
import { VerticalNav } from "@/components/vertical-nav"
import ModuleBar from "@/components/module-bar"

// --- Helper function to log events ---
const logEvent = (sessionId: string, eventType: string, metadata: any) => {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      event_type: eventType,
      phase: '3',
      component: 'learning_strategies',
      metadata: metadata,
    }),
  }).catch(error => console.error(`Failed to log event ${eventType}:`, error));
};

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
  const accent = "#d8b26f"
  const surface = "hsl(var(--card) / 0.9)"
  const border = "hsl(var(--border) / 0.75)"
  const pill = "hsl(var(--muted) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  return (
    <div
      className="p-4 rounded-lg mb-6"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      <h3 className="text-lg font-medium mb-2 flex items-center gap-2" style={{ color: accent }}>
        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: pill }}>
          <span style={{ color: accent }}>💭</span>
        </div>
        Self-Explanation Strategy Guide
      </h3>
      <p className="text-foreground opacity-80 mb-2" style={{ color: mutedText }}>
        Self-explanation is a powerful learning technique where you explain concepts to yourself in your own words.
      </p>
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className="mt-0.5" style={{ color: accent }}>1️⃣</div>
          <p className="text-foreground opacity-80" style={{ color: mutedText }}>Read through new material to get a general understanding</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5" style={{ color: accent }}>2️⃣</div>
          <p className="text-foreground opacity-80" style={{ color: mutedText }}>Close the source material and explain the concept in your own words</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5" style={{ color: accent }}>3️⃣</div>
          <p className="text-foreground opacity-80" style={{ color: mutedText }}>Check your explanation against the source to identify gaps</p>
        </div>
      </div>
    </div>
  );
};

const SpacingEffectGuide = () => {
  const accent = "#d8b26f"
  const surface = "hsl(var(--card) / 0.9)"
  const border = "hsl(var(--border) / 0.75)"
  const pill = "hsl(var(--muted) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  return (
    <div
      className="p-4 rounded-lg mb-6"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      <h3 className="text-lg font-medium mb-2 flex items-center gap-2" style={{ color: accent }}>
        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: pill }}>
          <span style={{ color: accent }}>⏱️</span>
        </div>
        The Power of Spacing Effect
      </h3>
      <p className="text-foreground opacity-80 mb-2" style={{ color: mutedText }}>
        The spacing effect shows that distributing your study sessions over time is far more effective than cramming all at once.
      </p>
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-2 rounded-md border" style={{ backgroundColor: surface, borderColor: border }}>
            <h4 className="font-medium mb-1 flex items-center gap-1" style={{ color: accent }}>
              <span>❌</span> Cramming
            </h4>
            <p className="text-foreground opacity-75 text-sm" style={{ color: mutedText }}>Studying all content in a single marathon session</p>
            <p className="text-foreground opacity-75 text-sm" style={{ color: mutedText }}>Result: Short-term retention only</p>
          </div>
          <div className="p-2 rounded-md border" style={{ backgroundColor: surface, borderColor: border }}>
            <h4 className="font-medium mb-1 flex items-center gap-1" style={{ color: accent }}>
              <span>✅</span> Spacing
            </h4>
            <p className="text-foreground opacity-75 text-sm" style={{ color: mutedText }}>Studying the same content across multiple sessions</p>
            <p className="text-foreground opacity-75 text-sm" style={{ color: mutedText }}>Result: Long-term retention and deeper understanding</p>
          </div>
        </div>
        <div className="p-2 rounded-md border" style={{ backgroundColor: surface, borderColor: border }}>
          <h4 className="font-medium mb-1" style={{ color: accent }}>Optimal Spacing Schedule</h4>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="flex items-center gap-1">
              <div>Day 1:</div>
              <div className="text-foreground opacity-90" style={{ color: mutedText }}>Learn / review</div>
            </div>
            <div className="flex items-center gap-1">
              <div>Day 2:</div>
              <div className="text-foreground opacity-90" style={{ color: mutedText }}>Quick recall practice</div>
            </div>
            <div className="flex items-center gap-1">
              <div>Day 4:</div>
              <div className="text-foreground opacity-90" style={{ color: mutedText }}>Short quiz or flashcards</div>
            </div>
            <div className="flex items-center gap-1">
              <div>Day 7:</div>
              <div className="text-foreground opacity-90" style={{ color: mutedText }}>Summarize in your own words</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KnowledgeCheckQuestion = ({
  question,
  questionIndex,
  totalQuestions,
  onNextQuestion,
  sessionId,
}: {
  question: any;
  questionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  sessionId: string | null;
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const accent = "#d8b26f"
  const surface = "hsl(var(--card) / 0.9)"
  const border = "hsl(var(--border) / 0.75)"
  const pill = "hsl(var(--muted) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    const correct = selectedOption === question.correctAnswer;
    setIsCorrect(correct);
    setSubmitted(true);

    if (sessionId) {
      logEvent(sessionId, 'quiz_submission', {
        question_title: question.title,
        selected_answer: selectedOption,
        is_correct: correct,
        attempt_number: 1
      });
    }

    if (correct && questionIndex === totalQuestions - 1) {
      onNextQuestion();
    }
  };
  
  const handleTryAgain = () => {
    setSelectedOption(null);
    setSubmitted(false);
  };
  
  return (
    <Card className="backdrop-blur-md" style={{ backgroundColor: surface, borderColor: border }}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: pill }}>
              <HelpCircle className="h-5 w-5" style={{ color: accent }} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Knowledge Check {questionIndex + 1}</h3>
          </div>
          <span className="text-sm opacity-80" style={{ color: mutedText }}>
            Question {questionIndex + 1} of {totalQuestions}
          </span>
        </div>

        <p className="text-foreground opacity-90 mb-6" style={{ color: mutedText }}>{question.question}</p>

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
                    : "hover:bg-[hsl(var(--muted)_/_0.25)]"
              }`}
              style={{
                borderColor: submitted
                  ? undefined
                  : border,
                backgroundColor: submitted
                  ? undefined
                  : "hsl(var(--card) / 0.78)",
              }}
            >
              <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
              <div className="flex-1">
                <Label
                  htmlFor={`option-${index}`}
                  className={`text-sm font-medium ${
                    submitted && option === question.correctAnswer
                      ? "text-emerald-500"
                      : submitted && option === selectedOption
                        ? "text-red-500"
                        : "text-foreground opacity-80"
                  }`}
                  style={!submitted ? { color: mutedText } : undefined}
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
                <p className="text-muted-foreground mt-1">{question.explanation}</p>
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
                className="shadow-md disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #f5c09a, #ffd2b4)", color: "#1a1412" }}
              >
                Submit Answer
              </Button>
            ) : !isCorrect ? (
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="hover:bg-[hsl(var(--muted)_/_0.25)]"
                style={{ borderColor: border, color: mutedText }}
              >
                Try Again
              </Button>
            ) : null}
          </div>
          
          {/* Next/Complete button for correct answers */}
          {submitted && isCorrect && (
            questionIndex < totalQuestions - 1 ? (
              <Button
                onClick={onNextQuestion}
                className="flex items-center gap-2 shadow-md"
                style={{ background: "linear-gradient(135deg, #f5c09a, #ffd2b4)", color: "#1a1412" }}
              >
                Next Question <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              isCorrect && (
                <div className="text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Quiz Completed!
                </div>
              )
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const KnowledgeCheckQuiz = ({ onComplete, knowledgeChecks, sessionId }: { onComplete: () => void, knowledgeChecks: any[], sessionId: string | null }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < knowledgeChecks.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete();
    }
  };
  
  const currentQuestion = knowledgeChecks[currentQuestionIndex];

  return (
    <KnowledgeCheckQuestion
      key={currentQuestion.id}
      question={currentQuestion}
      questionIndex={currentQuestionIndex}
      totalQuestions={knowledgeChecks.length}
      onNextQuestion={handleNextQuestion}
      sessionId={sessionId}
    />
  );
};

export default function Phase3Content() {
  const router = useRouter()
  const [viewingVideo, setViewingVideo] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [preTestCompleted, setPreTestCompleted] = useState(false)
  const [postTestCompleted, setPostTestCompleted] = useState(false)
  const [videoSkipped, setVideoSkipped] = useState(false)
  const [preTestAnswers, setPreTestAnswers] = useState<{ [questionId: number]: string }>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userName, setUserName] = useState("")
  const [step, setStep] = useState(1)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Define the cards for easy reference
  const cards = [
    { id: "intro", title: "Introduction to Learning Strategies" },
    { id: "self-explanation", title: "Deep Dive: Self-Explanation" },
    { id: "spacing-effect", title: "Deep Dive: Spacing Effect" },
    { id: "pre-test", title: "Pre-Test: Check Your Knowledge" },
    { id: "video", title: "Watch: Key Learning Strategies" },
    { id: "post-test", title: "Knowledge Check: After Video" },
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

  // Load user name and session ID from localStorage
  useEffect(() => {
    try {
      const storedName = localStorage.getItem("solbot_user_name");
      if (storedName) setUserName(storedName);

      const storedSessionId = localStorage.getItem("session_id");
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        // If there's no session ID, the user hasn't gone through onboarding.
        // For development, we'll allow access but log a warning.
        console.warn("No session_id found. Proceeding for development.");
        // router.push('/intro'); // This was causing the redirect
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      // In case of error, we'll still allow access for development.
      // router.push('/intro');
    }
  }, [router]);

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

  const handlePreTestComplete = (answers: { [questionId: number]: string }, allCorrect: boolean) => {
    setPreTestAnswers(answers)
    setPreTestCompleted(true)
  }
  
  const handleSkipVideo = () => {
    setVideoSkipped(true)
    setVideoCompleted(true) // Mark as completed so they can proceed
    nextCard() // Move to post-test
  }
  
  const handlePostTestComplete = (answers: { [questionId: number]: string }, allCorrect: boolean) => {
    setPostTestCompleted(true)
  }

  const handleWatchVideo = () => {
    setViewingVideo(true)
    if (sessionId) {
      logEvent(sessionId, 'video_watch_started', { video_title: videoContent.title });
    }
  }

  const handleCompleteVideo = () => {
    setViewingVideo(false)
    setVideoCompleted(true)
    if (sessionId) {
      logEvent(sessionId, 'video_watch_completed', { video_title: videoContent.title });
    }
  }

  const handleComplete = () => {
    router.push("/phase4")
  }

  const accent = "#d8b26f"

  // Theme-aware neutrals so light/dark share the same structure
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.9)"
  const neutralBorder = "hsl(var(--border) / 0.75)"
  const headerSurface = "hsl(var(--card) / 0.95)"
  const pillSurface = "hsl(var(--muted) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"

  return (
    <div
      className="min-h-screen text-foreground py-8"
      style={{ background: canvasGradient }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(140%_120%_at_80%_20%,rgba(0,0,0,0.04),transparent),radial-gradient(160%_140%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>

      {/* Add Module Bar */}
      <ModuleBar currentPhase={3} />

      <VerticalNav
        currentCardIndex={currentCardIndex}
        totalCards={cards.length}
        onPrev={prevCard}
        onNext={nextCard}
        isNextDisabled={
          (currentCardIndex === 3 && !preTestCompleted) ||
          (currentCardIndex === 4 && !videoCompleted && !videoSkipped) ||
          (currentCardIndex === 5 && !postTestCompleted)
        }
      />

      {/* Fixed Title Header */}
      <div
        className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4"
        style={{ backgroundColor: headerSurface, borderColor: neutralBorder }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <BookMarked className="h-6 w-6 mr-2" style={{ color: accent }} />
            <h2 className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-[rgba(216,178,111,1)] to-[rgba(216,178,111,0.9)] bg-clip-text">
              Phase 3: Effective Learning Strategies
            </h2>
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
            <Card className="backdrop-blur-md border" style={{ borderColor: neutralBorder, backgroundColor: neutralSurface }}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <BookMarked className="h-8 w-8" style={{ color: "#d8b26f" }} />
                <span className="bg-gradient-to-r from-[rgba(216,178,111,1)] to-[rgba(216,178,111,0.9)] bg-clip-text text-transparent">
                  {cards[currentCardIndex].title}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Introduction Card */}
              {currentCardIndex === 0 && (
                <div className="space-y-6">
                  <div
                    className="p-4 rounded-lg mb-6 text-left"
                    style={{
                      backgroundColor: neutralSurface,
                      border: `1px solid ${neutralBorder}`,
                    }}
                  >
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2" style={{ color: accent }}>
                      <Map className="h-5 w-5" />
                      Phase 3 Workflow
                    </h3>
                    <div className="flex items-center justify-center space-x-4 text-foreground">
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <BookOpen className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium">Learn Strategies</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <Video className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium">Watch Video</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <FileQuestion className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium">Knowledge Check</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground space-y-4">
                    <p>
                      {userName ? `Welcome, ${userName}!` : "Welcome!"} In this phase, you'll explore evidence-based learning strategies backed by cognitive science.
                    </p>
                    <p>
                      Discover powerful techniques such as self-explanation and the spacing effect that can significantly improve your learning efficiency and retention.
                    </p>
                  </div>
                  
                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: neutralSurface,
                      borderColor: neutralBorder,
                    }}
                  >
                    <h3 className="text-lg font-medium mb-2" style={{ color: accent }}>In This Phase You'll Learn:</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5" style={{ color: accent }}>📊</div>
                        <p className="text-muted-foreground">How to use evidence-based learning strategies</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5" style={{ color: accent }}>🔄</div>
                        <p className="text-muted-foreground">The power of spacing effect and distributed practice</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5" style={{ color: accent }}>🧠</div>
                        <p className="text-muted-foreground">Self-explanation techniques for deeper understanding</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Self-Explanation Strategy Card */}
              {currentCardIndex === 1 && <SelfExplanationTips />}
              
              {/* Spacing Effect Guide Card */}
              {currentCardIndex === 2 && <SpacingEffectGuide />}

              {/* Video Card */}
              {currentCardIndex === 3 && (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    Watch this video to learn about powerful, evidence-based study techniques.
                    <br />
                    Click the video to enter fullscreen mode.
                  </p>
                  <div className="space-y-2">
                    <VideoPlayer 
                      src="/video/SoL_phase3.mp4"
                      onComplete={handleCompleteVideo}
                      phase="phase3"
                      videoTitle="Science of Learning: Key Strategies"
                    />
                  <div className="text-center text-xs text-muted-foreground">
                      <p>If video doesn't load, try refreshing the page or check browser console for errors.</p>
                    </div>
                  </div>
                  <div
                    className="mt-4 p-3 rounded-lg text-center border"
                    style={{
                      backgroundColor: neutralSurface,
                      borderColor: neutralBorder,
                    }}
                  >
                    <p className="font-semibold" style={{ color: accent }}>After the video:</p>
                    <p className="text-muted-foreground text-sm">You will proceed to the next Knowledge Check.</p>
                  </div>
                </div>
              )}
              
              {/* Knowledge Check Card */}
              {currentCardIndex === 4 && (
                <div>
                  <div className="text-muted-foreground mb-4">
                    <p>Let's test your understanding of these evidence-based learning strategies.</p>
                  </div>
                  <KnowledgeCheckQuiz onComplete={onKnowledgeCheckComplete} knowledgeChecks={knowledgeChecks} sessionId={sessionId} />
                </div>
              )}
              
              {/* Navigation buttons at the bottom of each card */}
              <div className="flex justify-between mt-8">
                {currentCardIndex > 0 ? (
                  <Button 
                    variant="outline"
                    className="border"
                    style={{ borderColor: neutralBorder, color: mutedText }}
                    onClick={prevCard}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                ) : null}
                
                <Button 
                  className="font-semibold px-6 py-2 rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, #d8b26f, #e6c98c)",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
                    color: "#1f1408",
                  }}
                  onClick={nextCard}
                  disabled={(currentCardIndex === 4 && !quizCompleted)}
                >
                  {currentCardIndex < cards.length - 1 ? 'Next' : 'Complete Phase'} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

