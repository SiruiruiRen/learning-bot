"use client"

const srlSteps = [
  { num: 1, title: "Plan & Analyze" },
  { num: 2, title: "Implement Strategies" },
  { num: 3, title: "Monitor Progress" },
  { num: 4, title: "Reflect & Adapt" },
];

export function SrlSummary() {
  const accent = "var(--accent-text)";
  const mutedForeground = "hsl(var(--muted-foreground))";
  const foreground = "hsl(var(--foreground))";

  return (
    <div className="space-y-3">
      <h3
        className="text-2xl font-bold text-center"
        style={{ color: accent }}
      >
        The Learning Cycle
      </h3>
      <p
        className="text-center text-sm"
        style={{ color: mutedForeground }}
      >
        Effective learning follows four steps — plan, act, check, adjust — then repeat.
      </p>

      <div className="flex items-center justify-center gap-1 pt-2 flex-wrap">
        {srlSteps.map((step, i) => (
          <div key={step.num} className="flex items-center gap-1">
            <span
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "hsl(var(--primary) / 0.10)",
                color: foreground,
              }}
            >
              <span
                className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "hsl(var(--primary) / 0.18)", color: accent }}
              >
                {step.num}
              </span>
              {step.title}
            </span>
            {i < srlSteps.length - 1 && (
              <span className="text-xs" style={{ color: mutedForeground }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
