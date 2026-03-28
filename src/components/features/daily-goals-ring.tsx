"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { useDailyGoals } from "@/hooks/use-goals";
import { useAppStore } from "@/lib/store";
import type { GoalCategory } from "@/types/database";

export function DailyGoalsRing() {
  const dailyGoals = useDailyGoals();
  const toggleDailyGoal = useAppStore((s) => s.toggleDailyGoal);
  const addDailyGoal = useAppStore((s) => s.addDailyGoal);
  const deleteDailyGoal = useAppStore((s) => s.deleteDailyGoal);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const total = dailyGoals.length;
  const completed = dailyGoals.filter((dg) => dg.completed).length;

  function handleAdd() {
    if (!newTitle.trim()) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    addDailyGoal({
      user_id: currentUserId,
      title: newTitle.trim(),
      completed: false,
      date: today,
      category: "personal" as GoalCategory,
    });
    setNewTitle("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-medium">Daily goals</h3>
          {total > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {completed}/{total}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showForm && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="What will you accomplish today?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 border-none outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>
      )}

      <div className="space-y-0.5">
        {dailyGoals.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No goals set for today
          </p>
        ) : (
          dailyGoals.map((dg) => (
            <div
              key={dg.id}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/40 transition-colors"
            >
              <button
                onClick={() => toggleDailyGoal(dg.id)}
                className={`shrink-0 h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                  dg.completed
                    ? "bg-foreground border-foreground"
                    : "border-border hover:border-foreground/50"
                }`}
              >
                {dg.completed && <Check className="h-3 w-3 text-background" />}
              </button>
              <span
                className={`text-sm flex-1 ${dg.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {dg.title}
              </span>
              <button
                onClick={() => deleteDailyGoal(dg.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
