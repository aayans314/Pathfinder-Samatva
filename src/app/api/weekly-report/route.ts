import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST() {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id);

    const goalIds = (goals || []).map((g) => g.id);

    let milestones: { id: string; title: string; status: string; goal_id: string }[] = [];
    let tasks: { id: string; title: string; completed: boolean; milestone_id: string; created_at: string }[] = [];

    if (goalIds.length > 0) {
      const { data: ms } = await supabase
        .from("milestones")
        .select("*")
        .in("goal_id", goalIds);
      milestones = ms || [];

      const milestoneIds = milestones.map((m) => m.id);
      if (milestoneIds.length > 0) {
        const { data: ts } = await supabase
          .from("tasks")
          .select("*")
          .in("milestone_id", milestoneIds);
        tasks = ts || [];
      }
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentlyCompletedTasks = tasks.filter(
      (t) => t.completed && t.created_at >= oneWeekAgo
    );
    const completedMilestones = milestones.filter((m) => m.status === "completed");
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalXP = completedTasks * 10 + completedMilestones.length * 50;

    const context = `
User has ${goals?.length || 0} goals, ${milestones.length} milestones, ${totalTasks} tasks.
Completed tasks: ${completedTasks}/${totalTasks}.
Completed milestones: ${completedMilestones.length}/${milestones.length}.
Tasks completed this week: ${recentlyCompletedTasks.length}.
Total XP earned: ${totalXP}.
Goals: ${(goals || []).map((g) => `"${g.title}" (${g.status})`).join(", ")}.
Recently completed tasks: ${recentlyCompletedTasks.map((t) => `"${t.title}"`).join(", ") || "None"}.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are Navigator, the AI coach for Pathfinder. Generate a brief, motivational weekly progress report for the user. Include:
1. A summary of what they accomplished this week
2. XP and milestone progress highlights
3. One specific suggestion for next week
4. An encouraging closing note

Keep it under 200 words. Use a warm, professional tone. Use emojis sparingly.`,
        },
        {
          role: "user",
          content: `Generate my weekly progress report based on this data:\n${context}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const report = completion.choices[0].message.content || "No report generated.";

    return NextResponse.json({
      report,
      stats: {
        tasksCompletedThisWeek: recentlyCompletedTasks.length,
        totalCompleted: completedTasks,
        totalTasks,
        milestonesCompleted: completedMilestones.length,
        totalMilestones: milestones.length,
        totalXP,
      },
    });
  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
