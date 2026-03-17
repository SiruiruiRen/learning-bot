"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Target,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  PlayCircle,
  BookOpen,
  Search,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Map,
  FileQuestion,
  Video,
  MessageCircle,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

import ModuleBar from "@/components/module-bar"
import VideoPlayer from "@/components/video-player"
import { VerticalNav } from "@/components/vertical-nav"
import PrePostKnowledgeCheck from "@/components/pre-post-knowledge-check"
import { phase2KnowledgeChecks } from "@/lib/knowledge-check-questions"
import InstructionGuide from "@/components/instruction-guide"
import { phaseInstructions } from "@/lib/post-task-questions"

const accent = "var(--accent-text)"
const neutralSurface = "hsl(var(--card) / 0.78)"
const neutralBorder = "hsl(var(--border) / 0.4)"
const headerSurface = "hsl(var(--card) / 0.95)"
const pillSurface = "hsl(var(--muted) / 0.4)"
const mutedText = "hsl(var(--muted-foreground))"
const primaryButtonStyle = {
  backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
  color: "#fff",
  border: `1px solid ${neutralBorder}`,
  boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
}

const LearningObjectiveAnalysis = () => {
  return (
    <div
      className="p-4 rounded-lg border mb-4 max-w-4xl mx-auto"
      style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
    >
      <h3 className="text-lg font-medium mb-2 flex items-center gap-2" style={{ color: accent }}>
        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: pillSurface }}>
          <Target className="h-4 w-4" style={{ color: accent }} />
        </div>
        Cognitive Levels of Understanding
      </h3>
      <p className="text-muted-foreground mb-3">
        Learning objectives reveal what your instructor expects you to know and the cognitive level required. The verb in the objective tells you what type of question the instructor will ask.
      </p>
      
      {/* Visual hierarchy showing the three levels */}
      <div
        className="p-4 rounded-lg border mb-4"
        style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
      >
        <div className="flex items-center justify-between mb-4 text-muted-foreground text-sm">
          <div className="text-center flex-1">
            <div className="font-bold text-base mb-1" style={{ color: accent }}>Knowledge</div>
            <div>Define, List, Recall, Identify, Recite</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-bold text-base mb-1" style={{ color: accent }}>Comprehension</div>
            <div>Explain, Describe, Summarize, Interpret</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-bold text-base mb-1" style={{ color: accent }}>Analysis</div>
            <div>Compare, Analyze, Differentiate, Evaluate</div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-muted-foreground text-sm">
          <span className="font-medium" style={{ color: accent }}>Key insight:</span> Different cognitive levels require different study strategies.
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        {[
          { title: "Knowledge Level", text: "Simple rehearsal, flashcards, memorization techniques" },
          { title: "Comprehension Level", text: "Self-explanation, concept mapping, summarizing" },
          { title: "Analysis Level", text: "Compare/contrast charts, critical thinking exercises" },
        ].map((item) => (
          <div
            key={item.title}
            className="p-3 rounded border"
            style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
          >
            <p className="font-medium mb-1" style={{ color: accent }}>{item.title}</p>
            <p className="text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PriorKnowledgeResourceAnalysis = () => {
  return (
    <div className="p-4 rounded-lg border mb-4 max-w-4xl mx-auto" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
      <h3 className="text-lg font-medium mb-2 flex items-center gap-2" style={{ color: accent }}>
        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: pillSurface }}>
          <BookOpen className="h-4 w-4" style={{ color: accent }} />
        </div>
        Why Prior Knowledge & Resources Matter
      </h3>
      
      <p className="text-muted-foreground mb-3">
        Connecting new learning to what you already know and selecting appropriate resources creates a foundation for efficient and effective learning.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded border" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
          <h4 className="text-sm font-medium mb-2 flex items-center" style={{ color: accent }}>
            <Search className="h-4 w-4 mr-1" />
            Analyzing Prior Knowledge:
          </h4>
          <ul className="space-y-1">
            <li className="flex items-center text-muted-foreground text-sm">
              <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: accent }}></div>
              Recognize knowledge gaps to address
            </li>
            <li className="flex items-center text-muted-foreground text-sm">
              <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: accent }}></div>
              Connect new ideas to existing mental models
            </li>
          </ul>
        </div>
        
        <div className="p-3 rounded border" style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
          <h4 className="text-sm font-medium mb-2 flex items-center" style={{ color: accent }}>
            <BookOpen className="h-4 w-4 mr-1" />
            Selecting Effective Resources:
          </h4>
          <ul className="space-y-1">
            <li className="flex items-center text-muted-foreground text-sm">
              <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: accent }}></div>
              Choose materials appropriate to your level
            </li>
            <li className="flex items-center text-muted-foreground text-sm">
              <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: accent }}></div>
              Seek diverse formats for complex topics
            </li>
          </ul>
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
}: {
  question: any;
  questionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const surface = "hsl(var(--card) / 0.82)"
  const border = "hsl(var(--border) / 0.65)"
  const pill = "hsl(var(--muted) / 0.35)"
  const mutedText = "hsl(var(--muted-foreground))"

  const handleSubmit = () => {
    if (!selectedOption) return;
    const correct = selectedOption === question.correctAnswer;
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      if (questionIndex === totalQuestions - 1) {
        onNextQuestion();
      }
    }
  };

  const handleTryAgain = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(false);
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
                borderColor: submitted ? undefined : border,
                backgroundColor: submitted ? undefined : "hsl(var(--card) / 0.78)",
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
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              border: `1px solid ${isCorrect ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}
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
                style={primaryButtonStyle}
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
          {submitted && isCorrect && questionIndex < totalQuestions - 1 && (
            <Button
              onClick={onNextQuestion}
              className="flex items-center gap-2 shadow-md"
              style={primaryButtonStyle}
            >
              Next Question <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {submitted && isCorrect && questionIndex === totalQuestions - 1 && (
            <div className="text-emerald-400 font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quiz Completed!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const KnowledgeCheckQuiz = ({ onComplete, knowledgeChecks }: { onComplete: () => void, knowledgeChecks: any[] }) => {
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
    />
  );
};

export default function Phase2Page() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [videoWatched, setVideoWatched] = useState(false)
  const [postTestCompleted, setPostTestCompleted] = useState(false)

  const cards = [
    { id: "intro", title: "Understand Your Task" },
    { id: "objectives", title: "Cognitive Levels of Understanding" },
    { id: "resources", title: "Why Prior Knowledge & Resources Matter" },
    { id: "video", title: "Watch: Introduction to Learning Task Analysis" },
    { id: "post-test", title: "Knowledge Check: After Video" },
  ]

  // Knowledge checks are now imported from lib/knowledge-check-questions.ts

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      router.push("/phase2/chat")
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  const handleVideoComplete = () => {
    setVideoWatched(true)
  }
  
  const handlePostTestComplete = (answers: { [questionId: number]: string | string[] }, allCorrect: boolean) => {
    setPostTestCompleted(true)
  }

  useEffect(() => {
    const storedName = localStorage.getItem("solbot_user_name")
    if (storedName) {
      setUserName(storedName)
    }
  }, [])

  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"

  return (
    <div
      className="min-h-screen text-foreground py-8"
      style={{ background: canvasGradient }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(140%_120%_at_80%_20%,rgba(0,0,0,0.04),transparent),radial-gradient(160%_140%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>

      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={2} />
        <div
          className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md border-b py-3 px-4"
          style={{ backgroundColor: headerSurface, borderColor: neutralBorder }}
        >
          <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Target className="h-6 w-6 mr-2" style={{ color: accent }} />
            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
              Phase 2: Understand Your Tasks
            </h2>
          </div>
          </div>
        </div>
        <VerticalNav
          currentCardIndex={currentCardIndex}
          totalCards={cards.length}
          onPrev={prevCard}
          onNext={nextCard}
          isNextDisabled={
            (currentCardIndex === 3 && !videoWatched) ||
            (currentCardIndex === 4 && !postTestCompleted)
          }
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: "56rem", marginLeft: "auto", marginRight: "auto", marginTop: "4rem" }}
        >
          <Card
            className="backdrop-blur-md border shadow-xl mb-6"
            style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold text-center">
                <Target className="h-8 w-8" style={{ color: accent }} />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--accent-text), var(--accent-text))" }}>
                  {cards[currentCardIndex].title}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {currentCardIndex === 0 && (
                <div className="text-muted-foreground space-y-4 mb-6">
                  <div
                    className="p-4 rounded-lg border mb-6 text-left"
                    style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
                  >
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2" style={{ color: accent }}>
                      <Map className="h-5 w-5" />
                      Phase 2 Workflow
                    </h3>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-foreground">
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <Target className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: accent }}>Analyze Tasks</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <FileQuestion className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: accent }}>Knowledge Check</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <Video className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: accent }}>Watch Video</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col items-center text-center">
                        <div className="p-2 rounded-full mb-1" style={{ backgroundColor: pillSurface }}>
                          <MessageCircle className="h-6 w-6" style={{ color: accent }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: accent }}>Chat w/ SoL2LBot</span>
                      </div>
                    </div>
                  </div>
                  <p>
                    {userName ? `Great work, ${userName}!` : "Great work!"} Now let's define your learning task in a way that sets you up for success.
                  </p>
                  <p>Define what you want to learn, how your current knowledge relates to it, and what resources you'll use.</p>
                </div>
              )}
              {currentCardIndex === 1 && <LearningObjectiveAnalysis />}
              {currentCardIndex === 2 && (
                <div className="space-y-4">
                  <PriorKnowledgeResourceAnalysis />
                  <div className="mt-6">
                    <InstructionGuide
                      title={phaseInstructions.phase2.title}
                      instructions={phaseInstructions.phase2.instructions}
                      tips={phaseInstructions.phase2.tips}
                      examples={phaseInstructions.phase2.examples}
                      phase="phase2"
                    />
                  </div>
                </div>
              )}
              {currentCardIndex === 3 && (
                <div className="mt-6 space-y-6">
                  <p className="text-center text-muted-foreground">
                    Learn how to analyze learning objectives and select effective learning strategies.
                  </p>
                  <VideoPlayer 
                    src="/video/SoL_phase2.mp4"
                    onComplete={handleVideoComplete}
                    phase="phase2"
                    videoTitle="Learning Task Analysis"
                  />
                  <div
                    className="mt-4 p-3 rounded-lg text-center border"
                    style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}
                  >
                    <p className="font-semibold" style={{ color: accent }}>After the video:</p>
                    <p className="text-muted-foreground text-sm">You will proceed to an interactive chat with SoL2LBot.</p>
                  </div>
                </div>
              )}
              {currentCardIndex === 4 && (
                <div>
                  <div className="text-muted-foreground mb-4">
                    <p>
                      <strong style={{ color: accent }}>After the video:</strong> Let's check your understanding of learning objectives and task analysis.
                    </p>
                  </div>
                  <PrePostKnowledgeCheck
                    questions={phase2KnowledgeChecks.postTest}
                    testType="post"
                    onComplete={handlePostTestComplete}
                  />
                </div>
              )}
              
              <div className="flex justify-between mt-8">
                {currentCardIndex > 0 ? (
                  <Button
                    variant="outline"
                    className="border"
                    style={{ borderColor: neutralBorder, color: mutedText }}
                    onClick={prevCard}
                    title="Go to previous step"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                ) : <div/>}

                {currentCardIndex < cards.length - 1 ? (
                  <Button
                    className="font-semibold px-6 py-2 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #b8892e, #96722d)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
              color: "#fff",
            }}
                    onClick={nextCard}
                    disabled={
                      (currentCardIndex === 3 && !videoWatched) ||
                      (currentCardIndex === 4 && !postTestCompleted)
                    }
                    title="Go to next step"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : currentCardIndex === cards.length - 1 && (currentCardIndex !== 4 || postTestCompleted) ? (
                  <Button
                    className="font-semibold px-6 py-3 rounded-full shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #b8892e, #96722d)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
                      color: "#fff",
                    }}
                    onClick={nextCard}
                    title="Continue to the next activity"
                  >
                    Continue to Chat <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : currentCardIndex === 4 && !postTestCompleted ? (
                  <Button 
                    className="font-semibold px-6 py-2 rounded-lg opacity-60 cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #b8892e, #96722d)",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
                      color: "#fff",
                    }}
                    disabled
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

