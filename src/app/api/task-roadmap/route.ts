import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

interface TaskRoadmapRequest {
  taskTitle?: string;
  milestoneTitle?: string | null;
  milestoneDescription?: string | null;
  goalTitle?: string | null;
  goalCategory?: string | null;
  dueDate?: string | null;
  userName?: string | null;
  topGoals?: string[];
}

interface TaskRoadmapResponse {
  summary: string;
  urgency: string;
  focusStrategy: string;
  timeline: string;
  firstAction: string;
  executionNote: string;
  phases: { title: string; items: string[] }[];
}

function fallbackRoadmap(taskTitle: string, goalCategory?: string | null): TaskRoadmapResponse {
  const categoryHint =
    goalCategory === "career"
      ? "Convert effort into visible evidence (portfolio, case-study, or applied output)."
      : goalCategory === "academics"
        ? "Use measurable learning outcomes and weekly review cycles."
        : "Break this into small, testable outputs and iterate quickly.";

  return {
    summary: `This roadmap helps you complete "${taskTitle}" with focused execution and proof of progress.`,
    urgency: "Medium urgency",
    focusStrategy: categoryHint,
    timeline: "Use a 2-3 day sprint for baseline, then one refinement pass.",
    firstAction: "Write one measurable success statement for this task and start a 25-minute focus block.",
    executionNote: "Treat this as a practical draft and adapt to your current constraints.",
    phases: [
      {
        title: "Phase 1: Scope and constraints",
        items: [
          "Define the smallest successful outcome.",
          "List tools, blockers, and dependencies.",
          "Set a realistic finish checkpoint.",
        ],
      },
      {
        title: "Phase 2: First implementation",
        items: [
          "Ship a basic working version quickly.",
          "Capture decisions and open questions.",
          "Validate against the success statement.",
        ],
      },
      {
        title: "Phase 3: Quality and handoff",
        items: [
          "Refine weak spots and edge cases.",
          "Create one proof artifact (notes/demo/screenshot).",
          "Pick the immediate next task.",
        ],
      },
    ],
  };
}

function normalizeRoadmap(raw: unknown, fallback: TaskRoadmapResponse): TaskRoadmapResponse {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  const phasesRaw = Array.isArray(data.phases) ? data.phases : [];

  const phases = phasesRaw
    .map((phase) => {
      if (!phase || typeof phase !== "object") return null;
      const p = phase as Record<string, unknown>;
      const title = String(p.title ?? "").trim();
      if (!title) return null;
      const items = Array.isArray(p.items)
        ? p.items.map((it) => String(it).trim()).filter(Boolean).slice(0, 5)
        : [];
      if (items.length === 0) return null;
      return { title, items };
    })
    .filter((p): p is { title: string; items: string[] } => p !== null)
    .slice(0, 5);

  return {
    summary: String(data.summary ?? fallback.summary).trim() || fallback.summary,
    urgency: String(data.urgency ?? fallback.urgency).trim() || fallback.urgency,
    focusStrategy:
      String(data.focusStrategy ?? fallback.focusStrategy).trim() || fallback.focusStrategy,
    timeline: String(data.timeline ?? fallback.timeline).trim() || fallback.timeline,
    firstAction: String(data.firstAction ?? fallback.firstAction).trim() || fallback.firstAction,
    executionNote:
      String(data.executionNote ?? fallback.executionNote).trim() || fallback.executionNote,
    phases: phases.length > 0 ? phases : fallback.phases,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TaskRoadmapRequest;
    const taskTitle = body.taskTitle?.trim();

    if (!taskTitle) {
      return NextResponse.json({ error: "taskTitle is required" }, { status: 400 });
    }

    const fallback = fallbackRoadmap(taskTitle, body.goalCategory);

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ roadmap: fallback, source: "fallback" });
    }

    const prompt = `You are Pathfinder's execution coach. Create a concise, practical roadmap for one task.

Return ONLY valid JSON with this exact shape:
{
  "summary": "string",
  "urgency": "High urgency | Medium urgency | Low urgency | Flexible timeline",
  "focusStrategy": "string",
  "timeline": "string",
  "firstAction": "string",
  "executionNote": "string",
  "phases": [
    {
      "title": "string",
      "items": ["string", "string", "string"]
    }
  ]
}

Rules:
- 3-5 phases total.
- Each phase has 3-5 concrete items.
- Keep each item actionable and specific (one action per bullet).
- Keep tone motivating but pragmatic.
- Personalize using provided context.

Context:
User: ${body.userName || "User"}
Task: ${taskTitle}
Milestone: ${body.milestoneTitle || "N/A"}
Milestone description: ${body.milestoneDescription || "N/A"}
Goal: ${body.goalTitle || "N/A"}
Goal category: ${body.goalCategory || "N/A"}
Due date: ${body.dueDate || "N/A"}
Top goals: ${(body.topGoals || []).join(" | ") || "N/A"}`;

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 900,
    });

    const content = completion.choices[0].message.content || "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    const roadmap = normalizeRoadmap(parsed, fallback);
    return NextResponse.json({ roadmap, source: "llm" });
  } catch (error: unknown) {
    console.error("Task roadmap generation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate roadmap";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
