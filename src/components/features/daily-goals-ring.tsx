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
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full grid place-items-center text-base font-semibold tabular-nums text-foreground"
            style={{
              background: `conic-gradient(from 180deg, rgb(34 197 94) ${percent}%, rgb(71 85 105 / 0.35) ${percent}% 100%)`,
            }}
          >
            <div className="h-12 w-12 rounded-full bg-background grid place-items-center shadow-inner">
              {percent}%
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Focus ring</h3>
            {total > 0 && (
              <span className="text-base text-muted-foreground tabular-nums">
                {completed}/{total} today
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label={showForm ? "Close add form" : "Add daily focus"}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="What will you accomplish today?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full text-base bg-muted/50 rounded-xl px-4 py-3 border-none outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>
      )}

      <div className="space-y-1">
        {dailyGoals.length === 0 && !showForm ? (
          <p className="text-base text-muted-foreground py-6 text-center leading-relaxed">
            Add one meaningful action to start momentum.
          </p>
        ) : (
          dailyGoals.map((dg) => (
            <div
              key={dg.id}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 -mx-2 hover:bg-muted/40 transition-colors"
            >
              <button
                onClick={() => toggleDailyGoal(dg.id)}
                className={`shrink-0 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  dg.completed
                    ? "bg-foreground border-foreground"
                    : "border-border hover:border-foreground/50"
                }`}
              >
                {dg.completed && <Check className="h-3.5 w-3.5 text-background" />}
              </button>
              <span
                className={`text-base flex-1 leading-snug ${dg.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {dg.title}
              </span>
              <button
                onClick={() => deleteDailyGoal(dg.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
