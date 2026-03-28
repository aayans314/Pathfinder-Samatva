import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 5 MB" },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text: rawText } = await extractText(pdf, { mergePages: true });

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract meaningful text from this PDF. Try a different file.",
        },
        { status: 422 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ resumeText: rawText.trim() });
    }

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Given raw text extracted from a PDF resume, return structured JSON with the following fields. Omit any field that has no data.

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "summary": "A 1-2 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "title": "Job Title", "company": "Company", "duration": "e.g. 2020-2023", "highlights": ["bullet1"] }
  ],
  "education": [
    { "degree": "string", "institution": "string", "year": "string" }
  ],
  "certifications": ["cert1"],
  "projects": [
    { "name": "string", "description": "string" }
  ]
}

Return ONLY raw JSON. No markdown.`,
        },
        {
          role: "user",
          content: rawText.trim().slice(0, 8000),
        },
      ],
    });

    const responseText = completion.choices[0].message.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = null;
    }

    return NextResponse.json({
      resumeText: rawText.trim().slice(0, 6000),
      parsed,
    });
  } catch (error: unknown) {
    console.error("Resume parse error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to parse resume";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
