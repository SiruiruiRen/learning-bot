"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, HelpCircle, ArrowRight } from "lucide-react"

interface KnowledgeCheckProps {
  questionNumber: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  onComplete: () => void
  totalQuestions?: number
}

export default function KnowledgeCheck({
  questionNumber,
  question,
  options,
  correctAnswer,
  explanation,
  onComplete,
  totalQuestions = 3,
}: KnowledgeCheckProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  
  // Determine if this is the final question
  const isFinalQuestion = questionNumber === totalQuestions

  const handleSubmit = () => {
    if (!selectedOption) return

    const correct = selectedOption === correctAnswer
    setIsCorrect(correct)
    setSubmitted(true)
    
    // No auto-advancement - require button click
  }

  const handleTryAgain = () => {
    setSelectedOption(null)
    setSubmitted(false)
  }

  const handleManualComplete = () => {
    onComplete()
  }

  return (
    <Card className="bg-slate-800/50 border border-indigo-500/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Knowledge Check {questionNumber}</h3>
          </div>
          <span className="text-sm text-white/60">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        <p className="text-white/90 mb-6">{question}</p>

        <RadioGroup
          value={selectedOption || ""}
          onValueChange={setSelectedOption}
          className="space-y-3"
          disabled={submitted}
        >
          {options.map((option, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 rounded-lg border p-3 transition-colors ${
                submitted && option === correctAnswer
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
                    submitted && option === correctAnswer
                      ? "text-emerald-400"
                      : submitted && option === selectedOption
                        ? "text-red-400"
                        : "text-white/80"
                  }`}
                >
                  {option}
                </Label>
              </div>
              {submitted && option === correctAnswer && (
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              )}
              {submitted && option === selectedOption && option !== correctAnswer && (
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
                <p className="text-white/80 mt-1">{explanation}</p>
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
          
          {/* Show Continue button for ALL correct answers */}
          {submitted && isCorrect && (
            <Button
              onClick={handleManualComplete}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg"
            >
              {isFinalQuestion ? "Complete & Continue" : "Next Question"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

