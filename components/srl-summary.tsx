"use client"

import { Brain, Target, BookMarked, TrendingUp, Medal } from 'lucide-react';

const srlSteps = [
  {
    phase: 1,
    title: "Plan & Analyze",
    icon: Target,
    description: "Understand the task and make a plan.",
    color: "hsl(217, 91%, 60%)", // Blue
    bg: "hsl(217, 91%, 95%)",
  },
  {
    phase: 2,
    title: "Implement Strategies",
    icon: BookMarked,
    description: "Use evidence-based methods to learn.",
    color: "hsl(262, 83%, 58%)", // Purple
    bg: "hsl(262, 83%, 95%)",
  },
  {
    phase: 3,
    title: "Monitor Progress",
    icon: TrendingUp,
    description: "Check your understanding as you go.",
    color: "hsl(35, 55%, 55%)", // Warm gold
    bg: "hsl(35, 55%, 95%)",
  },
  {
    phase: 4,
    title: "Reflect & Adapt",
    icon: Brain,
    description: "Adjust your approach based on what's working.",
    color: "hsl(340, 75%, 55%)", // Rose
    bg: "hsl(340, 75%, 95%)",
  },
];

export function SrlSummary() {
  const accent = "hsl(var(--primary))";
  const borderColor = "hsl(var(--border))";
  const foreground = "hsl(var(--foreground))";
  const mutedForeground = "hsl(var(--muted-foreground))";
  const cardBg = "hsl(var(--card))";
  const mutedBg = "hsl(var(--muted))";

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-center" style={{ color: accent }}>
        Your Self-Regulated Learning Blueprint
      </h3>
      <p className="text-center max-w-3xl mx-auto" style={{ color: mutedForeground }}>
        Effective learning is a cycle you can control. Here is a summary of the core principles you've learned. Use this blueprint to approach any learning task more effectively.
      </p>
      <div 
        className="p-6 rounded-lg border"
        style={{ 
          backgroundColor: mutedBg,
          borderColor: borderColor
        }}
      >
        <div className="relative">
          {/* Circular path */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div 
              className="w-64 h-64 border-2 border-dashed rounded-full animate-spin-slow"
              style={{ borderColor: borderColor }}
            ></div>
          </div>
          
          {/* Center Hub */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-32 h-32 rounded-full border-2"
            style={{ 
              backgroundColor: cardBg,
              borderColor: accent,
              color: foreground
            }}
          >
            <Medal className="h-8 w-8" style={{ color: accent }} />
            <p className="text-xs text-center mt-1" style={{ color: mutedForeground }}>
              Your Learning System
            </p>
          </div>
          
          {/* Steps on the circle */}
          <div className="relative w-full h-96">
            {srlSteps.map((step, index) => {
              const angle = (index / srlSteps.length) * 2 * Math.PI - (Math.PI / 2); // Start from top
              const x = 50 + 40 * Math.cos(angle);
              const y = 50 + 40 * Math.sin(angle);
              return (
                <div 
                  key={step.phase} 
                  className="absolute"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div 
                    className="w-32 h-32 p-3 rounded-lg flex flex-col items-center justify-center text-center border"
                    style={{
                      backgroundColor: step.bg,
                      borderColor: borderColor
                    }}
                  >
                    <step.icon className="h-6 w-6 mb-1" style={{ color: step.color }} />
                    <h4 className="font-semibold text-sm" style={{ color: foreground }}>
                      {step.title}
                    </h4>
                    <p className="text-xs" style={{ color: mutedForeground }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 