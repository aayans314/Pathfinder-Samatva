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
    const { name, bio, target_visa, primary_goal } = body;

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert career and life coach for an app called Pathfinder. 
Given the user's details, you must suggest exactly 3 "Paths of Life" (categories) they should focus on.
For each Path, suggest 1 clear, actionable Ultimate Goal, and 3 specific milestones to achieve it.

User Details:
Name: ${name || "User"}
Bio: ${bio || "Not provided"}
Visa Goal: ${target_visa || "Not applicable"}
Primary Focus Right Now: ${primary_goal || "Unknown"}

Return ONLY raw JSON matching this TypeScript structure, with no markdown code blocks formatting it:
[
  {
    "category": "career" | "academics" | "networking" | "fitness" | "personal",
    "goalTitle": "string (The ultimate goal)",
    "milestones": [
      "string (Milestone 1)",
      "string (Milestone 2)",
      "string (Milestone 3)"
    ]
  }
]`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "deepseek-chat", // standard reasoning model
      response_format: { type: "json_object" }, // ensure JSON output
    });

    const responseText = completion.choices[0].message.content || "[]";
    
    let paths;
    try {
      paths = JSON.parse(responseText);
      // Sometimes models return an object with a "paths" key instead of an array
      if (paths.paths && Array.isArray(paths.paths)) {
        paths = paths.paths;
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
