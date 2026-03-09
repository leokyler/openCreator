/**
 * AI 服务 - 使用 Vercel AI SDK
 */

import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import Anthropic from "@anthropic-ai/sdk";
import { createOpenAI } from "@ai-sdk/openai";
import type { AiRequestOptions, AiProvider } from "./types";

export async function generateWithAI(
  options: AiRequestOptions,
): Promise<string> {
  const { provider, apiKey, model, baseURL, systemPrompt, userPrompt } =
    options;

  let modelId = model;

  if (provider === "anthropic") {
    // Anthropic (Claude)
    if (!modelId) {
      modelId = "claude-3-5-sonnet-20241022";
    }

    const anthropicClient = createAnthropic({
      apiKey,
      ...(baseURL && { baseURL }),
    });

    const result = await generateText({
      model: anthropicClient(modelId),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return result.text;
  } else if (provider === "minimax") {
    // Anthropic (minimax)
    if (!modelId) {
      modelId = "MiniMax-M2.5";
    }
    const client = new Anthropic({
      apiKey: apiKey, // This is the default and can be omitted
    });

    const message = await client.messages.create({
      max_tokens: 1024,
      messages: [{ role: "user", content: "Hello, Claude" }],
      model: modelId,
    });
    return message.content.reduce((acc, part) => acc + part, "");
  } else if (provider === "openai") {
    // OpenAI (GPT)
    if (!modelId) {
      modelId = "gpt-4o";
    }

    const openaiClient = createOpenAI({
      apiKey,
      ...(baseURL && { baseURL }),
    });

    const result = await generateText({
      model: openaiClient(modelId),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return result.text;
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * 为空节点生成推荐内容
 */
export async function recommendEmptyNode(
  config: {
    provider: AiProvider;
    apiKey: string;
    model?: string;
    baseURL?: string;
  },
  filledNodes: { label: string; content: Record<string, string> }[],
  emptyNode: { id: string; label: string; fields: string[] },
): Promise<Record<string, string>> {
  const systemPrompt = `你是一个创意写作助手。根据用户提供的已有内容，为空缺的节点生成合适的填充建议。建议应该符合上下文风格，并且内容合理。`;

  const userPrompt = `已有节点内容：
${filledNodes.map((n) => `- ${n.label}: ${JSON.stringify(n.content)}`).join("\n")}

空缺节点信息：
- 节点标签: ${emptyNode.label}
- 需要填充的字段: ${emptyNode.fields.join(", ")}

请为这个空缺节点生成填充内容。直接返回 JSON 格式的建议内容，不要有其他解释。格式如下：
{field1: "内容1", field2: "内容2", ...}`;

  const result = await generateWithAI({
    ...config,
    systemPrompt,
    userPrompt,
  });

  // 尝试解析 JSON
  try {
    // 尝试提取 JSON 部分
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * 基于所有节点内容生成创作
 */
export async function generateContent(
  config: {
    provider: AiProvider;
    apiKey: string;
    model?: string;
    baseURL?: string;
  },
  nodes: { label: string; content: Record<string, string> }[],
): Promise<string> {
  const systemPrompt = `你是一个创意写作大师。基于提供的创作节点内容，生成完整的、高质量的创作作品。注意保持风格一致性和内容连贯性。`;

  const userPrompt = `创作节点内容：
${nodes.map((n) => `【${n.label}】\n${JSON.stringify(n.content, null, 2)}`).join("\n\n")}

请基于以上内容，创作出完整的作品。`;

  return generateWithAI({
    ...config,
    systemPrompt,
    userPrompt,
  });
}
