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
          bio: "",
          primary_goal: `${title} in the ${category} category. User says they need to do: ${steps}. Break this into 1 ultimate goal and 3-4 milestones.`,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate path");

      const data = await res.json();
      const generatedPath = data.paths[0];

      const goalId = crypto.randomUUID();
      const targetDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();

      const newGoal: Omit<Goal, "created_at"> = {
        id: goalId,
        user_id: realUserId,
        title: generatedPath.goalTitle || title,
        category: category as GoalCategory,
        status: "active",
        target_date: targetDate,
      };

      const milestones = generatedPath.milestones || [
        `Research & Preparation`,
        ...steps.split("\n").filter(Boolean),
        `Achieve ${title}`
      ];

      const milestonesToCreate: (Omit<Milestone, "created_at"> & { id: string })[] = [];
      const tasksToCreate: Omit<Task, "id" | "created_at">[] = [];
      let currentParentId: string | null = null;

      for (let orderIndex = 0; orderIndex < milestones.length; orderIndex++) {
        const mTitle = milestones[orderIndex];
        const milestoneId = crypto.randomUUID();

        milestonesToCreate.push({
          id: milestoneId,
          goal_id: goalId,
          title: mTitle,
          description: `AI step for ${title}`,
          status: orderIndex === 0 ? "in_progress" : "locked",
          order_index: orderIndex,
          parent_milestone_id: currentParentId,
        });

        tasksToCreate.push({
          milestone_id: milestoneId,
          title: `Kickoff: ${mTitle}`,
          completed: false,
          due_date: null,
        });
        tasksToCreate.push({
          milestone_id: milestoneId,
          title: `Execute: ${mTitle}`,
          completed: false,
          due_date: null,
        });

        currentParentId = milestoneId;
      }

      // Persist to Supabase first if authenticated
      if (user) {
        const { error: goalErr } = await supabase.from("goals").insert({
          id: goalId,
          user_id: realUserId,
          title: newGoal.title,
          category: newGoal.category,
          target_date: newGoal.target_date,
          status: newGoal.status,
        });
        if (goalErr) console.error("Error inserting goal:", goalErr);

        const dbMilestones = milestonesToCreate.map((m) => ({
          id: m.id,
          goal_id: m.goal_id,
          title: m.title,
          description: m.description,
          status: m.status,
          order_index: m.order_index,
          parent_milestone_id: m.parent_milestone_id,
        }));
        const { error: msErr } = await supabase.from("milestones").insert(dbMilestones);
        if (msErr) console.error("Error inserting milestones:", msErr);

        const dbTasks = tasksToCreate.map((t) => ({
          id: crypto.randomUUID(),
          milestone_id: t.milestone_id,
          title: t.title,
          completed: t.completed,
        }));
        const { error: tErr } = await supabase.from("tasks").insert(dbTasks);
        if (tErr) console.error("Error inserting tasks:", tErr);
      }

      // Update Zustand store for immediate UI (uses UUID ids so store won't re-persist)
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
