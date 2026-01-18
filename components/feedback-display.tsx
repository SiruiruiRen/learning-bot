"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import MarkdownRenderer from "@/components/markdown-renderer"
import { Sparkles, BarChart, ArrowRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeedbackDisplayProps {
  content: string;
  evaluation?: any;
  userMessage?: string;
  phase?: string;
  component?: string;
  sessionId?: string;
  currentStyle?: string; // "warm" or "direct"
}

const FeedbackDisplay = ({ 
  content, 
  evaluation, 
  userMessage, 
  phase, 
  component, 
  sessionId,
  currentStyle = "warm" 
}: FeedbackDisplayProps) => {
  const [alternativeContent, setAlternativeContent] = useState<string | null>(null)
  const [isLoadingAlternative, setIsLoadingAlternative] = useState(false)
  const [showAlternative, setShowAlternative] = useState(false)
  const [viewStartTime, setViewStartTime] = useState<number | null>(null)
  const [alternativeViewStartTime, setAlternativeViewStartTime] = useState<number | null>(null)

  // Track initial feedback view time
  useEffect(() => {
    if (content && evaluation && !viewStartTime) {
      setViewStartTime(Date.now())
      logFeedbackView('original', currentStyle)
    }
  }, [content, evaluation])

  // Track when user switches to alternative style
  useEffect(() => {
    if (showAlternative && alternativeContent && !alternativeViewStartTime) {
      setAlternativeViewStartTime(Date.now())
    }
  }, [showAlternative, alternativeContent])

  // Track when user switches back to original
  useEffect(() => {
    if (!showAlternative && alternativeViewStartTime) {
      const viewDuration = Math.round((Date.now() - alternativeViewStartTime) / 1000)
      logFeedbackView('original', currentStyle, viewDuration)
      setAlternativeViewStartTime(null)
    }
  }, [showAlternative, alternativeViewStartTime])

  const logFeedbackView = async (viewType: 'original' | 'alternative', style: string, previousViewDuration?: number) => {
    if (!sessionId || !phase || !component || !evaluation) return

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'feedback_style_view',
          phase: phase,
          component: component,
          metadata: {
            view_type: viewType, // 'original' or 'alternative'
            style: style, // 'warm' or 'direct'
            evaluation_score: evaluation.overall_score || evaluation.Overall_Score,
            evaluation_category: evaluation.lowest_category || evaluation.Lowest_Category,
            previous_view_duration_seconds: previousViewDuration,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error("Failed to log feedback view:", error)
    }
  }

  const handleViewAlternativeStyle = async () => {
    if (!evaluation || !userMessage || !phase || !component || !sessionId) {
      console.warn("Missing required props for alternative feedback")
      return
    }

    // Log switch to alternative style
    if (viewStartTime && !showAlternative) {
      const viewDuration = Math.round((Date.now() - viewStartTime) / 1000)
      await logFeedbackView('alternative', currentStyle === "warm" ? "direct" : "warm", viewDuration)
    }

    setIsLoadingAlternative(true)
    try {
      const alternativeStyle = currentStyle === "warm" ? "direct" : "warm"
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://solbot-backend.onrender.com'
      
      const response = await fetch(`${backendUrl}/api/alternative-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          phase: phase,
          component: component,
          user_message: userMessage,
          evaluation_metadata: evaluation,
          alternative_style: alternativeStyle
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAlternativeContent(result.data.message)
        setShowAlternative(true)
        setAlternativeViewStartTime(Date.now())
      } else {
        console.error("Failed to get alternative feedback")
      }
    } catch (error) {
      console.error("Error fetching alternative feedback:", error)
    } finally {
      setIsLoadingAlternative(false)
    }
  }

  const handleViewOriginal = () => {
    // Log switch back to original style
    if (alternativeViewStartTime) {
      const viewDuration = Math.round((Date.now() - alternativeViewStartTime) / 1000)
      logFeedbackView('original', currentStyle, viewDuration)
      setAlternativeViewStartTime(null)
    }
    setShowAlternative(false)
    setViewStartTime(Date.now())
  }

  const displayContent = showAlternative && alternativeContent ? alternativeContent : content
  // Split the content by "## " to get the sections
  const sections = content.split("## ").filter(s => s.trim() !== "");

  const sections = displayContent.split("## ").filter(s => s.trim() !== "")

  return (
    <div className="space-y-4 w-full">
      {evaluation && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {showAlternative ? `Viewing: ${currentStyle === "warm" ? "Direct" : "Warm"} style` : `Current: ${currentStyle === "warm" ? "Warm" : "Direct"} style`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAlternativeStyle}
            disabled={isLoadingAlternative}
            className="text-xs"
            style={{
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))"
            }}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingAlternative ? 'animate-spin' : ''}`} />
            {showAlternative ? 'View Original' : `View ${currentStyle === "warm" ? "Direct" : "Warm"} Style`}
          </Button>
          {showAlternative && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewOriginal}
              className="text-xs ml-2"
              style={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))"
              }}
            >
              View Original
            </Button>
          )}
        </div>
      )}
      {sections.map((section, index) => {
        // Find the first newline to separate title from body
        const firstNewlineIndex = section.indexOf('\n');
        const title = firstNewlineIndex !== -1 ? section.substring(0, firstNewlineIndex).trim() : section.trim();
        const body = firstNewlineIndex !== -1 ? section.substring(firstNewlineIndex + 1).trim() : "";

        const accent = "#d8b26f"
        const neutralSurface = "hsl(var(--card))"
        const neutralBorder = "hsl(var(--border))"
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-4 rounded-lg border w-full"
            style={{
              backgroundColor: "hsl(var(--muted) / 0.5)",
              borderColor: neutralBorder
            }}
          >
            <h3 className="font-semibold text-base mb-2 flex items-center break-words" style={{ color: accent }}>
              {title === "Assessment" && <BarChart className="w-4 h-4 mr-2 flex-shrink-0" />}
              {title === "Guidance" && <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />}
              {title === "Next Steps" && <ArrowRight className="w-4 h-4 mr-2 flex-shrink-0" />}
              {title}
            </h3>
            <div className="text-sm break-words overflow-wrap-anywhere max-w-full overflow-hidden" style={{ color: "hsl(var(--foreground))" }}>
                <MarkdownRenderer content={body} className="max-w-full" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FeedbackDisplay; 