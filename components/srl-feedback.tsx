"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Star } from "lucide-react"

export function SrlFeedback() {
  const [ratings, setRatings] = useState({
    usefulness: 0,
    satisfaction: 0,
    recommendation: 0,
  });
  const [feedback, setFeedback] = useState("")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  const handleRating = (question: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [question]: value }));
  };

  const handleFeedbackSubmit = async () => {
    if (!sessionId) return;

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'final_feedback',
          phase: '6',
          component: 'reflection',
          metadata: {
            ratings,
            feedback_text: feedback.trim(),
          },
        }),
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  const accent = "hsl(var(--primary))";
  const borderColor = "hsl(var(--border))";
  const foreground = "hsl(var(--foreground))";
  const mutedForeground = "hsl(var(--muted-foreground))";
  const cardBg = "hsl(var(--card))";
  const mutedBg = "hsl(var(--muted))";

  return (
    <div 
      className="p-6 rounded-lg border mt-8"
      style={{
        backgroundColor: mutedBg,
        borderColor: borderColor
      }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: accent }}>
        <Star className="h-5 w-5" />
        Final Feedback
      </h3>
      
      {feedbackSubmitted ? (
        <div className="text-center font-medium py-4" style={{ color: accent }}>
          Thank you for your feedback!
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <p style={{ color: foreground }}>How useful were the learning strategies presented?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(value => (
                <button 
                  key={value} 
                  onClick={() => handleRating('usefulness', value)} 
                  className="p-2 rounded transition-colors"
                  style={{
                    backgroundColor: ratings.usefulness >= value ? accent : mutedBg,
                    border: `1px solid ${borderColor}`,
                    color: ratings.usefulness >= value ? "hsl(var(--primary-foreground))" : mutedForeground
                  }}
                >
                  <Star className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p style={{ color: foreground }}>How satisfied are you with your overall experience?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(value => (
                <button 
                  key={value} 
                  onClick={() => handleRating('satisfaction', value)} 
                  className="p-2 rounded transition-colors"
                  style={{
                    backgroundColor: ratings.satisfaction >= value ? accent : mutedBg,
                    border: `1px solid ${borderColor}`,
                    color: ratings.satisfaction >= value ? "hsl(var(--primary-foreground))" : mutedForeground
                  }}
                >
                  <Star className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p style={{ color: foreground }}>How likely are you to recommend this training to others?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(value => (
                <button 
                  key={value} 
                  onClick={() => handleRating('recommendation', value)} 
                  className="p-2 rounded transition-colors"
                  style={{
                    backgroundColor: ratings.recommendation >= value ? accent : mutedBg,
                    border: `1px solid ${borderColor}`,
                    color: ratings.recommendation >= value ? "hsl(var(--primary-foreground))" : mutedForeground
                  }}
                >
                  <Star className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2" style={{ color: foreground }}>Additional comments or feedback (optional):</p>
            <div className="flex items-center gap-2">
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Type your feedback here..."
                className="flex-grow"
                style={{
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  color: foreground
                }}
                rows={3}
              />
            </div>
          </div>
          <div className="text-right">
            <Button 
              onClick={handleFeedbackSubmit} 
              disabled={Object.values(ratings).some(r => r === 0)}
              style={Object.values(ratings).some(r => r === 0) ? {} : {
                background: `linear-gradient(135deg, ${accent}, #e6c98c)`,
                color: "hsl(var(--primary-foreground))"
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 