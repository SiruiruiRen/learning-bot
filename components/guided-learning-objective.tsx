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

interface GuidedLearningObjectiveProps {
  userId: string
  phase: string
  phaseNumber?: number
  component?: string
  onComplete?: (nextPhase?: string) => void
  height?: string
}

const OBJECTIVE_QUESTIONS = [
  {
    id: "goal_clarity",
    question: "For your chosen course/task: What are you learning right now? Describe the key topics, skills, and objectives involved.",
    hint: "Think about what topics you're covering right now in your course."
  },
  {
    id: "background_connection",
    question: "What learning materials and resources do you have access to?",
    hint: "What do you use when you study for this course?"
  },
  {
    id: "study_resources",
    question: "How will you use these resources to maximize your learning?",
    hint: "How do you plan to use these materials?"
  }
];

const CHARACTER_LIMIT = 5000;
const loadingMessages = [
  "Analyzing your learning objective...",
  "How does this objective connect to what you already know?",
  "Is the cognitive level (knowledge, comprehension, analysis) clear?",
  "What specific action does the verb in your objective suggest?",
  "Connecting to pedagogical principles...",
  "Crafting personalized feedback..."
];

type MessageContent = string | { task: string; resources: string; strategy: string; };
type Message = {
  id: string
  sender: "bot" | "user"
  content: MessageContent
  type: "question" | "response" | "confirmation" | "evaluation";
  evaluation?: any;
}

export default function GuidedLearningObjective({
  userId,
  phase,
  phaseNumber = 2,
  component = "learning_objectives",
  onComplete,
  height = "600px"
}: GuidedLearningObjectiveProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [userInput, setUserInput] = useState("")
  const [interactionState, setInteractionState] = useState<"guiding" | "confirming" | "chatting">("guiding");
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const [chatAnalyticsId, setChatAnalyticsId] = useState<string | null>(null);
  const [feedbackReceived, setFeedbackReceived] = useState(false);
  const [lastFailedRequest, setLastFailedRequest] = useState<string | null>(null);
  const [showRetryOption, setShowRetryOption] = useState(false);
  const [editingSingleQuestion, setEditingSingleQuestion] = useState<number | null>(null);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  // ------------------------------------------------------------------
  // Ch4 research instrumentation (2026-04-17):
  // Every R1 → feedback → R2 cycle gets one feedback_cycle_id, shared
  // across all events of that cycle (text_input, chat_message,
  // feedback_delivered, revision_submitted). Downstream SQL can then
  // reconstruct R1/feedback/R2 triples by JOIN on this id, instead of
  // the fragile timestamp-ordering workaround.
  //
  // New cycle id generated at: (a) first use after mount, (b) each
  // handleEdit (closing one cycle, starting the next). Page reload
  // mid-session regenerates — the prior id is not persisted (acceptable
  // minor noise; the refresh-and-continue case is rare).
  // ------------------------------------------------------------------
  const feedbackCycleIdRef = useRef<string | null>(null);
  const getCurrentCycleId = (): string => {
    if (!feedbackCycleIdRef.current) {
      feedbackCycleIdRef.current = newTurnId();
    }
    return feedbackCycleIdRef.current;
  };
  // attempt_number = number of evaluations already seen + 1.
  // On initial R1 (no evaluations yet) this is 1; after first feedback
  // it's 2; matches the computation already used in revision_submitted.
  const computeAttemptNumber = (): number =>
    messages.filter(m => m.type === 'evaluation').length + 1;

  // Ch4: textarea engagement telemetry (focus/blur/paste/copy).
  // CRITICAL for Indicator 6 — a paste event captures the verbatim
  // pasted text so we can detect direct adoption of chatbot feedback
  // by comparing against the paired feedback_delivered.feedback_text.
  const textareaTelemetry = useTextareaTelemetry({
    phase,
    component,
    getFieldName: () => interactionState === 'guiding'
      ? (OBJECTIVE_QUESTIONS[currentQuestionIndex]?.id ?? 'guided_input')
      : 'chat_revision_input',
    // Use the lazy-init helper so a paste/focus/blur that happens
    // BEFORE any text_input still gets a cycle id — the cycle starts
    // the first time ANY instrumented event fires, not only on submit.
    getFeedbackCycleId: () => getCurrentCycleId(),
    getSessionId: () => sessionId,
  });

  const { loadChatState, saveChatState, clearChatState } = useChatPersistence(component, phase);

  // Save full chat state whenever key state changes.
  // Ch4: also persist feedbackCycleId so reloads preserve cycle alignment.
  useEffect(() => {
    if (messages.length === 0) return; // Don't save empty state
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

        // Try to restore full chat state first (complete conversation history)
        const savedChatState = loadChatState();
        if (savedChatState && savedChatState.messages.length > 0) {
          setMessages(savedChatState.messages);
          setInteractionState(savedChatState.interactionState);
          setCurrentQuestionIndex(savedChatState.currentQuestionIndex);
          setResponses(savedChatState.responses);
          setFeedbackReceived(savedChatState.feedbackReceived);
          setFinalSubmitted(savedChatState.finalSubmitted);
          // Restore the active feedback_cycle_id so post-reload events
          // keep the same grouping as pre-reload events.
          if (savedChatState.feedbackCycleId) {
            feedbackCycleIdRef.current = savedChatState.feedbackCycleId;
          }
          console.log("Restored full chat state from localStorage");

          // Log chat_resumed event
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
            const allAnswered = OBJECTIVE_QUESTIONS.every(q => parsedResponses[q.id] && parsedResponses[q.id].trim().length > 0);
            if (allAnswered) {
              hasSavedResponses = true;
            }
          }
        } catch (error) {
          console.warn("Could not load saved responses:", error);
        }

        // Log chat_started event via unified events API
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
          if (data.id) {
            setChatAnalyticsId(data.id);
          }
        } catch (error) {
          console.error("Failed to create chat analytics entry:", error);
        }

        // If all responses exist (returning from Edit), jump to confirming/summary
        if (hasSavedResponses) {
          const saved = JSON.parse(localStorage.getItem(`solbot_temp_responses_${component}_${phase}`) || "{}");
          setInteractionState("confirming");
          setMessages([
            { id: uuidv4(), sender: "bot", content: "Welcome back! Here are your saved responses. Click any section to edit it.", type: "question" },
            { id: uuidv4(), sender: "bot", content: { task: saved["goal_clarity"], resources: saved["background_connection"], strategy: saved["study_resources"] }, type: "confirmation" }
          ]);
          return;
        }
      }

      setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's define your learning objective. I'll guide you through the process step by step.", type: "question" },
        { id: uuidv4(), sender: "bot", content: OBJECTIVE_QUESTIONS[0].question, type: "question" }
      ]);
    };

    initializeChat();
  }, [phase, component]);

  useEffect(() => {
    const chatContainer = document.getElementById("guided-chat-container-phase2");
    if (chatContainer) { chatContainer.scrollTop = chatContainer.scrollHeight; }
  }, [messages, isLoading]);
  
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

    const questionId = OBJECTIVE_QUESTIONS[currentQuestionIndex].id;
    const newResponses = { ...responses, [questionId]: userInput };
    setResponses(newResponses);

    // Save responses to localStorage to prevent data loss
    try {
      localStorage.setItem(`solbot_temp_responses_${component}_${phase}`, JSON.stringify(newResponses));
    } catch (error) {
      console.warn("Could not save responses to localStorage:", error);
    }

    // Log individual question response for research analytics.
    // Ch4: attempt_number is derived from evaluations seen (not hardcoded 1),
    // so each revision cycle's text_inputs carry the correct cycle index.
    // feedback_cycle_id groups all events of one R→feedback→R cycle.
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
        question_text: OBJECTIVE_QUESTIONS[currentQuestionIndex].question,
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
            question_text: OBJECTIVE_QUESTIONS[currentQuestionIndex].question,
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
      task: newResponses["goal_clarity"],
      resources: newResponses["background_connection"],
      strategy: newResponses["study_resources"]
    };

    // If editing a single question, return to confirmation after this answer
    if (editingSingleQuestion !== null) {
      setEditingSingleQuestion(null);
      setInteractionState("confirming");
      botMessages.push({ id: uuidv4(), sender: "bot", content: confirmationContent, type: "confirmation" });
    } else if (currentQuestionIndex < OBJECTIVE_QUESTIONS.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      botMessages.push({ id: uuidv4(), sender: "bot", content: OBJECTIVE_QUESTIONS[nextQuestionIndex].question, type: "question" });
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
    // Token-by-token render so students see the feedback appearing as
    // Claude generates it (first-token ~1s vs. 4-8s for the full blob).
    // captureToWAL calls are all synchronous; /api/events POSTs are
    // fire-and-forget to avoid the "await-fetch-blocks-UI" bug class
    // we just fixed elsewhere.

    // Log user chat_message (fire-and-forget).
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

    // Create a placeholder bot message now, so the UI shows an empty
    // bot bubble that fills in character-by-character. Cache its id so
    // we can update it in onText and finalize it in onComplete.
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
          // Hide any partial `<!-- INSTRUCTOR_METADATA ...` block from
          // the student while the stream is still arriving — otherwise
          // they'd see the rubric scores flash by as raw comment text
          // for a couple seconds before onComplete swaps in the cleaned
          // final content. `accumulated` (the full raw text) is still
          // forwarded to onComplete for server-side evaluation parsing.
          const displayable = stripPendingMetadata(accumulated);
          setMessages(prev => prev.map(m =>
            m.id === botMessageId
              ? { ...m, content: displayable }
              : m
          ));
        },
        onComplete: (cleanedContent, evaluation, model) => {
          // Replace the streaming placeholder with the final cleaned
          // content + parsed rubric evaluation (so FeedbackDisplay can
          // render the score bars).
          setMessages(prev => prev.map(m =>
            m.id === botMessageId
              ? { ...m, content: cleanedContent || accumulated, evaluation: evaluation as any }
              : m
          ));
          setFeedbackReceived(true);
          setLastFailedRequest(null);

          // ===== WAL: feedback_delivered with evaluation + feedback_text =====
          // Ch4 (2026-04-17): feedback_text = the narrative the student
          // actually read; feedback_cycle_id = JOIN key linking R1/feedback/R2.
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

          // ===== WAL: assistant chat_message =====
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

          // ===== chat_ended (for chat_analytics aggregate tracking) =====
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
          // Replace the placeholder with a friendly error message and
          // let the student retry.
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

    // streamChat returns after the stream's terminal event (complete or
    // error) has been dispatched, so we can flip back to chatting state
    // and clear the loader here.
    setIsLoading(false);
    setInteractionState("chatting");
  };

  const handleRetryFeedback = () => {
    if (lastFailedRequest) {
      submitToApi(lastFailedRequest, true);
    }
  };

  const handleSubmitForFeedback = () => {
    const fullObjective = `Course/Learning Task: ${responses["goal_clarity"]}\n\nAvailable Resources: ${responses["background_connection"]}\n\nStrategic Resource Utilization: ${responses["study_resources"]}`;
    submitToApi(fullObjective);
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
      // ---- BUG FIX 2026-04-17 ----
      // CRITICAL: mark the phase completed in localStorage BEFORE any
      // network call. Previously the `await fetch('/api/events', ...)`
      // below could hang up to 30s on Render cold start, and users who
      // refreshed/navigated during that window never got
      // `solbot_phase{N}_completed=true` written — SessionGate then
      // bounced them back to the same phase on next load, even though
      // they'd already "finished" it.
      //
      // WAL capture (captureToWAL) is synchronous and already durable,
      // so the research data stays intact regardless of fetch timing.
      // The /api/events call is now fire-and-forget — its `.catch`
      // handler makes it safe to skip the `await`.
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
        // Fire-and-forget — no `await`. If the backend is cold,
        // the user still proceeds; the WAL row above is durable.
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sid,
            event_type: "final_submission",
            phase: `phase${phaseNumber}`,
            component,
            metadata: {
              responses,
              feedback_cycle_id: _finalCycleId,
              timestamp: new Date().toISOString(),
            },
          }),
        }).catch(err => console.error("Failed to log final_submission:", err));
      }
      if (uid) {
        fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: uid,
            dataType: `phase${phaseNumber}_completed`,
            value: "true",
            metadata: { phase: phaseNumber, timestamp: new Date().toISOString() },
          }),
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
        goal_clarity: "What you're learning",
        background_connection: "Your resources",
        study_resources: "How you'll use them",
      };
      const receiptSections = OBJECTIVE_QUESTIONS
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

  const handleEdit = () => {
    setInteractionState("guiding");
    setCurrentQuestionIndex(0);
    setMessages([
        { id: uuidv4(), sender: "bot", content: "Let's revise your learning objective. Here's the first question again.", type: "question" },
        { id: uuidv4(), sender: "bot", content: OBJECTIVE_QUESTIONS[0].question, type: "question" }
    ]);
    setUserInput(responses[OBJECTIVE_QUESTIONS[0].id] || "");

    if (sessionId) {
      // Capture BEFORE rotation so this event closes the previous cycle.
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
    // Rotate cycle: next round of text_inputs = R_{n+1}, new cycle id.
    feedbackCycleIdRef.current = newTurnId();
  };

  const handleEditSingleQuestion = (questionIndex: number) => {
    setEditingSingleQuestion(questionIndex);
    setInteractionState("guiding");
    setCurrentQuestionIndex(questionIndex);
    const questionId = OBJECTIVE_QUESTIONS[questionIndex].id;
    setMessages(prev => [
      ...prev,
      { id: uuidv4(), sender: "bot", content: `Editing your response for: **${["Course/Learning Task", "Available Resources", "Strategic Resource Utilization"][questionIndex]}**`, type: "question" },
      { id: uuidv4(), sender: "bot", content: OBJECTIVE_QUESTIONS[questionIndex].question, type: "question" }
    ]);
    setUserInput(responses[questionId] || "");
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
            <div className="flex-1">Question {currentQuestionIndex + 1} of {OBJECTIVE_QUESTIONS.length}</div>
            <div>{userInput.length} / {CHARACTER_LIMIT}</div>
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder={OBJECTIVE_QUESTIONS[currentQuestionIndex].hint}
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
          {/* Edit Responses — destructive-ish action, requires confirmation */}
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
                  three answers, and take you back to{" "}
                  <strong>Question 1</strong>. You&apos;ll need to answer
                  all three questions again from the beginning. Your
                  previous answers will not be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEdit}>
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
      if (finalSubmitted) {
        return null; // Input hidden after final submission
      }
      return (
        <div className="flex flex-col space-y-3">
          <div className="flex gap-2 items-start">
            <Textarea
              placeholder="Refine your learning objective based on the feedback..."
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                if (feedbackReceived && e.target.value.length === 1 && userInput.length === 0 && sessionId) {
                  const _revStartCycle = getCurrentCycleId();
                  captureToWAL("user_revision_tracking", {
                    event_type: "revision_started",
                    phase: phase,
                    component: component,
                    feedback_cycle_id: _revStartCycle,
                    timestamp: new Date().toISOString(),
                  }, { sessionId, eventType: "revision_started" })
                  fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      session_id: sessionId,
                      event_type: 'revision_started',
                      phase: phase,
                      component: component,
                      metadata: {
                        feedback_cycle_id: _revStartCycle,
                        timestamp: new Date().toISOString()
                      }
                    })
                  }).catch(err => console.error("Failed to log revision_started:", err));
                }
              }}
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
          {/* Edit Responses — full restart Q1→Q3 with explicit warning.
              Appears here (chatting state) so a student who saw feedback
              and now wants to revise from scratch doesn't have to look
              for the Submit Final button first. */}
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
                  three answers, and take you back to{" "}
                  <strong>Question 1</strong>. You&apos;ll need to answer
                  all three questions again from the beginning. Your
                  previous answers will not be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEdit}>
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
                  sub-labels), so they see exactly what will be
                  recorded. Joined with blank lines between paragraphs. */}
              <div className="max-h-[55vh] overflow-y-auto rounded-lg border p-4 bg-muted/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Your answer
                </p>
                {(() => {
                  const fullAnswer = OBJECTIVE_QUESTIONS
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
      <div id="guided-chat-container-phase2" className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
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
                  // Shows the whole answer as one continuous block — no
                  // per-component labels (Course/Learning Task, Available
                  // Resources, Strategic Resource Utilization) and no
                  // click-to-edit on individual sections. Per-section
                  // editing was error-prone; the only edit path now is
                  // the explicit "Edit Responses" button which clears
                  // history and restarts Q1→Q3 (with confirmation).
                  <div className="space-y-3">
                    <p>Thank you! Here is your complete learning objective. Please review it.</p>
                    <div
                      className="p-3 rounded-md border whitespace-pre-wrap text-sm"
                      style={{
                        backgroundColor: "hsl(var(--muted) / 0.5)",
                        borderColor: neutralBorder,
                      }}
                    >
                      {[
                        (message.content as Record<string, string>).task,
                        (message.content as Record<string, string>).resources,
                        (message.content as Record<string, string>).strategy,
                      ]
                        .map((s) => (s ?? "").trim())
                        .filter(Boolean)
                        .join("\n\n")}
                    </div>
                  </div>
                ) : message.type === 'evaluation' ? (
                  <FeedbackDisplay 
                    content={message.content as string}
                    evaluation={message.evaluation}
                    userMessage={messages.find(m => m.sender === "user" && m.type === "response")?.content as string}
                    phase={phase}
                    component={component}
                    sessionId={localStorage.getItem("session_id") || undefined}
                    currentStyle={localStorage.getItem("solbot_coach_tone") || "warm"}
                  />
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
      
      {/* Remove the continue button since there's already a "Next to Phase 3" button outside the chat */}
    </div>
  )
} 