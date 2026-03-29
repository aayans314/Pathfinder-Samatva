import { NextResponse } from "next/server";
import {
  normalizeGeneratedPaths,
  TIME_FRAME_IDS,
  DEFAULT_TIME_FRAME_LABELS,
} from "@/lib/ai/generated-path";
import { getDeepSeekClient } from "@/lib/openai-deepseek";

export const maxDuration = 60;

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
      ? `\n--- Resume (extracted text) ---\n${resumeContext.slice(0, 4_000)}\n`
      : "";

    const resumeJsonSection =
      resumeStructured && Object.keys(resumeStructured).length > 0
        ? `\n--- Resume (structured) ---\n${JSON.stringify(resumeStructured).slice(0, 2_000)}\n`
        : "";

    const systemPrompt = `You are Pathfinder's planning engine. For EACH user goal you produce a **to-do list split into exactly seven time horizons**, personalized using their name, bio, and resume. Answer quickly and concisely.

## Seven fixed horizons (use each exactly once per path)
Each milestone must set "timeFrameId" to one of these strings (in this conceptual order from near to far):
${TIME_FRAME_SPEC}

## Personalization (required)
- Address the user naturally as "${userFirstName}" where appropriate.
- **personalizedPathIntro**: max 100 chars on why this fits them.
- **personalizedNote**: max 80 chars on why *this time slice* matters.

## Task rules (substeps)
- Each milestone has **substeps**: 1–2 short strings = the to-do list for that horizon.
- Each substep ≤ **60 characters**, single concrete action.

## Categories
Pick ONE per path: "academics" | "research" | "internships" | "career" | "fitness" | "networking" | "personal" | "daily"

User:
Name: ${name || "User"}
About: ${bio || "Not provided"}
${resumeTextSection}${resumeJsonSection}
Goals to plan (one path per goal, same order):
${goalsList.map((g: string, i: number) => `${i + 1}. ${g}`).join("\n")}

Return ONLY valid JSON with this EXACT shape:
{
  "paths": [
    {
      "category": "career",
      "goalTitle": "short polished title",
      "goalHorizonYears": 10,
      "pathSummary": "one neutral sentence",
      "personalizedPathIntro": "max 100 chars",
      "milestones": [
        {
          "timeFrameId": "today",
          "title": "short milestone title",
          "horizonLabel": "optional",
          "personalizedNote": "max 80 chars",
          "description": "optional short description",
          "substeps": ["Task 1", "Task 2"]
        }
      ]
    }
  ]
}

RULES:
- Exactly **one** path per user goal.
- **milestones** must contain **exactly 7** objects in order: ${TIME_FRAME_IDS.join(", ")}.
- Extremely concise JSON processing.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0.42,
      max_tokens: 4096,
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
