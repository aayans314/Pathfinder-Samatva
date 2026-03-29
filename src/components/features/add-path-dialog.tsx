"use client";

import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/browser";
import type { GoalCategory, Goal, Milestone, Task } from "@/types/database";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import { normalizeGeneratedPaths } from "@/lib/ai/generated-path";

interface AddPathDialogProps {
  onSuccess?: (category: GoalCategory) => void;
}

export function AddPathDialog({ onSuccess }: AddPathDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory | "">("");
  const [steps, setSteps] = useState("");

  const { addGoal, addMilestone, addTasks, currentUserId } = useAppStore();

  const handleGenerate = async () => {
    if (!title || !category || !steps) return;

    setIsGenerating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const realUserId = user?.id || currentUserId;

      const res = await fetch("/api/generate-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "User",
          bio: `Category: ${category}. User notes: ${steps}`,
          goals: [`${title}. Context: ${steps}`],
        }),
      });

      if (!res.ok) throw new Error("Failed to generate path");

      const data = await res.json();
      const paths = normalizeGeneratedPaths(data);
      const generatedPath = paths[0];
      if (!generatedPath) throw new Error("No path generated");

      const goalId = crypto.randomUUID();
      const years =
        typeof generatedPath.goalHorizonYears === "number" &&
        generatedPath.goalHorizonYears > 0
          ? generatedPath.goalHorizonYears
          : 5;
      const targetDate = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 365 * years
      ).toISOString();

      const newGoal: Omit<Goal, "created_at"> = {
        id: goalId,
        user_id: realUserId,
        title: generatedPath.goalTitle || title,
        category: category as GoalCategory,
        status: "active",
        target_date: targetDate,
      };

      const milestonesToCreate: (Omit<Milestone, "created_at"> & { id: string })[] = [];
      const tasksToCreate: Omit<Task, "id" | "created_at">[] = [];
      let currentParentId: string | null = null;

      generatedPath.milestones.forEach((ms, orderIndex) => {
        const milestoneId = crypto.randomUUID();
        const descParts = [
          ms.personalizedNote ? `For you: ${ms.personalizedNote}` : null,
          ms.horizonLabel ? `Horizon: ${ms.horizonLabel}` : null,
          ms.description || null,
          generatedPath.personalizedPathIntro
            ? `Plan: ${generatedPath.personalizedPathIntro}`
            : null,
        ].filter(Boolean);
        const description =
          descParts.length > 0
            ? descParts.join(" · ")
            : `AI phase for ${generatedPath.goalTitle}`;

        milestonesToCreate.push({
          id: milestoneId,
          goal_id: goalId,
          title: ms.title,
          description,
          status: orderIndex === 0 ? "in_progress" : "locked",
          order_index: orderIndex,
          parent_milestone_id: currentParentId,
        });

        ms.substeps.forEach((sub, subIdx) => {
          tasksToCreate.push({
            milestone_id: milestoneId,
            title: sub,
            completed: false,
            due_date: null,
            sort_order: subIdx,
          });
        });

        currentParentId = milestoneId;
      });

      // Persist via Zustand only (addGoal / addMilestone / addTasks write to Supabase).
      // Do not duplicate-insert here — that caused 23505 duplicate key errors.
      addGoal(newGoal);
      for (const m of milestonesToCreate) {
        addMilestone(m);
      }
      addTasks(tasksToCreate);

    } catch (error) {
      console.error(error);
      alert("Failed to generate with AI. Please check your API key or network.");
    } finally {
      setIsGenerating(false);
      setOpen(false);
      setTitle("");
      setCategory("");
      setSteps("");

      if (onSuccess) {
        onSuccess(category as GoalCategory);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-2">
        <Plus className="h-4 w-4" />
        Add Path
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Path</DialogTitle>
          <DialogDescription>
            Tell us where you want to go, and Pathfinder will fill in the gaps to create your skill tree.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="goal">Ultimate Goal</Label>
            <Input
              id="goal"
              placeholder="e.g. Become a Senior Frontend Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Life Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as GoalCategory)}
              disabled={isGenerating}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{config.emoji}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="steps">What do you already know you need to do?</Label>
            <Textarea
              id="steps"
              placeholder="e.g.&#10;Learn React&#10;Master System Design&#10;Build 3 full-stack projects"
              className="resize-none h-24"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-[10px] text-muted-foreground">List a few key steps (one per line). AI will fill in the connecting milestones and tasks.</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleGenerate}
            disabled={!title || !category || !steps || isGenerating}
            className="w-full gap-2 transition-all bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Path & Filling Gaps...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Path
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
