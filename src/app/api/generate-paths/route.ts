import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize the OpenAI client pointing to DeepSeek
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, bio, goals, resumeContext } = body;

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
        { status: 500 }
      );
    }

    // Accept both old format (primary_goal) and new format (goals array)
    const goalsList: string[] = Array.isArray(goals)
      ? goals
      : body.primary_goal
      ? [body.primary_goal]
      : [];

    if (goalsList.length === 0) {
      return NextResponse.json({ error: "No goals provided" }, { status: 400 });
    }

    const resumeSection = resumeContext
      ? `\nResume / Professional Background:\n${resumeContext}\n\nUse the resume information above to make milestones highly specific and relevant to the user's actual skills, experience level, and career stage. Reference specific skills or gaps where appropriate.`
      : "";

    const systemPrompt = `You are an expert career and life coach for an app called Pathfinder. 
Given the user's details and their list of goals, create a structured "Path of Life" for EACH goal.
For each Path, determine the best category, create a clear actionable goal title, and provide 3-5 specific milestones to achieve it.

User Details:
Name: ${name || "User"}
Background: ${bio || "Not provided"}
${resumeSection}

Goals the user wants to achieve:
${goalsList.map((g: string, i: number) => `${i + 1}. ${g}`).join("\n")}

Return ONLY raw JSON matching this structure, with no markdown code blocks:
[
  {
    "category": "career" | "academics" | "networking" | "fitness" | "personal",
    "goalTitle": "string (clear, actionable goal title)",
    "milestones": [
      "string (Specific milestone 1)",
      "string (Specific milestone 2)",
      "string (Specific milestone 3)"
    ]
  }
]

Important rules:
- Create exactly one path per user goal
- Each path must have 3-5 milestones
- Milestones should be specific, measurable, and actionable
- Choose the most appropriate category for each goal
- Goal titles should be polished versions of the user's input
- If resume data is provided, tailor milestones to the user's experience level and skill set`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content || "[]";
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let paths: any;
    try {
      paths = JSON.parse(responseText);
      // Sometimes models return an object with a "paths" key instead of an array
      if (paths.paths && Array.isArray(paths.paths)) {
        paths = paths.paths;
      }
      // Handle case where model wraps in another object
      if (!Array.isArray(paths)) {
        const firstArrayKey = Object.keys(paths).find((k) => Array.isArray(paths[k]));
        if (firstArrayKey) {
          paths = paths[firstArrayKey];
        } else {
          paths = [paths]; // Single object, wrap it
        }
      }
    } catch (e) {
      console.error("Failed to parse AI response", responseText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ paths });
  } catch (error: any) {
    console.error("DeepSeek API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
