"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, ArrowRight, Send, Bot, Loader2, Edit3 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { motion } from "framer-motion"
import MarkdownRenderer from "@/components/markdown-renderer"
import FeedbackDisplay from "@/components/feedback-display"
import { v4 as uuidv4 } from 'uuid'
import { useChatPersistence } from '@/hooks/useChatPersistence'
import { captureToWAL, newTurnId } from "@/lib/dataLayerInstrument"
import { useTextareaTelemetry } from "@/hooks/useTextareaTelemetry"
import { streamChat, stripPendingMetadata } from "@/lib/streamChat"

const DIRECT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://solbot-backend.onrender.com"

interface GuidedMonitoringProps {
  userId: string
  phase: string
  phaseNumber?: number
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const MONITORING_QUESTIONS = [
  {
    id: "progress_checks",
    question: "How will you check your progress to know if you're on track?",
    hint: "How will you know if your studying is actually working?"
  },
  {
    id: "adaptation_triggers",
    question: "What specific signals will tell you that you need to change your learning strategy?",
    hint: "What would tell you it's time to try something different?"
  },
  {
    id: "strategy_alternatives",
    question: "What alternative learning strategies will you use if your first approach isn't effective? Give specific examples.",
    hint: "What would you switch to if your current approach isn't working?"
  }
]

const CHARACTER_LIMIT = 5000;
const loadingMessages = [
  "Good monitoring means checking progress regularly with objective measures, not just feelings...",
  "Effective learners have backup strategies ready when their first approach isn't working...",
  "Self-assessment works best when you use concrete evidence rather than gut feelings..."
];

type MessageContent = string | { progress_checks: string; adaptation_triggers: string; strategy_alternatives: string; };
type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
}

export default function GuidedMonitoring({
  userId,
  phase,
  phaseNumber = 5,
  component = "progress_monitoring",
  onComplete,
  height = "600px"
}: GuidedMonitoringProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [interactionState, setInteractionState] = useState<"guiding" | "confirming" | "chatting">("guiding");
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const [editingSingleQuestion, setEditingSingleQuestion] = useState<number | null>(null);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [chatAnalyticsId, setChatAnalyticsId] = useState<string | null>(null);
  const [feedbackReceived, setFeedbackReceived] = useState(false);
  const [lastFailedRequest, setLastFailedRequest] = useState<string | null>(null);
  const [showRetryOption, setShowRetryOption] = useState(false);

  // ------------------------------------------------------------------
  // Ch4 research instrumentation (2026-04-17):
  // One feedback_cycle_id per R→feedback→R cycle, shared across
  // text_input / chat_message / feedback_delivered / revision_submitted
  // so downstream SQL can JOIN R1/feedback/R2. Rotated on each
  // handleEditResponses call.
  // ------------------------------------------------------------------
  const feedbackCycleIdRef = useRef<string | null>(null);
  const getCurrentCycleId = (): string => {
    if (!feedbackCycleIdRef.current) {
      feedbackCycleIdRef.current = newTurnId();
    }
    return feedbackCycleIdRef.current;
  };
  const computeAttemptNumber = (): number =>
    messages.filter(m => m.type === 'evaluation').length + 1;

  // Ch4: textarea engagement telemetry (focus/blur/paste/copy).
  // Paste detection is critical for Indicator 6 (Feedback Integration).
  const textareaTelemetry = useTextareaTelemetry({
    phase,
    component,
    getFieldName: () => interactionState === 'guiding'
      ? (MONITORING_QUESTIONS[currentQuestionIndex]?.id ?? 'guided_input')
      : 'chat_revision_input',
    // Lazy-init cycle id on first paste/focus/blur.
    getFeedbackCycleId: () => getCurrentCycleId(),
    getSessionId: () => sessionId,
  });

  const { loadChatState, saveChatState, clearChatState } = useChatPersistence(component, phase);

  // Save full chat state whenever key state changes.
  // Ch4: also persist feedbackCycleId so reloads preserve cycle alignment.
  useEffect(() => {
    if (messages.length === 0) return;
    saveChatState({
      messages,
      interactionState,
      currentQuestionIndex,
      responses,
      feedbackReceived,
      finalSubmitted,
      feedbackCycleId: feedbackCycleIdRef.current,
    });
  }, [messages, interactionState, currentQuestionIndex, responses, feedbackReceived, finalSubmitted, saveChatState]);

  useEffect(() => {
    const initializeChat = async () => {
      const storedSessionId = localStorage.getItem("session_id");
      if (storedSessionId) {
        setSessionId(storedSessionId);

        // Try to restore full chat state first
        const savedChatState = loadChatState();
        if (savedChatState && savedChatState.messages.length > 0) {
          setMessages(savedChatState.messages);
          setInteractionState(savedChatState.interactionState);
          setCurrentQuestionIndex(savedChatState.currentQuestionIndex);
          setResponses(savedChatState.responses);
          setFeedbackReceived(savedChatState.feedbackReceived);
          setFinalSubmitted(savedChatState.finalSubmitted);
          // Restore the active feedback_cycle_id across reloads.
          if (savedChatState.feedbackCycleId) {
            feedbackCycleIdRef.current = savedChatState.feedbackCycleId;
          }
          console.log("Restored full chat state from localStorage");

          try {
            captureToWAL("messages", {
              event_type: "chat_started",
              phase: phase,
              component: component,
              resumed: true,
            }, { sessionId: storedSessionId, eventType: "chat_started" })
            const response = await fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: storedSessionId,
                event_type: 'chat_started',
                phase: phase,
                component: component,
                metadata: { resumed: true },
              }),
            });
            const data = await response.json();
            if (data.id) setChatAnalyticsId(data.id);
          } catch (error) {
            console.error("Failed to create chat analytics entry:", error);
          }
          return;
        }

        // Fallback: Load temp responses (legacy path)
        let hasSavedResponses = false;
        try {
          const savedResponses = localStorage.getItem(`solbot_temp_responses_${component}_${phase}`);
          if (savedResponses) {
            const parsedResponses = JSON.parse(savedResponses);
            setResponses(parsedResponses);
            const allAnswered = MONITORING_QUESTIONS.every(q => parsedResponses[q.id] && parsedResponses[q.id].trim().length > 0);
            if (allAnswered) {
              hasSavedResponses = true;
            }
          }
        } catch (error) {
          console.warn("Could not load saved responses:", error);
        }

        try {
          captureToWAL("messages", {
            event_type: "chat_started",
            phase: phase,
            component: component,
          }, { sessionId: storedSessionId, eventType: "chat_started" })
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: storedSessionId,
              event_type: 'chat_started',
              phase: phase,
              component: component,
            }),
          });
          const data = await response.json();
          if (data.id) setChatAnalyticsId(data.id);
        } catch (error) {
          console.error("Failed to create chat analytics entry:", error);
        }

        if (hasSavedResponses) {
          const saved = JSON.parse(localStorage.getItem(`solbot_temp_responses_${component}_${phase}`) || "{}");
          setInteractionState("confirming");
          setMessages([
            { id: uuidv4(), sender: "bot", content: "Welcome back! Here are your saved responses. Click any section to edit it.", type: "question" },
            { id: uuidv4(), sender: "bot", content: { progress_checks: saved["progress_checks"], adaptation_triggers: saved["adaptation_triggers"], strategy_alternatives: saved["strategy_alternatives"] }, type: "confirmation" }
          ]);
          return;
        }
      }

      setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's develop your monitoring and adaptation system. I'll guide you through creating a comprehensive approach to track and improve your learning.", type: "question" },
        { id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[0].question, type: "question" }
      ]);
    };
    initializeChat();
  }, [phase, component]);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase5");
    if (chatContainer) { chatContainer.scrollTop = chatContainer.scrollHeight; }
  }, [messages, isLoading]);

  // Don't auto-complete when entering chatting state - let user continue interacting
  // onComplete should be called explicitly by user action (e.g., a "Complete" button)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessage(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLoading]);

  const handleSendResponse = () => {
    if (!userInput.trim() || userInput.length > CHARACTER_LIMIT) return;

    const questionId = MONITORING_QUESTIONS[currentQuestionIndex].id;
    const newResponses = { ...responses, [questionId]: userInput };
    setResponses(newResponses);

    // Save responses to localStorage to prevent data loss
    try {
      localStorage.setItem(`solbot_temp_responses_${component}_${phase}`, JSON.stringify(newResponses));
    } catch (error) {
      console.warn("Could not save responses to localStorage:", error);
    }

    // Log individual question response for research analytics.
    // Ch4: attempt_number derived from evaluations seen;
    // feedback_cycle_id groups events within one R→feedback→R cycle.
    const _cycleId = getCurrentCycleId();
    const _attempt = computeAttemptNumber();
    try {
      captureToWAL("content_interaction_logs", {
        event_type: "text_input",
        phase: phase,
        component: component,
        field_name: questionId,
        input_value: userInput,
        question_index: currentQuestionIndex,
        question_text: MONITORING_QUESTIONS[currentQuestionIndex].question,
        is_submission: false,
        attempt_number: _attempt,
        feedback_cycle_id: _cycleId,
        timestamp: new Date().toISOString(),
      }, { sessionId, eventType: "text_input" })
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'text_input',
          phase: phase,
          component: component,
          metadata: {
            field_name: questionId,
            input_value: userInput,
            question_index: currentQuestionIndex,
            question_text: MONITORING_QUESTIONS[currentQuestionIndex].question,
            is_submission: false,
            attempt_number: _attempt,
            feedback_cycle_id: _cycleId,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error("Failed to log question response:", error)
    }

    const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
    let botMessages: Message[] = [];

    const confirmationContent = {
      progress_checks: newResponses["progress_checks"],
      adaptation_triggers: newResponses["adaptation_triggers"],
      strategy_alternatives: newResponses["strategy_alternatives"]
    };

    if (editingSingleQuestion !== null) {
      setEditingSingleQuestion(null);
      setInteractionState("confirming");
      botMessages.push({ id: uuidv4(), sender: "bot", content: confirmationContent, type: "confirmation" });
    } else if (currentQuestionIndex < MONITORING_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[nextQuestionIndex].question, type: "question" });
    } else {
      setInteractionState("confirming");
      botMessages.push({ id: uuidv4(), sender: "bot", content: confirmationContent, type: "confirmation" });
    }
    setMessages(prev => [...prev, userMessage, ...botMessages]);
    setUserInput("");
  };

  const submitToApi = async (message: string, isRetry: boolean = false) => {
    if (!sessionId) return;
    setIsLoading(true);
    setShowRetryOption(false);
    setLastFailedRequest(message);

    // ==== 2026-04-17: streaming /api/chat/stream ====
    // Same pattern as guided-learning-objective.tsx.

    const _userMsgCycleId = getCurrentCycleId();
    try {
      captureToWAL("messages", {
        event_type: "chat_message",
        phase: phase,
        component: component,
        role: "user",
        content: message,
        feedback_cycle_id: _userMsgCycleId,
        timestamp: new Date().toISOString(),
      }, { sessionId, eventType: "chat_message" })
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'chat_message',
          phase: phase,
          component: component,
          metadata: {
            role: 'user',
            content: message,
            feedback_cycle_id: _userMsgCycleId,
            timestamp: new Date().toISOString()
          }
        })
      }).catch(err => console.error("Failed to log user chat_message:", err));
    } catch (error) {
      console.error("Failed to log user message:", error)
    }

    const botMessageId = uuidv4();
    const placeholderBotMessage: Message = {
      id: botMessageId,
      sender: "bot",
      content: "",
      type: "evaluation",
    };
    setMessages(prev => [...prev, placeholderBotMessage]);

    let accumulated = "";
    const _fbCycleId = getCurrentCycleId();

    await streamChat(
      `${DIRECT_BACKEND_URL}/api/chat/stream`,
      {
        session_id: sessionId,
        message,
        phase,
        component,
        is_submission: true,
        attempt_number: 1,
      },
      {
        onText: (delta) => {
          accumulated += delta;
          // Hide in-progress INSTRUCTOR_METADATA comment block — see
          // guided-learning-objective.tsx for the rationale.
          const displayable = stripPendingMetadata(accumulated);
          setMessages(prev => prev.map(m =>
            m.id === botMessageId
              ? { ...m, content: displayable }
              : m
          ));
        },
        onComplete: (cleanedContent, evaluation, model) => {
          setMessages(prev => prev.map(m =>
            m.id === botMessageId
              ? { ...m, content: cleanedContent || accumulated, ...(evaluation ? { evaluation: evaluation as any } : {}) }
              : m
          ));
          setFeedbackReceived(true);
          setLastFailedRequest(null);

          const fbText = cleanedContent || accumulated || null;
          try {
            captureToWAL("assessments", {
              event_type: "feedback_delivered",
              phase: phase,
              component: component,
              timestamp: new Date().toISOString(),
              has_evaluation: !!evaluation,
              feedback_cycle_id: _fbCycleId,
              feedback_text: fbText,
              model,
              ...(evaluation ?? {}),
            }, { sessionId, eventType: "feedback_delivered" })
            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: sessionId,
                event_type: 'feedback_delivered',
                phase: phase,
                component: component,
                metadata: {
                  timestamp: new Date().toISOString(),
                  has_evaluation: !!evaluation,
                  feedback_cycle_id: _fbCycleId,
                  feedback_text: fbText,
                  model,
                }
              })
            }).catch(err => console.error("Failed to log feedback_delivered:", err));
          } catch (error) {
            console.error("Failed to WAL feedback_delivered:", error)
          }

          try {
            captureToWAL("messages", {
              event_type: "chat_message",
              phase: phase,
              component: component,
              role: "assistant",
              content: cleanedContent || accumulated,
              feedback_cycle_id: _fbCycleId,
              model,
              timestamp: new Date().toISOString(),
            }, { sessionId, eventType: "chat_message" })
            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: sessionId,
                event_type: 'chat_message',
                phase: phase,
                component: component,
                metadata: {
                  role: 'assistant',
                  content: cleanedContent || accumulated,
                  feedback_cycle_id: _fbCycleId,
                  model,
                  timestamp: new Date().toISOString()
                }
              })
            }).catch(err => console.error("Failed to log assistant chat_message:", err));
          } catch (error) {
            console.error("Failed to WAL assistant chat_message:", error)
          }

          if (chatAnalyticsId && sessionId) {
            try {
              captureToWAL("messages", {
                event_type: "chat_ended",
                phase: phase,
                component: component,
                chat_analytics_id: chatAnalyticsId,
                message_count: messages.length + 2,
              }, { sessionId, eventType: "chat_ended" })
              fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session_id: sessionId,
                  event_type: 'chat_ended',
                  phase: phase,
                  component: component,
                  metadata: {
                    chat_analytics_id: chatAnalyticsId,
                    message_count: messages.length + 2,
                  },
                }),
              }).catch(err => console.error("Failed to log chat_ended:", err));
            } catch (error) {
              console.error("Failed to WAL chat_ended:", error)
            }
          }
        },
        onError: (errMsg) => {
          console.error("Streaming chat error:", errMsg);
          const isTimeout = /timeout|took longer/i.test(errMsg);
          const errorContent = isTimeout
            ? "I'm taking longer than usual to analyze your thoughtful response. This often happens with complex educational content that requires careful consideration.\n\n**Your work is saved** - you can try again for feedback or continue to the next task."
            : "I encountered a temporary issue while providing feedback on your response.\n\n**Your work is saved** - please try again or continue to the next task.";
          setMessages(prev => prev.map(m =>
            m.id === botMessageId
              ? { ...m, content: errorContent, type: "evaluation" as const }
              : m
          ));
          setShowRetryOption(true);
        },
      }
    );

    setIsLoading(false);
    setInteractionState("chatting");
  };

  const handleRetryFeedback = () => {
    if (lastFailedRequest) {
      submitToApi(lastFailedRequest, true);
    }
  };

  const handleSubmitForFeedback = () => {
    const fullMonitoringPlan = `Progress Checks: ${responses["progress_checks"] || ""}\n\nAdaptation Triggers: ${responses["adaptation_triggers"] || ""}\n\nStrategy Alternatives: ${responses["strategy_alternatives"] || ""}`;
    submitToApi(fullMonitoringPlan);
  };
  
  const handleSendChatMessage = () => {
      if (!userInput.trim()) return;
      const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
      setMessages(prev => [...prev, userMessage]);
      const messageToSend = userInput;
      setUserInput("");
      submitToApi(messageToSend);
  }

  const handleFinalSubmit = async () => {
    setIsSubmittingFinal(true);
    try {
      const sid = localStorage.getItem("session_id");
      const uid = localStorage.getItem("user_id");
      if (chatAnalyticsId && sid) {
        captureToWAL("messages", {
          event_type: "chat_ended",
          chat_analytics_id: chatAnalyticsId,
          message_count: messages.length,
        }, { sessionId: sid, eventType: "chat_ended" })
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sid, event_type: 'chat_ended', metadata: { chat_analytics_id: chatAnalyticsId, message_count: messages.length } }),
        }).catch(() => {});
      }
      // ---- BUG FIX 2026-04-17 ----
      // Write phase completion flag to localStorage FIRST, so a cold
      // backend can't block the gate from opening. Then fire-and-forget
      // the /api/events POST (WAL already has the durable copy).
      try {
        localStorage.setItem(`solbot_phase${phaseNumber}_completed`, "true");
      } catch (error) {
        console.error("Error saving phase completion flag:", error);
      }
      if (sid) {
        const _finalCycleId = getCurrentCycleId();
        captureToWAL("phase_completion_analytics", {
          event_type: "final_submission",
          phase: `phase${phaseNumber}`,
          component,
          responses,
          feedback_cycle_id: _finalCycleId,
          timestamp: new Date().toISOString(),
        }, { sessionId: sid, eventType: "final_submission" })
        // Fire-and-forget (was `await`, which could hang 30s on cold start)
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sid,
            event_type: "final_submission",
            phase: `phase${phaseNumber}`,
            component,
            metadata: { responses, feedback_cycle_id: _finalCycleId, timestamp: new Date().toISOString() },
          }),
        }).catch(err => console.error("Failed to log final_submission:", err));
      }
      if (uid) {
        fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, dataType: `phase${phaseNumber}_completed`, value: "true", metadata: { phase: phaseNumber, timestamp: new Date().toISOString() } }),
        }).catch(() => {});
      }
      try { localStorage.removeItem(`solbot_temp_responses_${component}_${phase}`); } catch {}
      setFinalSubmitted(true);

      // Build a "submission receipt" bot message that echoes EXACTLY
      // what the student submitted, so they see their final answer
      // reflected back. Chat message parser supports markdown, so we
      // format as headers + blockquotes for readability.
      const submittedAt = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      const questionLabelMap: Record<string, string> = {
        progress_checks: "Progress checks",
        adaptation_triggers: "Adaptation triggers",
        strategy_alternatives: "Alternative strategies",
      };
      const receiptSections = MONITORING_QUESTIONS
        .map((q) => {
          const label = questionLabelMap[q.id] ?? q.id;
          const ans = (responses[q.id] ?? "").trim();
          if (!ans) return null;
          // Prefix each answer line with "> " for markdown blockquote.
          const quoted = ans.split("\n").map((l) => `> ${l}`).join("\n");
          return `**${label}:**\n${quoted}`;
        })
        .filter(Boolean)
        .join("\n\n");
      const receiptContent =
        `## ✅ Your Final Answer Is Saved\n\n` +
        `Submitted at ${submittedAt} · You can now proceed to the next phase.\n\n` +
        receiptSections +
        `\n\n---\nThese responses have been permanently recorded. ` +
        `Click the next button at the bottom of the page when you're ready to move on.`;

      setMessages(prev => [...prev, {
        id: uuidv4(), sender: "bot" as const,
        content: receiptContent,
        type: "question" as const
      }]);
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error during final submission:", error);
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const handleEditSingleQuestion = (questionIndex: number) => {
    setEditingSingleQuestion(questionIndex);
    setInteractionState("guiding");
    setCurrentQuestionIndex(questionIndex);
    const questionId = MONITORING_QUESTIONS[questionIndex].id;
    setMessages(prev => [
      ...prev,
      { id: uuidv4(), sender: "bot", content: `Editing your response for: **${["Progress Checks", "Adaptation Triggers", "Strategy Alternatives"][questionIndex]}**`, type: "question" },
      { id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[questionIndex].question, type: "question" }
    ]);
    setUserInput(responses[questionId] || "");
  };

  const handleEditResponses = () => {
    setInteractionState("guiding");
    setCurrentQuestionIndex(0);
    setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's revise your monitoring system. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: MONITORING_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[MONITORING_QUESTIONS[0].id] || "");

    if (sessionId) {
      // Close the current cycle with this event, then rotate.
      const _closingCycleId = getCurrentCycleId();
      captureToWAL("user_revision_tracking", {
        event_type: "revision_submitted",
        phase: phase,
        component: component,
        attempt_number: computeAttemptNumber(),
        feedback_cycle_id: _closingCycleId,
        content_changes: responses,
      }, { sessionId, eventType: "revision_submitted" })
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: 'revision_submitted',
          phase: phase,
          component: component,
          metadata: {
            attempt_number: computeAttemptNumber(),
            feedback_cycle_id: _closingCycleId,
            content_changes: responses,
          },
        }),
      });
    }
    // Rotate: next R_{n+1} text_inputs belong to a new cycle.
    feedbackCycleIdRef.current = newTurnId();
  };
  
  const accent = "var(--accent-text)"
  const neutralSurface = "hsl(var(--card))"
  const neutralBorder = "hsl(var(--border))"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  }

   const renderInputArea = () => {
    if (interactionState === 'guiding') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs" style={{ color: mutedText }}>
            <div className="flex-1">Question {currentQuestionIndex + 1} of {MONITORING_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={MONITORING_QUESTIONS[currentQuestionIndex].hint}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onFocus={textareaTelemetry.onFocus}
              onBlur={textareaTelemetry.onBlur}
              onPaste={textareaTelemetry.onPaste}
              onCopy={textareaTelemetry.onCopy}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 min-h-[80px]"
              style={{
                backgroundColor: neutralSurface,
                borderColor: neutralBorder,
                color: "hsl(var(--foreground))"
              }}
              rows={3}
            />
            <Button onClick={handleSendResponse} className="h-auto py-3" style={primaryButtonStyle} disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT} title="Send your response">
              <Send size={18} />
            </Button>
          </div>
        </div>
      );
    } else if (interactionState === 'confirming') {
      return (
        <div className="flex gap-2 justify-end flex-wrap">
          {/* Edit Responses — full restart Q1→Q3 with explicit warning */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isLoading}
                style={{ borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
                title="Start over from Question 1 — clears history and current answers"
              >
                <Edit3 size={16} className="mr-2" />
                Edit Responses
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start over with new answers?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear the current conversation and your
                  three monitoring answers, and take you back to{" "}
                  <strong>Question 1</strong>. You&apos;ll need to answer
                  all three questions again from the beginning. Your
                  previous answers will not be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEditResponses}>
                  Yes, start over
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSubmitForFeedback} disabled={isLoading} style={primaryButtonStyle} title="Confirm and submit for feedback">
            <Check size={16} className="mr-2"/>Confirm & Submit
          </Button>
        </div>
      );
    } else { // 'chatting'
      if (finalSubmitted) return null;
      return (
        <div className="flex flex-col space-y-3">
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Refine your monitoring system based on the feedback..."
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                if (feedbackReceived && e.target.value.length === 1 && userInput.length === 0 && sessionId) {
                  const _revStartCycle = getCurrentCycleId();
                  captureToWAL("user_revision_tracking", {
                    event_type: "revision_started",
                    phase,
                    component,
                    feedback_cycle_id: _revStartCycle,
                    timestamp: new Date().toISOString(),
                  }, { sessionId, eventType: "revision_started" })
                  fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, event_type: 'revision_started', phase, component, metadata: { feedback_cycle_id: _revStartCycle, timestamp: new Date().toISOString() } })
                  }).catch(err => console.error("Failed to log revision_started:", err));
                }
              }}
              onFocus={textareaTelemetry.onFocus}
              onBlur={textareaTelemetry.onBlur}
              onPaste={textareaTelemetry.onPaste}
              onCopy={textareaTelemetry.onCopy}
              maxLength={CHARACTER_LIMIT}
              className="flex-1 min-h-[80px]"
              style={{ backgroundColor: neutralSurface, borderColor: neutralBorder, color: "hsl(var(--foreground))" }}
              rows={3}
            />
            <Button onClick={handleSendChatMessage} className="h-auto py-3" style={primaryButtonStyle} disabled={!userInput.trim() || userInput.length > CHARACTER_LIMIT || isLoading} title="Send message">
              <Send size={18} />
            </Button>
          </div>
          {/* Try-again stays small and secondary, on its own row */}
          {showRetryOption && (
            <div className="flex justify-center">
              <Button onClick={handleRetryFeedback} variant="outline" size="sm" style={{ borderColor: accent, color: accent }} title="Request new feedback">
                Try Again for Feedback
              </Button>
            </div>
          )}
          {/* Edit Responses — full restart Q1→Q3 with explicit warning */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                style={{ borderColor: neutralBorder, color: mutedText }}
                disabled={isLoading || isSubmittingFinal}
                title="Start over from Question 1 — clears the conversation and your current answers"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Responses (start over)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start over with new answers?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear the current conversation and your
                  three monitoring answers, and take you back to{" "}
                  <strong>Question 1</strong>. You&apos;ll need to answer
                  all three questions again from the beginning. Your
                  previous answers will not be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEditResponses}>
                  Yes, start over
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Submit Final Answer — full-width, large, amber-ring glow */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="lg"
                className="w-full py-6 text-base md:text-lg rounded-xl shadow-lg font-bold ring-4 ring-amber-400/30 hover:ring-amber-400/60 transition-all"
                style={primaryButtonStyle}
                disabled={isLoading || isSubmittingFinal}
                data-testid="submit-final-version"
              >
                {isSubmittingFinal ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Submitting…</>
                ) : (
                  <><Send className="h-5 w-5 mr-2" />Submit Final Answer</>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Submit as your final answer?</AlertDialogTitle>
                <AlertDialogDescription>
                  Please review what you&apos;re about to submit. Once
                  confirmed, these responses are permanently recorded as
                  your final answer for this phase.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {/* Inline preview — show the student's MOST RECENT full
                  answer as a single continuous block (no per-question
                  sub-labels) so they see exactly what will be
                  recorded. */}
              <div className="max-h-[55vh] overflow-y-auto rounded-lg border p-4 bg-muted/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Your answer
                </p>
                {(() => {
                  const fullAnswer = MONITORING_QUESTIONS
                    .map((q) => (responses[q.id] ?? "").trim())
                    .filter(Boolean)
                    .join("\n\n")
                  return (
                    <div
                      className="text-sm whitespace-pre-wrap border-l-2 pl-3 py-1"
                      style={{
                        borderLeftColor: accent,
                        color: fullAnswer ? "hsl(var(--foreground))" : mutedText,
                      }}
                    >
                      {fullAnswer || "(no response yet)"}
                    </div>
                  )
                })()}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back &amp; Continue to Chat</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalSubmit}>
                  Yes, Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        id="guided-chat-container-phase5"
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 p-4"
        style={{ height }}
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 w-full ${message.sender === "bot" ? "justify-start" : "justify-end"}`}
          >
            {message.sender === "bot" && (
              <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center" style={{ backgroundColor: accent }}>
                <Bot size={16} style={{ color: "#ffffff" }} />
              </div>
            )}
            <Card
              className="max-w-[85%]"
              style={{
                backgroundColor: message.sender === "bot" ? neutralSurface : "hsl(var(--primary) / 0.1)",
                borderColor: neutralBorder,
                color: "hsl(var(--foreground))"
              }}
            >
              <CardContent className="p-3 text-sm overflow-hidden max-w-full">
                 {message.type === 'confirmation' && typeof message.content === 'object' ? (
                    // Ch4 (2026-04-17): simplified confirmation preview.
                    // Shows the whole monitoring plan as one continuous
                    // block — no per-section labels (Progress Checks /
                    // Adaptation Triggers / Strategy Alternatives) and
                    // no click-to-edit. The only edit path now is the
                    // explicit "Edit Responses" button which clears
                    // history and restarts Q1→Q3 with confirmation.
                    <div className="space-y-3">
                      <p>Excellent! Here is your complete monitoring and adaptation system. Please review it.</p>
                      <div
                        className="p-3 rounded-md border whitespace-pre-wrap text-sm"
                        style={{
                          backgroundColor: "hsl(var(--muted) / 0.5)",
                          borderColor: neutralBorder,
                        }}
                      >
                        {[
                          (message.content as Record<string, string>).progress_checks,
                          (message.content as Record<string, string>).adaptation_triggers,
                          (message.content as Record<string, string>).strategy_alternatives,
                        ]
                          .map((s) => (s ?? "").trim())
                          .filter(Boolean)
                          .join("\n\n")}
                      </div>
                    </div>
                  ) : message.type === 'evaluation' ? (
                  <FeedbackDisplay content={message.content as string} />
                ) : (
                  <MarkdownRenderer content={message.content as string} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center" style={{ backgroundColor: accent }}>
                <Bot size={16} style={{ color: "#ffffff" }} />
            </div>
            <div className="typing-indicator">
              <div className="typing-indicator-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="typing-indicator-message">{loadingMessages[currentLoadingMessage]}</span>
            </div>
          </motion.div>
        )}
      </div>
      <div className="border-t p-4" style={{ borderColor: neutralBorder }}>
        {renderInputArea()}
      </div>
      
      {/* Continue button moved to page level for better UX */}
    </div>
  )
} 