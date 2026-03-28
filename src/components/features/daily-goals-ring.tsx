"use client";

import { useState } from "react";
import { Plus, X, CheckCircle2, Circle } from "lucide-react";
import { useDailyGoals } from "@/hooks/use-goals";
import { useAppStore } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import type { GoalCategory } from "@/types/database";

export function DailyGoalsRing() {
  const dailyGoals = useDailyGoals();
  const toggleDailyGoal = useAppStore((s) => s.toggleDailyGoal);
  const addDailyGoal = useAppStore((s) => s.addDailyGoal);
  const deleteDailyGoal = useAppStore((s) => s.deleteDailyGoal);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<GoalCategory>("academics");

  const total = dailyGoals.length;
  const completed = dailyGoals.filter((dg) => dg.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Build arc segments for donut
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Build segments
  const segments: { offset: number; length: number; color: string }[] = [];
  if (total > 0) {
    const segmentSize = circumference / total;
    const gap = 3;
    let offset = 0;
    for (const dg of dailyGoals) {
      const config = CATEGORY_CONFIG[dg.category];
      segments.push({
        offset,
        length: segmentSize - gap,
        color: dg.completed ? config.ring : "#e5e7eb",
      });
      offset += segmentSize;
    }
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    addDailyGoal({
      user_id: currentUserId,
      title: newTitle.trim(),
      completed: false,
      date: today,
      category: newCategory,
    });
    setNewTitle("");
    setShowForm(false);
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold tracking-tight">
          Today&apos;s Goals
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Donut chart */}
      <div className="flex justify-center mb-5">
        <div className="relative">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />
            {/* Segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                strokeDashoffset={-seg.offset}
                style={{ transition: "stroke 0.4s ease" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{percent}%</span>
            <span className="text-xs text-muted-foreground">
              {completed}/{total} done
            </span>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
          <input
            type="text"
            placeholder="What do you want to accomplish today?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/60"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
              className="text-xs bg-transparent border border-border/50 rounded px-2 py-1 outline-none"
            >
              {Object.entries(CATEGORY_CONFIG)
                .filter(([k]) => k !== "daily")
                .map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.emoji} {cfg.label}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAdd}
              className="ml-auto text-xs font-medium text-primary hover:underline"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Goal list */}
      <div className="space-y-1.5">
        {dailyGoals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No daily goals yet. Add one above!
          </p>
        ) : (
          dailyGoals.map((dg) => {
            const config = CATEGORY_CONFIG[dg.category];
            return (
              <div
                key={dg.id}
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted/40 transition-colors"
              >
                <button
                  onClick={() => toggleDailyGoal(dg.id)}
                  className="shrink-0"
                >
                  {dg.completed ? (
                    <CheckCircle2
                      className="h-4.5 w-4.5"
                      style={{ color: config.ring }}
                    />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-muted-foreground/50" />
                  )}
                </button>
                <span
                  className={`text-sm flex-1 ${dg.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {dg.title}
                </span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {config.emoji}
                </span>
                <button
                  onClick={() => deleteDailyGoal(dg.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
