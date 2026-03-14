"use client"

import { Brain, Target, BookMarked, TrendingUp, Medal, ArrowRight } from 'lucide-react';

const srlSteps = [
  {
    phase: 1,
    title: "Plan & Analyze",
    icon: Target,
    description: "Understand the task and make a plan.",
  },
  {
    phase: 2,
    title: "Implement Strategies",
    icon: BookMarked,
    description: "Use evidence-based methods to learn.",
  },
  {
    phase: 3,
    title: "Monitor Progress",
    icon: TrendingUp,
    description: "Check your understanding as you go.",
  },
  {
    phase: 4,
    title: "Reflect & Adapt",
    icon: Brain,
    description: "Adjust your approach based on what's working.",
  },
];

export function SrlSummary() {
  const accent = "var(--accent-text)";
  const borderColor = "hsl(var(--border))";
  const foreground = "hsl(var(--foreground))";
  const mutedForeground = "hsl(var(--muted-foreground))";
  const cardBg = "hsl(var(--card))";

  return (
    <div className="space-y-4">
      <h3
        className="text-2xl font-bold text-center"
        style={{ color: accent }}
      >
        The Learning Cycle
      </h3>
      <p
        className="text-center max-w-3xl mx-auto"
        style={{ color: mutedForeground }}
      >
        Effective learning is a cycle you can control. Here's a recap of
        what you practiced across the training.
      </p>

      {/* Central hub */}
      <div className="flex justify-center pt-4 pb-2">
        <div
          className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2"
          style={{
            backgroundColor: cardBg,
            borderColor: accent,
            boxShadow: "0 0 24px rgba(184,137,46,0.15)",
          }}
        >
          <Medal className="h-7 w-7" style={{ color: accent }} />
          <p
            className="text-[10px] text-center mt-1 font-medium"
            style={{ color: mutedForeground }}
          >
            Your Learning
            <br />
            System
          </p>
        </div>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {srlSteps.map((step, index) => (
          <div key={step.phase} className="relative">
            <div
              className="p-5 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: "hsl(var(--card) / 0.7)",
                borderColor: borderColor,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "hsl(var(--primary) / 0.12)",
                  }}
                >
                  <step.icon
                    className="h-5 w-5"
                    style={{ color: accent }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "hsl(var(--primary) / 0.12)",
                        color: accent,
                      }}
                    >
                      {index + 1}
                    </span>
                    <h4
                      className="font-semibold text-sm"
                      style={{ color: foreground }}
                    >
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: mutedForeground }}>
                    {step.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow connector (except last) */}
            {index < srlSteps.length - 1 && (
              <div className="hidden sm:block">
                {/* Right arrow for top row (0 -> 1) */}
                {index === 0 && (
                  <div
                    className="absolute top-1/2 -right-4 -translate-y-1/2"
                    style={{ color: "hsl(var(--border))" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
                {/* Down arrow for right column (1 -> 2) */}
                {index === 1 && (
                  <div
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 rotate-90"
                    style={{ color: "hsl(var(--border))" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cycle indicator */}
      <div className="flex justify-center pt-2">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.08)",
            color: accent,
            border: `1px solid hsl(var(--primary) / 0.15)`,
          }}
        >
          <RotateCwIcon className="h-3.5 w-3.5" />
          Continuous improvement cycle
        </div>
      </div>
    </div>
  );
}

function RotateCwIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
