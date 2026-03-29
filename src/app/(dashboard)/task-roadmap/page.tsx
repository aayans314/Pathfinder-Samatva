"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles, Target, ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { LIKE_MINDED_GROUPS_DUMMY } from "@/lib/like-minded-groups-dummy";
import type { GoalCategory } from "@/types/database";

function groupTagToGoalCategory(tag: string): GoalCategory {
  const t = tag.toLowerCase();
  if (t.includes("network")) return "networking";
  if (t.includes("research")) return "research";
  if (t.includes("intern")) return "internships";
  if (t.includes("fitness")) return "fitness";
  if (t.includes("career") || t.includes("goal circle")) return "career";
  return "personal";
}

interface RoadmapData {
  summary: string;
  urgency: string;
  focusStrategy: string;
  timeline: string;
  firstAction: string;
  executionNote: string;
  phases: { title: string; items: string[] }[];
}

export default function TaskRoadmapPage() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const milestoneId = searchParams.get("milestoneId");
  const goalId = searchParams.get("goalId");
  const groupId = searchParams.get("groupId");

  const currentUserId = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  const goals = useAppStore((s) => s.goals);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);

  const me = users.find((u) => u.id === currentUserId);
  const task = tasks.find((t) => t.id === taskId);
  const milestone = milestones.find((m) => m.id === (milestoneId ?? task?.milestone_id));
  const goal = goals.find((g) => g.id === (goalId ?? milestone?.goal_id));
  const group = useMemo(
    () => LIKE_MINDED_GROUPS_DUMMY.find((g) => g.id === groupId) ?? null,
    [groupId]
  );
  const myTopGoals = useMemo(
    () => goals.filter((g) => g.user_id === currentUserId).slice(0, 3),
    [goals, currentUserId]
  );

  const fromGroup = Boolean(group);
  const backHref = fromGroup ? "/groups" : "/my-path";
  const backLabel = fromGroup ? "Back to Like-Minded Groups" : "Back to My Path";

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"llm" | "fallback" | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!task && !group) return;
    const controller = new AbortController();

    async function loadRoadmap() {
      setLoading(true);
      setError(null);
      setRoadmap(null);
      setSource(null);
      try {
        const body =
          task
            ? {
                taskTitle: task.title,
                milestoneTitle: milestone?.title ?? null,
                milestoneDescription: milestone?.description ?? null,
                goalTitle: goal?.title ?? null,
                goalCategory: goal?.category ?? null,
                dueDate: task.due_date ?? null,
                userName: me?.name ?? null,
                topGoals: myTopGoals.map((g) => g.title),
              }
            : {
                taskTitle: group!.topic,
                milestoneTitle: "Like-minded group",
                milestoneDescription: group!.description,
                goalTitle: group!.topic,
                goalCategory: groupTagToGoalCategory(group!.tag),
                dueDate: null as string | null,
                userName: me?.name ?? null,
                topGoals: myTopGoals.map((g) => g.title),
              };

        const res = await fetch("/api/task-roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to generate roadmap");
        }

        const data = (await res.json()) as { roadmap?: RoadmapData; source?: "llm" | "fallback" };
        if (!data.roadmap) throw new Error("No roadmap returned");
        setRoadmap(data.roadmap);
        setSource(data.source ?? null);
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Could not generate roadmap");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadRoadmap();
    return () => controller.abort();
  }, [
    task,
    group,
    milestone?.title,
    milestone?.description,
    goal?.title,
    goal?.category,
    me?.name,
    myTopGoals,
    reloadKey,
  ]);

  if (!task && !group) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Button
          nativeButton={false}
          variant="ghost"
          render={<Link href="/my-path" />}
          className="gap-2 h-10 px-2 text-base font-medium -ml-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to My Path
        </Button>
        <div className="glass-card p-6 md:p-7">
          <p className="text-base text-muted-foreground leading-relaxed">
            Could not find this task or group. Open{" "}
            <span className="font-semibold text-foreground">Do it</span> from a milestone task or a Like-Minded
            Groups card.
          </p>
        </div>
      </div>
    );
  }

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  const focusTitle = task?.title ?? group!.topic;
  const focusCategory = task && goal ? goal.category : group ? groupTagToGoalCategory(group.tag) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Button
        nativeButton={false}
        variant="ghost"
        render={<Link href={backHref} />}
        className="gap-2 h-10 px-2 text-base font-medium -ml-2"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        {backLabel}
      </Button>

      <div className="glass-card p-6 md:p-7 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-6 w-6 text-primary shrink-0" />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                AI Suggested Roadmap
              </h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {fromGroup
                ? `Personalized for ${me?.name ?? "you"} based on this group and your goals.`
                : `Personalized for ${me?.name ?? "you"} based on your current path and selected task.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {source === "fallback" && (
              <Badge variant="secondary" className="text-sm font-medium px-2.5 py-0.5">
                Fallback mode
              </Badge>
            )}
            <Badge variant="outline" className="text-sm font-medium px-2.5 py-0.5">
              {roadmap?.urgency ?? "Generating..."}
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 md:p-5 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {fromGroup ? "Group focus" : "Selected task"}
          </p>
          <p className="text-xl font-semibold tracking-tight text-foreground leading-snug">
            {focusTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            {fromGroup && group && (
              <>
                <Badge variant="secondary" className="text-sm font-medium">
                  {group.tag}
                </Badge>
                <Badge variant="outline" className="text-sm font-medium capitalize">
                  {focusCategory}
                </Badge>
              </>
            )}
            {!fromGroup && goal && (
              <Badge variant="secondary" className="text-sm font-medium capitalize">
                {goal.category}
              </Badge>
            )}
            {!fromGroup && milestone && (
              <Badge variant="secondary" className="text-sm font-medium">
                {milestone.title}
              </Badge>
            )}
            {task?.due_date && (
              <Badge variant="outline" className="text-sm font-medium">
                Due {format(new Date(task.due_date), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <p className="text-sm font-medium text-muted-foreground mb-2">Focus strategy</p>
            <p className="text-base text-foreground leading-relaxed">
              {roadmap?.focusStrategy ?? (loading ? "Generating strategy…" : "—")}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <p className="text-sm font-medium text-muted-foreground mb-2">Timeline</p>
            <p className="text-base text-foreground leading-relaxed">
              {roadmap?.timeline ?? (loading ? "Generating timeline…" : "—")}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <p className="text-sm font-medium text-muted-foreground mb-2">Alignment</p>
            <p className="text-base text-foreground leading-relaxed">
              {myTopGoals.length > 0
                ? myTopGoals.map((g) => g.title).join(" · ")
                : "Add goals to improve recommendation quality."}
            </p>
          </div>
        </div>

        {roadmap?.summary && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 md:p-5">
            <p className="text-base leading-relaxed text-foreground">{roadmap.summary}</p>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 shadow-sm p-5 md:p-6 space-y-4">
          <p className="text-base text-destructive leading-relaxed">{error}</p>
          <Button variant="outline" size="default" className="gap-2 text-base font-medium" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry generation
          </Button>
        </div>
      ) : loading && !roadmap ? (
        <div className="glass-card p-6 md:p-7 flex items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
          <p className="text-base text-muted-foreground leading-relaxed">
            Generating your personalized roadmap…
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(roadmap?.phases ?? []).map((phase) => (
            <div key={phase.title} className="glass-card p-5 md:p-6">
              <h2 className="text-xl font-semibold tracking-tight">{phase.title}</h2>
              <ul className="mt-4 space-y-3">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card border-amber-200/60 dark:border-amber-500/25 bg-amber-50/80 dark:bg-amber-500/10 p-5 md:p-6">
        <div className="flex items-center gap-2.5 font-semibold text-base mb-2">
          <ShieldAlert className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0" />
          Execution note
        </div>
        <p className="text-base text-foreground/90 leading-relaxed">
          {roadmap?.executionNote ??
            "Treat this as a smart first draft. Adjust pacing based on your workload and constraints."}
        </p>
      </div>

      <div className="glass-card p-5 md:p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <Target className="h-5 w-5 text-primary shrink-0" />
          <p className="text-base font-semibold">First action in the next 15 minutes</p>
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          {roadmap?.firstAction ??
            "Open a quick note and define one measurable output for this task before you start building."}
        </p>
      </div>
    </div>
  );
}
