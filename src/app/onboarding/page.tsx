"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  X,
  Lightbulb,
  User,
  Target,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/browser";
import { useAppStore } from "@/lib/store";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";
import type { GoalCategory, Goal, Milestone, Task } from "@/types/database";

// ── Types ──────────────────────────────────────────────
interface GeneratedPath {
  category: GoalCategory;
  goalTitle: string;
  milestones: string[];
}

type OnboardingStep = "welcome" | "goals" | "generating" | "review";

// ── Suggested Goals (AI pre-fills) ─────────────────────
const SUGGESTED_GOALS = [
  "Get promoted to a senior role",
  "Learn a new programming language",
  "Run a half marathon",
  "Build a side project and launch it",
  "Read 20 books this year",
  "Network with 50 professionals",
  "Complete a certification course",
  "Improve work-life balance",
  "Save $10,000 this year",
  "Start a daily meditation habit",
];

// ── Step Indicator Component ───────────────────────────
function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                idx < current
                  ? "bg-emerald-500 text-white"
                  : idx === current
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {idx < current ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                idx === current ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                idx < current ? "bg-emerald-500" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Onboarding Component ──────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { clearAndSetPaths, currentUserId } = useAppStore();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");
  const [userGoals, setUserGoals] = useState<string[]>([""]);
  const [generatedPaths, setGeneratedPaths] = useState<GeneratedPath[]>([]);
  const [removedPathIndices, setRemovedPathIndices] = useState<Set<number>>(new Set());
  const [loadingMessage, setLoadingMessage] = useState("Analyzing your goals...");

  // Load auth user info
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserName(
          data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0] ||
            ""
        );
      }
    }
    loadUser();
  }, [supabase]);

  // Loading messages animation
  useEffect(() => {
    if (step !== "generating") return;
    const messages = [
      "Analyzing your goals...",
      "Consulting the AI life coach...",
      "Building personalized milestones...",
      "Structuring your skill tree...",
      "Almost there, finalizing your paths...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  // ── Handlers ──────────────────────────────────────────
  const addGoalInput = () => {
    if (userGoals.length < 8) {
      setUserGoals([...userGoals, ""]);
    }
  };

  const removeGoalInput = (idx: number) => {
    setUserGoals(userGoals.filter((_, i) => i !== idx));
  };

  const updateGoalInput = (idx: number, value: string) => {
    const updated = [...userGoals];
    updated[idx] = value;
    setUserGoals(updated);
  };

  const addSuggestedGoal = (goal: string) => {
    if (!userGoals.includes(goal)) {
      const emptyIdx = userGoals.findIndex((g) => g.trim() === "");
      if (emptyIdx !== -1) {
        updateGoalInput(emptyIdx, goal);
      } else if (userGoals.length < 8) {
        setUserGoals([...userGoals, goal]);
      }
    }
  };

  const toggleRemovePath = (idx: number) => {
    setRemovedPathIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleGenerate = async () => {
    const validGoals = userGoals.filter((g) => g.trim() !== "");
    if (validGoals.length === 0) return;
    setStep("generating");

    try {
      const res = await fetch("/api/generate-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          bio,
          goals: validGoals,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate paths");
      const data = await res.json();
      setGeneratedPaths(data.paths || []);
      setStep("review");
    } catch (error) {
      console.error(error);
      // Fallback paths for demo resilience
      setGeneratedPaths(
        validGoals.map((goal, i) => ({
          category: (["career", "academics", "fitness", "personal", "networking"] as GoalCategory[])[
            i % 5
          ],
          goalTitle: goal,
          milestones: [
            `Research and plan for: ${goal}`,
            `Take first concrete steps toward: ${goal}`,
            `Achieve measurable progress on: ${goal}`,
          ],
        }))
      );
      setStep("review");
    }
  };

  const handleApplyPaths = async () => {
    const acceptedPaths = generatedPaths.filter((_, i) => !removedPathIndices.has(i));
    if (acceptedPaths.length === 0) return;

    setLoadingMessage("Setting up your specialized dashboard...");
    setStep("generating"); // Re-use the loading step

    // 1. Ensure we have the real authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in again. Missing active session.");
      router.push("/login");
      return;
    }
    const realUserId = user.id;

    // 2. Upsert Profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: realUserId,
      name: userName || "Pathfinder",
      bio: bio || null,
      target_visa: "Any", // Defaulting for hackathon demo
      opt_in_matching: true,
    });

    if (profileError) {
      console.error("Error upserting profile:", profileError);
      alert("Database error: Could not create your profile.");
      return;
    }

    // 3. Prepare data for Supabase and Zustand
    const goalsToInsert: any[] = [];
    const milestonesToInsert: any[] = [];
    const tasksToInsert: any[] = [];

    const storeGoals: (Omit<Goal, "created_at"> & { id: string })[] = [];
    const storeMilestones: (Omit<Milestone, "created_at"> & { id: string })[] = [];
    const storeTasks: Omit<Task, "id" | "created_at">[] = [];

    const oneYearFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();

    for (const path of acceptedPaths) {
      const goalId = crypto.randomUUID();
      
      const dbGoal = {
        id: goalId,
        user_id: realUserId,
        title: path.goalTitle,
        category: path.category,
        status: "active",
        target_date: oneYearFromNow,
      };
      
      goalsToInsert.push(dbGoal);
      storeGoals.push({
        ...dbGoal,
        category: path.category as GoalCategory,
        status: "active",
      });

      let prevMilestoneId: string | null = null;
      path.milestones.forEach((mTitle, mIdx) => {
        const milestoneId = crypto.randomUUID();
        
        const dbMilestone = {
          id: milestoneId,
          goal_id: goalId,
          title: mTitle,
          description: `AI-generated milestone for "${path.goalTitle}"`,
          status: mIdx === 0 ? "in_progress" : "locked",
          order_index: mIdx,
          parent_milestone_id: prevMilestoneId,
        };
        
        milestonesToInsert.push(dbMilestone);
        storeMilestones.push(dbMilestone as any);

        const dbTask = {
          id: crypto.randomUUID(),
          milestone_id: milestoneId,
          title: `Start: ${mTitle}`,
          completed: false,
        };
        
        tasksToInsert.push(dbTask);
        storeTasks.push({
          milestone_id: milestoneId,
          title: `Start: ${mTitle}`,
          completed: false,
          due_date: null,
        });

        prevMilestoneId = milestoneId;
      });
    }

    // 4. Batch push to Supabase databases
    try {
      if (goalsToInsert.length > 0) {
        const { error } = await supabase.from("goals").insert(goalsToInsert);
        if (error) console.error("Error inserting goals:", error);
      }
      if (milestonesToInsert.length > 0) {
        const { error } = await supabase.from("milestones").insert(milestonesToInsert);
        if (error) console.error("Error inserting milestones:", error);
      }
      if (tasksToInsert.length > 0) {
        const { error } = await supabase.from("tasks").insert(tasksToInsert);
        if (error) console.error("Error inserting tasks:", error);
      }
    } catch (err) {
      console.error("Database insert error:", err);
    }

    // 5. Update Zustand store for immediate UI feedback
    clearAndSetPaths(storeGoals, storeMilestones, storeTasks);
    
    // 6. Go to Dashboard
    router.push("/");
  };

  // ── Step index for indicator ──────────────────────────
  const stepIndex =
    step === "welcome" ? 0 : step === "goals" ? 1 : step === "generating" ? 2 : 3;
  const stepLabels = ["About You", "Your Goals", "AI Analysis", "Review"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-2xl">
        <StepIndicator current={stepIndex} steps={stepLabels} />

        <div className="bg-card rounded-2xl shadow-lg border p-8">
          {/* ── STEP 1: Welcome / About You ────────────────── */}
          {step === "welcome" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 mb-2">
                  <Compass className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome to Pathfinder{userName ? `, ${userName.split(" ")[0]}` : ""}!
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Let&apos;s build your personalized life dashboard. Tell us a little about yourself
                  so our AI can craft the best paths for you.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name
                  </Label>
                  <Input
                    placeholder="e.g. Aayan Shah"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>About You (optional)</Label>
                  <Textarea
                    placeholder="Share a bit about your background, situation, and what drives you..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="resize-none min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={() => setStep("goals")}
                  disabled={!userName.trim()}
                  className="w-full h-12 text-md mt-4 gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Collect Goals ──────────────────────── */}
          {step === "goals" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Target className="w-6 h-6 text-indigo-500" />
                  What do you want to achieve?
                </h1>
                <p className="text-muted-foreground">
                  Add your goals below (up to 8). Our AI will organize them into structured life
                  paths with milestones.
                </p>
              </div>

              {/* Goal Inputs */}
              <div className="space-y-3">
                {userGoals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <Input
                      placeholder={
                        idx === 0
                          ? "e.g. Land a software engineering job"
                          : "Add another goal..."
                      }
                      value={goal}
                      onChange={(e) => updateGoalInput(idx, e.target.value)}
                      className="h-11"
                    />
                    {userGoals.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGoalInput(idx)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {userGoals.length < 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addGoalInput}
                    className="gap-1.5 text-muted-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Goal
                  </Button>
                )}
              </div>

              {/* Suggested Goals */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Need inspiration? Click to add:
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_GOALS.filter((sg) => !userGoals.includes(sg)).slice(0, 6).map((sg) => (
                    <Badge
                      key={sg}
                      variant="outline"
                      className="cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors py-1.5 px-3"
                      onClick={() => addSuggestedGoal(sg)}
                    >
                      + {sg}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Nav buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("welcome")}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={userGoals.filter((g) => g.trim()).length === 0}
                  className="flex-1 h-12 text-md gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate My Paths with AI
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Generating ─────────────────────────── */}
          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in">
              <div className="relative flex items-center justify-center w-24 h-24">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping" />
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">{loadingMessage}</h2>
                <p className="text-muted-foreground text-sm">
                  This usually takes 10-15 seconds. Hang tight!
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review Generated Paths ─────────────── */}
          {step === "review" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 mb-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Your Paths are Ready!
                </h1>
                <p className="text-muted-foreground">
                  Review and customize your AI-generated life paths. Remove any you don&apos;t want.
                </p>
              </div>

              <div className="grid gap-4 mt-6">
                {generatedPaths.map((path, idx) => {
                  const config = CATEGORY_CONFIG[path.category] || CATEGORY_CONFIG.personal;
                  const isRemoved = removedPathIndices.has(idx);

                  return (
                    <Card
                      key={idx}
                      className={`overflow-hidden transition-all duration-300 ${
                        isRemoved
                          ? "opacity-40 scale-[0.98] border-dashed"
                          : "border-indigo-100"
                      }`}
                    >
                      <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{config.emoji}</span>
                            <div>
                              <h3 className="font-semibold text-lg leading-tight">
                                {path.goalTitle}
                              </h3>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {path.category}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRemovePath(idx)}
                            className={
                              isRemoved
                                ? "text-emerald-600 hover:text-emerald-700"
                                : "text-muted-foreground hover:text-destructive"
                            }
                          >
                            {isRemoved ? (
                              <>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Restore
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5 mr-1" /> Remove
                              </>
                            )}
                          </Button>
                        </div>
                        {!isRemoved && (
                          <div className="pl-8 mt-2">
                            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                              Milestones
                            </p>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              {path.milestones.map((m, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <div className="w-5 h-5 rounded-full border-2 border-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-indigo-500">
                                      {i + 1}
                                    </span>
                                  </div>
                                  {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("goals");
                    setRemovedPathIndices(new Set());
                  }}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Re-do Goals
                </Button>
                <Button
                  onClick={handleApplyPaths}
                  disabled={
                    generatedPaths.length === 0 ||
                    removedPathIndices.size === generatedPaths.length
                  }
                  className="flex-1 h-12 text-md gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Launch My Dashboard ({generatedPaths.length - removedPathIndices.size} paths)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
