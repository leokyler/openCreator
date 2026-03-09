import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const { provider, model, messages } = body;

  const apiKey = process.env.AI_API_KEY;
  const baseURL = process.env.AI_BASE_URL;

  if (!apiKey) {
    return new Response("AI_API_KEY not configured", { status: 500 });
  }

  let modelId = model;

  const getModel = () => {
    if (provider === "anthropic") {
      if (!modelId) {
        modelId = "claude-3-5-sonnet-20241022";
      }
      const client = createAnthropic({
        apiKey,
        ...(baseURL && { baseURL }),
      });
      return client(modelId);
    } else if (provider === "minimax") {
      if (!modelId) {
        modelId = "MiniMax-M2.5";
      }
      const minimaxBaseURL = baseURL || "https://api.minimaxi.com/anthropic";
      const client = createAnthropic({
        apiKey,
        baseURL: minimaxBaseURL,
      });
      return client(modelId);
    } else {
      if (!modelId) modelId = "gpt-4o";
      const client = createOpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
      });
      return client(modelId);
    }
  };

  const result = streamText({
    model: getModel(),
    messages,
  });

  return result.toTextStreamResponse();
}
