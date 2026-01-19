"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Lightbulb, Target, CheckCircle } from "lucide-react"

interface InstructionGuideProps {
  title: string
  instructions: string[]
  tips?: string[]
  examples?: { title: string; content: string }[]
  phase?: string
}

export default function InstructionGuide({
  title,
  instructions,
  tips,
  examples,
  phase
}: InstructionGuideProps) {
  const accent = "#d8b26f"
  const neutralSurface = "hsl(var(--card) / 0.9)"
  const neutralBorder = "hsl(var(--border) / 0.75)"
  const foreground = "hsl(var(--foreground))"
  const mutedText = "hsl(var(--muted-foreground))"
  
  return (
    <Card style={{ backgroundColor: neutralSurface, borderColor: neutralBorder }}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}>
            <BookOpen className="h-5 w-5" style={{ color: accent }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: foreground }}>
            {title}
          </h3>
        </div>
        
        {instructions && instructions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: accent }}>
              <Target className="h-4 w-4" />
              Instructions
            </h4>
            <ol className="space-y-2 list-decimal list-inside" style={{ color: foreground }}>
              {instructions.map((instruction, index) => (
                <li key={index} className="text-sm leading-relaxed">
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        )}
        
        {tips && tips.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: accent }}>
              <Lightbulb className="h-4 w-4" />
              Tips for Success
            </h4>
            <ul className="space-y-2" style={{ color: foreground }}>
              {tips.map((tip, index) => (
                <li key={index} className="text-sm leading-relaxed flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {examples && examples.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: accent }}>
              <BookOpen className="h-4 w-4" />
              Examples
            </h4>
            <div className="space-y-3">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border"
                  style={{ backgroundColor: "hsl(var(--muted) / 0.3)", borderColor: neutralBorder }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: accent }}>
                    {example.title}
                  </p>
                  <p className="text-sm" style={{ color: mutedText }}>
                    {example.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
