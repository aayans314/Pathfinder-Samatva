"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore, type DecisionCriterion } from "@/lib/store";
import { useGoals, useCurrentUser } from "@/hooks/use-goals";

interface DecisionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DecisionForm({ open, onOpenChange }: DecisionFormProps) {
  const goals = useGoals();
  const user = useCurrentUser();
  const addDecision = useAppStore((s) => s.addDecision);

  const [title, setTitle] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [criteria, setCriteria] = useState<
    Record<string, { weight: number; scoreA: number; scoreB: number }>
  >(() => {
    const init: Record<string, { weight: number; scoreA: number; scoreB: number }> = {};
    for (const g of goals) {
      init[g.id] = { weight: 5, scoreA: 5, scoreB: 5 };
    }
    return init;
  });

  function updateCriterion(
    goalId: string,
    field: "weight" | "scoreA" | "scoreB",
    value: number
  ) {
    setCriteria((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !optionA.trim() || !optionB.trim()) return;

    const criteriaList: DecisionCriterion[] = Object.entries(criteria).map(
      ([goalId, c]) => ({
        goal_id: goalId,
        weight: c.weight,
        score_a: c.scoreA,
        score_b: c.scoreB,
      })
    );

    addDecision({
      user_id: user.id,
      title: title.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      criteria: criteriaList,
    });

    setTitle("");
    setOptionA("");
    setOptionB("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Decision Analysis</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="decision-title">Decision</Label>
            <Input
              id="decision-title"
              placeholder="e.g., Accept Company A vs Company B offer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="option-a">Option A</Label>
              <Input
                id="option-a"
                placeholder="e.g., Company A"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option-b">Option B</Label>
              <Input
                id="option-b"
                placeholder="e.g., Company B"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Score each option against your goals (1-10)</Label>
            <div className="rounded-lg border">
              <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Goal</span>
                <span className="text-center">Weight</span>
                <span className="text-center">Option A</span>
                <span className="text-center">Option B</span>
              </div>
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-2 border-t items-center"
                >
                  <span className="text-sm truncate">{goal.title}</span>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={criteria[goal.id]?.weight ?? 5}
                    onChange={(e) =>
                      updateCriterion(goal.id, "weight", Number(e.target.value))
                    }
                    className="h-8 text-center text-sm"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={criteria[goal.id]?.scoreA ?? 5}
                    onChange={(e) =>
                      updateCriterion(goal.id, "scoreA", Number(e.target.value))
                    }
                    className="h-8 text-center text-sm"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={criteria[goal.id]?.scoreB ?? 5}
                    onChange={(e) =>
                      updateCriterion(goal.id, "scoreB", Number(e.target.value))
                    }
                    className="h-8 text-center text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !optionA.trim() || !optionB.trim()}
            >
              Analyze
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
