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

  const goalName = (goalId: string) =>
    goals.find((g) => g.id === goalId)?.title ?? "Unknown Goal";

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{decision.title}</h3>
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

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={cn(
            "rounded-md border px-3 py-2.5 text-center",
            winner === "A" && "border-foreground/30 bg-muted/40"
          )}
        >
          <p className="text-sm font-medium">{decision.option_a}</p>
          <p className="text-xl font-semibold mt-1 tabular-nums">{percentA}%</p>
        </div>
        <div
          className={cn(
            "rounded-md border px-3 py-2.5 text-center",
            winner === "B" && "border-foreground/30 bg-muted/40"
          )}
        >
          <p className="text-sm font-medium">{decision.option_b}</p>
          <p className="text-xl font-semibold mt-1 tabular-nums">{percentB}%</p>
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
    </div>
  );
}
