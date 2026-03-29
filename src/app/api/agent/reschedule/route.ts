import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Goal, GoalCategory, Milestone, Task } from "@/types/database";
import { getDeepSeekClient } from "@/lib/openai-deepseek";

export const maxDuration = 60;

const REQUEST_TIMEOUT_MS = 55_000;

/** Goal categories that must never be paused (academic, career, visa-critical path). */
const PROTECTED_PAUSE_CATEGORIES: GoalCategory[] = [
  "academics",
  "career",
  "internships",
  "research",
];

const REALLOCATE_TOOL = {
  type: "function" as const,
  function: {
    name: "reallocate_timeline",
    description:
      "Submit milestone IDs to pause and a complete strict ordering of all relevant task IDs for the user after capacity change.",
    parameters: {
      type: "object",
      properties: {
        milestonesToPause: {
          type: "array",
          items: { type: "string" },
          description: "UUIDs of milestones to set to paused status.",
        },
        reprioritizedTaskIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Every task UUID belonging to the user exactly once, in priority order (first = do soonest).",
        },
      },
      required: ["milestonesToPause", "reprioritizedTaskIds"],
    },
  },
};

function filterProtectedPauses(
  milestoneIds: string[],
  milestones: Milestone[],
  goals: Goal[]
): string[] {
  const goalById = new Map(goals.map((g) => [g.id, g]));
  return milestoneIds.filter((id) => {
    const m = milestones.find((x) => x.id === id);
    if (!m || m.status === "completed") return false;
    const g = goalById.get(m.goal_id);
    if (!g) return false;
    if (PROTECTED_PAUSE_CATEGORIES.includes(g.category)) return false;
    return true;
  });
}

export interface RescheduleResponseBody {
  milestonesToPause: string[];
  reprioritizedTaskIds: string[];
}

export async function POST(req: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
        { status: 500 }
      );
    }

    let capacityPercent = 100;
    try {
      const body = await req.json();
      if (typeof body?.capacityPercent === "number") {
        capacityPercent = Math.min(100, Math.max(0, body.capacityPercent));
      }
    } catch {
      /* use default */
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: goals, error: goalsErr } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id);

    if (goalsErr) {
      console.error(goalsErr);
      return NextResponse.json(
        { error: "Failed to load goals" },
        { status: 500 }
      );
    }

    const goalList = (goals ?? []) as Goal[];
    if (goalList.length === 0) {
      return NextResponse.json({
        milestonesToPause: [] as string[],
        reprioritizedTaskIds: [] as string[],
      } satisfies RescheduleResponseBody);
    }

    const goalIds = goalList.map((g) => g.id);

    const { data: milestones, error: msErr } = await supabase
      .from("milestones")
      .select("*")
      .in("goal_id", goalIds);

    if (msErr) {
      console.error(msErr);
      return NextResponse.json(
        { error: "Failed to load milestones" },
        { status: 500 }
      );
    }

    const milestoneList = (milestones ?? []) as Milestone[];
    let tasks: Task[] = [];

    if (milestoneList.length > 0) {
      const milestoneIds = milestoneList.map((m) => m.id);
      const { data: taskRows, error: tErr } = await supabase
        .from("tasks")
        .select("*")
        .in("milestone_id", milestoneIds);

      if (tErr) {
        console.error(tErr);
        return NextResponse.json(
          { error: "Failed to load tasks" },
          { status: 500 }
        );
      }
      tasks = (taskRows ?? []) as Task[];
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_visa, name")
      .eq("id", user.id)
      .single();

    const contextPayload = {
      capacityPercent,
      profile: {
        name: profile?.name ?? null,
        target_visa: profile?.target_visa ?? null,
      },
      goals: goalList.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        status: g.status,
      })),
      milestones: milestoneList.map((m) => ({
        id: m.id,
        goal_id: m.goal_id,
        title: m.title,
        status: m.status,
        parent_milestone_id: m.parent_milestone_id,
        order_index: m.order_index,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        milestone_id: t.milestone_id,
        title: t.title,
        completed: t.completed,
        due_date: t.due_date,
        sort_order: t.sort_order ?? 0,
      })),
    };

    const systemPrompt = `You are Pathfinder's autonomous scheduling agent. The user has indicated their available capacity as ${capacityPercent}% (0 = no bandwidth, 100 = full capacity).

STRICT RULES (never violate):
1. Protect Academic, Career, and Visa-related goals at all costs. Categories "academics", "career", "internships", and "research" define critical path work — do NOT pause milestones under those goals unless capacity is effectively zero AND the milestone is purely optional within the payload (if in doubt, do not pause them).
2. Prefer pausing or delaying milestones tied to Networking, Personal, and Fitness when capacity drops.
3. Use the user's profile target visa (if any) to treat visa-sensitive milestones as high priority — align with career and internships.
4. You MUST call the tool \`reallocate_timeline\` exactly once with your final decision.
5. In reprioritizedTaskIds, include EVERY task id from the payload exactly once, ordered from highest priority (do first) to lowest. Incomplete tasks should generally rank above completed tasks unless capacity logic dictates otherwise.
6. milestonesToPause must only contain milestone ids that exist in the payload; never invent UUIDs. Do not pause completed milestones.
7. When capacity is high (e.g. ≥70), return empty milestonesToPause unless clearly justified; when capacity is very low (e.g. ≤30), pause aggressively among non-protected goals.

Respond only by invoking the tool with valid JSON arguments.`;

    const userContent = `Current path data (JSON):\n${JSON.stringify(contextPayload)}`;

    const openai = getDeepSeekClient();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let completion;
    try {
      completion = await openai.chat.completions.create(
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          tools: [REALLOCATE_TOOL],
          tool_choice: {
            type: "function",
            function: { name: "reallocate_timeline" },
          },
          temperature: 0.2,
        },
        { signal: controller.signal }
      );
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const message =
        err instanceof Error ? err.message : "DeepSeek request failed";
      const aborted =
        err instanceof Error && err.name === "AbortError";
      console.error("DeepSeek reschedule error:", err);
      return NextResponse.json(
        {
          error: aborted
            ? "The scheduling service timed out. Try again in a moment."
            : message,
        },
        { status: aborted ? 504 : 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const msg = completion.choices[0]?.message;
    const call = msg?.tool_calls?.[0];

    if (!call || call.type !== "function" || call.function.name !== "reallocate_timeline") {
      return NextResponse.json(
        { error: "The model did not return a valid reschedule plan." },
        { status: 502 }
      );
    }

    let parsed: {
      milestonesToPause?: string[];
      reprioritizedTaskIds?: string[];
    };
    try {
      parsed = JSON.parse(call.function.arguments || "{}") as {
        milestonesToPause?: string[];
        reprioritizedTaskIds?: string[];
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid tool arguments from model." },
        { status: 502 }
      );
    }

    const rawPause = Array.isArray(parsed.milestonesToPause)
      ? parsed.milestonesToPause
      : [];
    const rawTasks = Array.isArray(parsed.reprioritizedTaskIds)
      ? parsed.reprioritizedTaskIds
      : [];

    const milestoneIds = new Set(milestoneList.map((m) => m.id));
    const taskIds = new Set(tasks.map((t) => t.id));

    const sanitizedPause = rawPause.filter((id) => milestoneIds.has(id));
    const milestonesToPause = filterProtectedPauses(
      sanitizedPause,
      milestoneList,
      goalList
    );

    const seenTask = new Set<string>();
    const reprioritizedTaskIds: string[] = [];
    for (const id of rawTasks) {
      if (!taskIds.has(id) || seenTask.has(id)) continue;
      seenTask.add(id);
      reprioritizedTaskIds.push(id);
    }
    for (const t of tasks) {
      if (!seenTask.has(t.id)) reprioritizedTaskIds.push(t.id);
    }

    return NextResponse.json({
      milestonesToPause,
      reprioritizedTaskIds,
    } satisfies RescheduleResponseBody);
  } catch (e) {
    console.error("POST /api/agent/reschedule", e);
    return NextResponse.json(
      { error: "Unexpected server error while rescheduling." },
      { status: 500 }
    );
  }
}
