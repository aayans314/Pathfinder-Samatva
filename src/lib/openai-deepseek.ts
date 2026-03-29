import OpenAI from "openai";

/** Create client only when a key exists — avoids build-time failures when env is empty. */
export function getDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }
  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });
}
