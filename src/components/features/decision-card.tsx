"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGoals } from "@/hooks/use-goals";
import type { Decision } from "@/lib/store";

interface DecisionCardProps {
  decision: Decision;
  onDelete: (id: string) => void;
}

export function DecisionCard({ decision, onDelete }: DecisionCardProps) {
  const goals = useGoals();

  const totalA = decision.criteria.reduce(
    (sum, c) => sum + c.weight * c.score_a,
    0
  );
  const totalB = decision.criteria.reduce(
    (sum, c) => sum + c.weight * c.score_b,
    0
  );
  const maxPossible = decision.criteria.reduce(
    (sum, c) => sum + c.weight * 10,
    0
  );

  const percentA =
    maxPossible > 0 ? Math.round((totalA / maxPossible) * 100) : 0;
  const percentB =
    maxPossible > 0 ? Math.round((totalB / maxPossible) * 100) : 0;

  const winner = totalA > totalB ? "A" : totalB > totalA ? "B" : "tie";
  const margin = Math.abs(percentA - percentB);

  const goalName = (goalId: string) =>
    goals.find((g) => g.id === goalId)?.title ?? "Unknown Goal";

  const topCriteria = [...decision.criteria]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const radarLabels = topCriteria.map((c) => goalName(c.goal_id));

  const polygonPoints = (scores: number[]) => {
    const centerX = 120;
    const centerY = 120;
    const radius = 76;
    return scores
      .map((score, idx) => {
        const angle = (Math.PI * 2 * idx) / scores.length - Math.PI / 2;
        const scaledRadius = (Math.max(1, Math.min(10, score)) / 10) * radius;
        const x = centerX + Math.cos(angle) * scaledRadius;
        const y = centerY + Math.sin(angle) * scaledRadius;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const axisPoints = (idx: number, totalAxes: number, axisRadius: number) => {
    const centerX = 120;
    const centerY = 120;
    const angle = (Math.PI * 2 * idx) / totalAxes - Math.PI / 2;
    const x = centerX + Math.cos(angle) * axisRadius;
    const y = centerY + Math.sin(angle) * axisRadius;
    return { x, y };
  };

  const aiVerdict =
    winner === "tie"
      ? `Navigator verdict: both options are evenly matched in your current weighting model.`
      : winner === "A"
        ? `Navigator verdict: ${decision.option_a} leads by ${margin}% in weighted fit with your current priorities.`
        : `Navigator verdict: ${decision.option_b} leads by ${margin}% in weighted fit with your current priorities.`;

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-base">{decision.title}</h3>
          <p className="text-xs text-muted-foreground">
            {format(new Date(decision.created_at), "MMM d, yyyy")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(decision.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px_1fr] items-start">
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-center bg-muted/30",
            winner === "A" && "border-cyan-300/55 bg-cyan-500/10"
          )}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Option A
          </p>
          <p className="text-sm font-medium mt-1">{decision.option_a}</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{percentA}%</p>
        </div>

        {/* Lightweight SVG radar to avoid adding chart dependencies */}
        <div className="rounded-xl border border-border bg-card/50 p-3">
          <svg viewBox="0 0 240 240" className="w-full h-auto">
            {[20, 40, 60, 80].map((r) => (
              <circle
                key={r}
                cx="120"
                cy="120"
                r={r}
                fill="none"
                stroke="rgb(148 163 184 / 0.24)"
                strokeWidth="1"
              />
            ))}
            {radarLabels.map((label, idx) => {
              const { x, y } = axisPoints(idx, radarLabels.length, 84);
              return (
                <g key={label}>
                  <line
                    x1="120"
                    y1="120"
                    x2={x}
                    y2={y}
                    stroke="rgb(148 163 184 / 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={y}
                    fontSize="9"
                    fill="rgb(203 213 225 / 0.8)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {label.length > 12 ? `${label.slice(0, 12)}...` : label}
                  </text>
                </g>
              );
            })}
            <polygon
              points={polygonPoints(topCriteria.map((c) => c.score_a))}
              fill="rgb(34 211 238 / 0.20)"
              stroke="rgb(34 211 238 / 0.85)"
              strokeWidth="1.5"
            />
            <polygon
              points={polygonPoints(topCriteria.map((c) => c.score_b))}
              fill="rgb(250 204 21 / 0.18)"
              stroke="rgb(250 204 21 / 0.78)"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-center bg-muted/30",
            winner === "B" && "border-amber-300/60 bg-amber-500/10"
          )}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Option B
          </p>
          <p className="text-sm font-medium mt-1">{decision.option_b}</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{percentB}%</p>
        </div>
      </div>

      {/* Criteria breakdown */}
      <div className="text-xs space-y-1.5">
        {decision.criteria.map((c) => {
          const scoreA = c.weight * c.score_a;
          const scoreB = c.weight * c.score_b;
          return (
            <div key={c.goal_id} className="flex items-center gap-2">
              <span className="flex-1 text-muted-foreground truncate">
                {goalName(c.goal_id)}
              </span>
              <span
                className={cn(
                  "tabular-nums w-6 text-right",
                  scoreA > scoreB && "font-medium text-foreground"
                )}
              >
                {scoreA}
              </span>
              <span className="text-muted-foreground/40">vs</span>
              <span
                className={cn(
                  "tabular-nums w-6",
                  scoreB > scoreA && "font-medium text-foreground"
                )}
              >
                {scoreB}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-foreground/95">
        {aiVerdict}
      </div>
    </div>
  );
}
