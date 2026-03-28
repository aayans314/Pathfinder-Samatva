"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/browser";
import { useAppStore } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import type { GoalCategory, Goal, Milestone, Task } from "@/types/database";

interface GeneratedPath {
  category: GoalCategory;
  goalTitle: string;
  milestones: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { addGoal, addMilestone, addTasks, currentUserId } = useAppStore();

  const [step, setStep] = useState<"profile" | "generating" | "results">("profile");
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [generatedPaths, setGeneratedPaths] = useState<GeneratedPath[]>([]);

  // Try to load auth user
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "");
      }
    }
    loadUser();
  }, [supabase]);

  const handleGenerate = async () => {
    if (!primaryGoal) return;
    setStep("generating");

    try {
      const res = await fetch("/api/generate-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          bio,
          target_visa: "Any",
          primary_goal: primaryGoal,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate paths");
      const data = await res.json();
      setGeneratedPaths(data.paths);
      setStep("results");
    } catch (error) {
      console.error(error);
      alert("Error generating paths. DeepSeek API key might be missing. Using fallback paths.");
      // Fallback data for hackathon mock mode
      setGeneratedPaths([
        {
          category: "career",
          goalTitle: "Land a Senior SWE Role",
          milestones: ["Master System Design", "Complete 3 side projects", "Ace interviews"],
        },
        {
          category: "academics",
          goalTitle: "Finish Master's Degree",
          milestones: ["Complete core curriculum", "Publish research paper", "Defend thesis"],
        }
      ]);
      setStep("results");
    }
  };

  const handleApplyPaths = async () => {
    setStep("generating"); // repurpose for loading state

    // Process all generated paths into the Zustand store
    for (const path of generatedPaths) {
      const goalId = `g-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      
      const newGoal: Omit<Goal, "created_at"> = {
        id: goalId,
        user_id: currentUserId,
        title: path.goalTitle,
        category: path.category as GoalCategory,
        status: "active",
        target_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      };
      
      addGoal(newGoal);

      let currentParentId: string | null = null;
      let orderIndex = 0;
      const newTasks: Omit<Task, "id" | "created_at">[] = [];

      for (const mTitle of path.milestones) {
        const milestoneId = `m-new-${Date.now()}-${orderIndex}`;
        
        const newMilestone: Omit<Milestone, "created_at"> = {
          id: milestoneId,
          goal_id: goalId,
          title: mTitle,
          description: `AI suggested milestone for ${path.goalTitle}`,
          status: orderIndex === 0 ? "in_progress" : "locked",
          order_index: orderIndex,
          parent_milestone_id: currentParentId,
        };

        addMilestone(newMilestone);

        newTasks.push({
          milestone_id: milestoneId,
          title: `Start working on: ${mTitle}`,
          completed: false,
          due_date: null,
        });

        currentParentId = milestoneId;
        orderIndex++;
      }
      
      if (newTasks.length > 0) {
        addTasks(newTasks);
      }
    }

    // Go to dashboard
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-sm border p-8">
        
        {step === "profile" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Pathfinder</h1>
              <p className="text-muted-foreground">Let's set up your personalized life dashboard. Tell us a bit about where you want to go.</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>What is your primary goal right now?</Label>
                <Input 
                  placeholder="e.g. Getting a job as a frontend engineer in New York" 
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Anything else we should know? (Optional)</Label>
                <Textarea 
                  placeholder="Background, visa constraints, specific timelines..." 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!primaryGoal}
                className="w-full h-12 text-md mt-6 gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Sparkles className="w-5 h-5" />
                Analyze & Build My Paths
              </Button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping" />
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Creating your personalized paths...</h2>
              <p className="text-muted-foreground text-sm">DeepSeek AI is analyzing your goals and building a custom skill tree.</p>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Your Paths are Ready</h1>
              <p className="text-muted-foreground">We've generated these tracks based on your profile.</p>
            </div>

            <div className="grid gap-4 mt-8">
              {generatedPaths.map((path, idx) => {
                const config = CATEGORY_CONFIG[path.category] || CATEGORY_CONFIG.personal;
                return (
                  <Card key={idx} className="overflow-hidden border-indigo-100">
                    <div className={`h-2 w-full bg-gradient-to-r ${config.gradient}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{config.emoji}</span>
                        <h3 className="font-semibold text-lg">{path.goalTitle}</h3>
                      </div>
                      <div className="pl-8">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {path.milestones.map((m, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button 
              onClick={handleApplyPaths} 
              className="w-full h-12 text-md mt-6 gap-2"
            >
              Add to My Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
