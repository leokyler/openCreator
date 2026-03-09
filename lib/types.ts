/**
 * AI 服务类型定义
 */

export type AiProvider = "anthropic" | "openai";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export interface NodeContent {
  nodeId: string;
  label: string;
  fields: Record<string, string>;
}

export interface AiRecommendResult {
  nodeId: string;
  suggestedContent: Record<string, string>;
}

export interface AiGenerateResult {
  content: string;
}

export interface AiRequestOptions {
  provider: AiProvider;
  apiKey: string;
  model?: string;
  baseURL?: string;
  systemPrompt: string;
  userPrompt: string;
}
