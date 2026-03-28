"use client";

import { format } from "date-fns";
import { Trash2, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  const percentA = maxPossible > 0 ? Math.round((totalA / maxPossible) * 100) : 0;
  const percentB = maxPossible > 0 ? Math.round((totalB / maxPossible) * 100) : 0;

  const winner = totalA > totalB ? "A" : totalB > totalA ? "B" : "tie";

  const goalName = (goalId: string) =>
    goals.find((g) => g.id === goalId)?.title ?? "Unknown Goal";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{decision.title}</CardTitle>
            <CardDescription>
              Created {format(new Date(decision.created_at), "MMM d, yyyy")}
            </CardDescription>
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            className={cn(
              "rounded-lg border p-4 text-center",
              winner === "A" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
            )}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {winner === "A" && (
                <Trophy className="h-4 w-4 text-emerald-600" />
              )}
              <p className="text-sm font-semibold">{decision.option_a}</p>
            </div>
            <p className="text-2xl font-bold">{totalA}</p>
            <Progress value={percentA} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{percentA}%</p>
          </div>

          <div
            className={cn(
              "rounded-lg border p-4 text-center",
              winner === "B" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
            )}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {winner === "B" && (
                <Trophy className="h-4 w-4 text-emerald-600" />
              )}
              <p className="text-sm font-semibold">{decision.option_b}</p>
            </div>
            <p className="text-2xl font-bold">{totalB}</p>
            <Progress value={percentB} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{percentB}%</p>
          </div>
        </div>

        {winner === "tie" && (
          <div className="text-center">
            <Badge variant="secondary">Tie</Badge>
          </div>
        )}

        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_60px_60px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>Criterion</span>
            <span className="text-center">A</span>
            <span className="text-center">B</span>
          </div>
          {decision.criteria.map((c) => {
            const scoreA = c.weight * c.score_a;
            const scoreB = c.weight * c.score_b;
            return (
              <div
                key={c.goal_id}
                className="grid grid-cols-[1fr_60px_60px] gap-2 px-3 py-2 border-t items-center"
              >
                <div>
                  <span className="text-sm">{goalName(c.goal_id)}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    (w:{c.weight})
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm text-center font-medium",
                    scoreA > scoreB && "text-emerald-600"
                  )}
                >
                  {scoreA}
                </span>
                <span
                  className={cn(
                    "text-sm text-center font-medium",
                    scoreB > scoreA && "text-emerald-600"
                  )}
                >
                  {scoreB}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
