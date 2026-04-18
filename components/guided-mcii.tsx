"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, Send, Bot, Loader2, Edit3 } from "lucide-react"
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

interface GuidedMCIIProps {
  userId: string
  phase: string
  phaseNumber?: number
  component?: string
  onComplete?: () => void
  height?: string
}

const MCII_QUESTIONS = [
  {
    id: "pick_goal",
    question: "Pick a goal you would like to achieve. For the purposes of this module, please choose a goal related to the course containing this module. State the goal you selected below.",
    hint: "Pick something specific you want to achieve in this course."
  },
  {
    id: "indulge",
    question: "Take a moment and consider how it would feel to achieve the goal – Why would achieving this goal be so satisfying? Imagine the relevant events and experiences as vividly as possible – really let your mind go! Elaborate in writing on what it would feel like to achieve the goal.",
    hint: "Let your imagination go — what would success feel like?"
  },
  {
    id: "consider_obstacles",
    question: "Sometimes things do not work out as well as we would have liked. Think about the obstacles that might prevent you from achieving your goal. What is the most challenging obstacle that stands in your way? What other obstacles might make it hard for you to achieve your goal? Consider your own thoughts and habits – what obstacles of your own creation might make it harder to achieve your goal? Spend some time reflecting on these obstacles. In the space provided, name the central obstacle. Think about it deeply and imagine the relevant events and experiences as vividly as possible, then elaborate in writing on what could prevent you from achieving your goal.",
    hint: "What personal habits or tendencies could get in your way?"
  },
  {
    id: "implementation_intention",
    question: "Now please make an implementation intention that will help you to approach your goal. You may find it useful to think of the main obstacle that you identified and create an implementation intention that can help you overcome this obstacle in particular. To remind you, an implementation intention should have the following format: \"If (I am in a situation X), then (I will do Y).\" Please complete your implementation intention below. Once you're done writing, remember to repeat the implementation intention to yourself a few times and visualize performing it.",
    hint: "Write a concrete 'If __, then I will __' plan."
  }
]

const CHARACTER_LIMIT = 5000;
const loadingMessages = [
  "Analyzing your MCII plan...",
  "Evaluating goal clarity and implementation intentions...",
  "Assessing mental contrasting quality...",
  "Reviewing obstacle identification and feasibility..."
];

type MessageContent = string | { 
  pick_goal: string; 
  indulge: string; 
  consider_obstacles: string; 
  implementation_intention: string; 
};

type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
}

export default function GuidedMCII({
  userId,
  phase,
  phaseNumber = 4,
  component = "mcii",
  onComplete,
  height = "600px"
}: GuidedMCIIProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [interactionState, setInteractionState] = useState<"guiding" | "confirming" | "chatting">("guiding");
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const [feedbackReceived, setFeedbackReceived] = useState(false);
  const [chatAnalyticsId, setChatAnalyticsId] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<string | null>(null);
  const [showRetryOption, setShowRetryOption] = useState(false);
  const [editingSingleQuestion, setEditingSingleQuestion] = useState<number | null>(null);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  // ------------------------------------------------------------------
  // Ch4 research instrumentation (2026-04-17):
  // One feedback_cycle_id per R→feedback→R cycle, shared across
  // text_input / chat_message / feedback_delivered / revision_submitted
  // so downstream SQL can JOIN R1/feedback/R2 instead of relying on
  // fragile timestamp ordering. Rotated on each handleEditResponses.
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
      ? (MCII_QUESTIONS[currentQuestionIndex]?.id ?? 'guided_input')
      : 'chat_revision_input',
    // Lazy-init cycle id on first paste/focus/blur (see
    // guided-learning-objective.tsx for rationale).
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
            const allAnswered = MCII_QUESTIONS.every(q => parsedResponses[q.id] && parsedResponses[q.id].trim().length > 0);
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
            { id: uuidv4(), sender: "bot", content: { pick_goal: saved["pick_goal"], indulge: saved["indulge"], consider_obstacles: saved["consider_obstacles"], implementation_intention: saved["implementation_intention"] }, type: "confirmation" }
          ]);
          return;
        }
      }

      setMessages([
        { id: uuidv4(), sender: "bot", content: "Welcome to the MCII (Mental Contrasting with Implementation Intentions) exercise! I'll guide you through four steps to create a powerful strategic plan for achieving your learning goal.", type: "question" },
        { id: uuidv4(), sender: "bot", content: MCII_QUESTIONS[0].question, type: "question" }
      ]);
    };
    initializeChat();
  }, [phase, component]);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase4-mcii");
    if (chatContainer) { chatContainer.scrollTop = chatContainer.scrollHeight; }
  }, [messages, isLoading]);

  // NOTE: Removed duplicate onComplete useEffect — onComplete is already called in submitToApi on success

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

    const questionId = MCII_QUESTIONS[currentQuestionIndex].id;
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
        question_text: MCII_QUESTIONS[currentQuestionIndex].question,
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
            question_text: MCII_QUESTIONS[currentQuestionIndex].question,
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

    // If editing a single question, return to confirmation after this answer
    if (editingSingleQuestion !== null) {
      setEditingSingleQuestion(null);
      setInteractionState("confirming");
      botMessages.push({
        id: uuidv4(),
        sender: "bot",
        content: {
          pick_goal: newResponses["pick_goal"],
          indulge: newResponses["indulge"],
          consider_obstacles: newResponses["consider_obstacles"],
          implementation_intention: newResponses["implementation_intention"],
        },
        type: "confirmation",
      });
    } else if (currentQuestionIndex < MCII_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: MCII_QUESTIONS[nextQuestionIndex].question, type: "question" });
    } else {
      setInteractionState("confirming");
      botMessages.push({
        id: uuidv4(),
        sender: "bot",
        content: {
          pick_goal: newResponses["pick_goal"],
          indulge: newResponses["indulge"],
          consider_obstacles: newResponses["consider_obstacles"],
          implementation_intention: newResponses["implementation_intention"],
        },
        type: "confirmation",
      });
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
    // Same pattern as guided-learning-objective.tsx — see that file for
    // the design rationale.

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
          // Hide in-progress INSTRUCTOR_METADATA comment block from
          // the displayed content — see guided-learning-objective.tsx
          // for the rationale.
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
    const fullMCIIPlan = `Goal: ${responses["pick_goal"] || ""}\n\nIndulge (Visualization): ${responses["indulge"] || ""}\n\nConsider Obstacles: ${responses["consider_obstacles"] || ""}\n\nImplementation Intention: ${responses["implementation_intention"] || ""}`;
    
    // Save the MCII plan to localStorage
    try {
      localStorage.setItem("solbot_mcii_plan", JSON.stringify(responses));
    } catch (error) {
      console.error("Failed to save MCII plan to localStorage:", error);
    }

    submitToApi(fullMCIIPlan);
  };
  
  const handleSendChatMessage = () => {
      if (!userInput.trim()) return;
      const userMessage: Message = { id: uuidv4(), sender: "user", content: userInput, type: "response" };
      setMessages(prev => [...prev, userMessage]);
      const messageToSend = userInput;
      setUserInput("");
      submitToApi(messageToSend);
  }

  const handleEditResponses = () => {
    setInteractionState("guiding");
    setCurrentQuestionIndex(0);
    setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's revise your MCII plan. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: MCII_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[MCII_QUESTIONS[0].id] || "");

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

  const handleEditSingleQuestion = (questionIndex: number) => {
    setEditingSingleQuestion(questionIndex);
    setInteractionState("guiding");
    setCurrentQuestionIndex(questionIndex);
    const questionId = MCII_QUESTIONS[questionIndex].id;
    setMessages(prev => [
      ...prev,
      { id: uuidv4(), sender: "bot", content: `Editing your response for: **${["Goal", "Indulge (Visualization)", "Consider Obstacles", "Implementation Intention"][questionIndex]}**`, type: "question" },
      { id: uuidv4(), sender: "bot", content: MCII_QUESTIONS[questionIndex].question, type: "question" }
    ]);
    setUserInput(responses[questionId] || "");
  };

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
        pick_goal: "Your goal",
        indulge: "Best outcome (visualization)",
        consider_obstacles: "Biggest obstacle",
        implementation_intention: "If-Then plan",
      };
      const receiptSections = MCII_QUESTIONS
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
  
   const accent = "var(--accent-text)"
  const neutralSurface = "hsl(var(--card) / 0.96)"
  const neutralBorder = "hsl(var(--border) / 0.4)"
  const mutedText = "hsl(var(--muted-foreground))"
  const primaryButtonStyle = {
    backgroundImage: "linear-gradient(135deg, #b8892e, #96722d)",
    color: "#fff",
    border: `1px solid ${neutralBorder}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
  }

  const renderInputArea = () => {
    if (interactionState === 'guiding') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-xs" style={{ color: mutedText }}>
            <div className="flex-1">Step {currentQuestionIndex + 1} of {MCII_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={MCII_QUESTIONS[currentQuestionIndex].hint}
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
          {/* Edit Responses — full restart Q1→Q4 with explicit warning */}
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
                  four MCII answers, and take you back to{" "}
                  <strong>Question 1 (your goal)</strong>. You&apos;ll
                  need to answer all four questions again from the
                  beginning. Your previous answers will not be saved.
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
              placeholder="Refine your MCII plan based on the feedback..."
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
          {/* Edit Responses — full restart Q1→Q4 with explicit warning.
              Available here (chatting state) so a student who saw
              feedback and wants to revise from scratch doesn't have to
              look for it via the Submit Final button. */}
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
                  four MCII answers, and take you back to{" "}
                  <strong>Question 1 (your goal)</strong>. You&apos;ll
                  need to answer all four questions again from the
                  beginning. Your previous answers will not be saved.
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
                  const fullAnswer = MCII_QUESTIONS
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
        id="guided-chat-container-phase4-mcii"
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
                backgroundColor: neutralSurface,
                borderColor: neutralBorder,
                color: "hsl(var(--foreground))"
              }}
            >
              <CardContent className="p-3 text-sm overflow-hidden max-w-full">
                 {message.type === 'confirmation' && typeof message.content === 'object' ? (
                    // Ch4 (2026-04-17): simplified confirmation preview.
                    // Shows the whole MCII plan as one continuous block,
                    // no per-step labels (Goal/Indulge/Obstacles/Intention)
                    // and no click-to-edit on sections. Per-section
                    // editing was error-prone; the only edit path now is
                    // the explicit "Edit Responses" button which clears
                    // history and restarts Q1→Q4 with confirmation.
                    <div className="space-y-3">
                      <p>Thank you for your thoughtful responses! Here is your complete MCII plan. Please review it.</p>
                      <div
                        className="p-3 rounded-md border whitespace-pre-wrap text-sm"
                        style={{
                          backgroundColor: "hsl(var(--muted) / 0.4)",
                          borderColor: neutralBorder,
                        }}
                      >
                        {[
                          (message.content as Record<string, string>).pick_goal,
                          (message.content as Record<string, string>).indulge,
                          (message.content as Record<string, string>).consider_obstacles,
                          (message.content as Record<string, string>).implementation_intention,
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
