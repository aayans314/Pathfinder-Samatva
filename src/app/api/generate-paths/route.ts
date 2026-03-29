import { NextResponse } from "next/server";
import {
  normalizeGeneratedPaths,
  TIME_FRAME_IDS,
  DEFAULT_TIME_FRAME_LABELS,
} from "@/lib/ai/generated-path";
import { getDeepSeekClient } from "@/lib/openai-deepseek";

const TIME_FRAME_SPEC = TIME_FRAME_IDS.map(
  (id) => `"${id}" → ${DEFAULT_TIME_FRAME_LABELS[id]}`
).join("\n");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      bio,
      goals,
      resumeContext,
      resumeStructured,
    }: {
      name?: string;
      bio?: string;
      goals?: string[];
      resumeContext?: string;
      resumeStructured?: Record<string, unknown> | null;
    } = body;

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
        { status: 500 }
      );
    }

    const goalsList: string[] = Array.isArray(goals)
      ? goals
      : body.primary_goal
        ? [body.primary_goal]
        : [];

    if (goalsList.length === 0) {
      return NextResponse.json({ error: "No goals provided" }, { status: 400 });
    }

    const openai = getDeepSeekClient();
    const userFirstName = (name || "User").trim().split(/\s+/)[0] || "User";

    const resumeTextSection = resumeContext
      ? `\n--- Resume (extracted text) ---\n${resumeContext.slice(0, 12_000)}\n`
      : "";

    const resumeJsonSection =
      resumeStructured && Object.keys(resumeStructured).length > 0
        ? `\n--- Resume (structured) ---\n${JSON.stringify(resumeStructured).slice(0, 8000)}\n`
        : "";

    const systemPrompt = `You are Pathfinder's planning engine. For EACH user goal you produce a **to-do list split into exactly seven time horizons**, heavily personalized using their name, bio, and resume (if any). Domains may be anything: career, school, health, money, family, relocation, creative work — never assume they are a founder or engineer unless stated.

## Seven fixed horizons (use each exactly once per path)
Each milestone must set "timeFrameId" to one of these strings (in this conceptual order from near to far):
${TIME_FRAME_SPEC}

## Personalization (required)
- Address the user naturally as "${userFirstName}" where appropriate in **personalizedPathIntro** and **personalizedNote** fields — not in every task.
- **personalizedPathIntro**: one sentence (max ~220 chars) on why this roadmap fits *their* situation (skills, constraints, resume, bio).
- Every milestone must include **personalizedNote**: one short sentence (max ~220 chars) on why *this time slice* matters for *them* specifically (not generic advice).
- Use resume/skills to **word** tasks; do not invent degrees, employers, or locations not present in the context.

## Task rules (substeps)
- Each milestone has **substeps**: 3–5 strings = the to-do list for that horizon.
- Each substep ≤ **90 characters**, single concrete action (verb + object), completable inside that horizon window.
- **today** / **this_week**: immediate actions only.
- **three_plus_years**: only vision-level *next* moves (e.g. "Schedule annual review of portfolio allocation"), not fantasy outcomes.

## Categories
Pick ONE per path: "academics" | "research" | "internships" | "career" | "fitness" | "networking" | "personal" | "daily"

User:
Name: ${name || "User"}
About: ${bio || "Not provided"}
${resumeTextSection}${resumeJsonSection}
Goals to plan (one path per goal, same order):
${goalsList.map((g: string, i: number) => `${i + 1}. ${g}`).join("\n")}

Return ONLY valid JSON (no markdown fences) with this EXACT shape:
{
  "paths": [
    {
      "category": "career",
      "goalTitle": "short polished title",
      "goalHorizonYears": 10,
      "pathSummary": "one neutral sentence on what success looks like",
      "personalizedPathIntro": "one sentence tailored to this user",
      "milestones": [
        {
          "timeFrameId": "today",
          "title": "short milestone title for this slice",
          "horizonLabel": "optional; may mirror the fixed label",
          "personalizedNote": "why this slice matters for them",
          "description": "optional extra detail",
          "substeps": ["Task 1", "Task 2", "Task 3"]
        }
      ]
    }
  ]
}

RULES:
- Exactly **one** path object per user goal, same order as the goals list.
- **milestones** must contain **exactly 7** objects — one per timeFrameId in order: ${TIME_FRAME_IDS.join(", ")}.
- Every substep under 90 characters. No markdown. No decade-long outcomes in **today** or **this_week**.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0.42,
      max_tokens: 8192,
    });

    const responseText = completion.choices[0].message.content || "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse AI response", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const paths = normalizeGeneratedPaths(parsed);

    if (paths.length === 0) {
      return NextResponse.json(
        { error: "Model returned no valid paths" },
        { status: 502 }
      );
    }

    return NextResponse.json({ paths });
  } catch (error: unknown) {
    console.error("DeepSeek API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
