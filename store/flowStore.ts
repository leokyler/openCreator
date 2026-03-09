"use client";
import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import type { TemplateNode, TemplateEdge } from "@/lib/templates";
import type { AiConfig } from "@/lib/services/ai/types";

// 获取节点的可填充字段
function getNodeFields(node: Node): string[] {
  const data = node.data;
  const fields: string[] = [];

  // 检查所有可能的字段
  const fieldKeys = [
    "text",
    "title",
    "sections",
    "location",
    "action",
    "description",
    "bpm",
    "timeSignature",
  ];

  const placeholder = data.placeholder as Record<string, string> | undefined;

  for (const key of fieldKeys) {
    // 检查 data 中是否有值，或者 placeholder 中是否有定义
    if (data[key] !== undefined || (placeholder && placeholder[key] !== undefined)) {
      fields.push(key);
    }
  }

  return fields;
}

// 检查节点是否为空（所有字段都为空，且没有用户输入的内容）
function isNodeEmpty(node: Node): boolean {
  const data = node.data;
  const fields = getNodeFields(node);

  // 如果没有可填充字段，认为不需要填充
  if (fields.length === 0) return false;

  // 检查所有字段是否为空
  // placeholder 字段中存储的是默认提示文本，不算作用户输入的内容
  const placeholder = data.placeholder as Record<string, string> | undefined;

  return fields.every((field) => {
    const value = data[field];
    const placeholderValue = placeholder?.[field];

    // 如果值等于其 placeholder，则视为空
    if (value === placeholderValue) {
      return true;
    }

    // 否则检查是否为空
    return value === undefined || value === "" || value === null;
  });
}

// 检查节点是否有内容
function hasNodeContent(node: Node): boolean {
  return !isNodeEmpty(node);
}

// 获取节点的内容
function getNodeContent(node: Node): Record<string, string> {
  const data = node.data;
  const content: Record<string, string> = {};

  const fields = getNodeFields(node);
  for (const field of fields) {
    const value = data[field];
    if (value !== undefined && value !== "") {
      content[field] = String(value);
    }
  }

  return content;
}

// 定义 store 状态和 actions
interface FlowStore {
  // 节点数据
  nodes: Node[];
  edges: Edge[];

  // AI 配置
  aiConfig: AiConfig | null;
  isAiLoading: boolean;
  aiRecommendResult: { nodeId: string; content: Record<string, string> } | null;
  aiGenerateResult: string | null;
  aiRecommendPrompt: { systemPrompt: string; userPrompt: string } | null;
  aiGeneratePrompt: { systemPrompt: string; userPrompt: string } | null;

  // 节点和边的 actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  loadTemplate: (
    templateNodes: TemplateNode[],
    templateEdges: TemplateEdge[],
  ) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;

  // AI actions
  setAiConfig: (config: AiConfig) => void;
  clearAiResult: () => void;
  recommendForEmptyNode: () => void;
  acceptRecommendation: () => void;
  rejectRecommendation: () => void;
  generateContent: () => void;
  prepareRecommendPrompt: () => void;
  executeRecommendPrompt: (systemPrompt: string, userPrompt: string) => Promise<void>;
  prepareGeneratePrompt: () => void;
  executeGeneratePrompt: (systemPrompt: string, userPrompt: string) => Promise<void>;

  // 辅助方法
  getEmptyNodes: () => Node[];
  getFilledNodes: () => Node[];
  isAllNodesFilled: () => boolean;
}

// 创建 zustand store
export const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],

  // AI 初始状态
  aiConfig: null,
  isAiLoading: false,
  aiRecommendResult: null,
  aiGenerateResult: null,
  aiRecommendPrompt: null,
  aiGeneratePrompt: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  loadTemplate: (templateNodes, templateEdges) => {
    const newNodes: Node[] = templateNodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
      position: n.position,
    }));
    const newEdges: Edge[] = templateEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      animated: e.animated,
      style: e.style,
    }));
    set({ nodes: newNodes, edges: newEdges });
  },

  addNode: (type, position) => {
    const { nodes } = get();
    const id = `${nodes.length + 1}`;
    let nodeType = "creativeProcess";
    let data: Record<string, unknown> = { label: "Process" };

    if (type === "input") {
      nodeType = "creativeInput";
      data = { label: "Text Input", text: "" };
    } else if (type === "output") {
      nodeType = "creativeOutput";
      data = { label: "Output" };
    } else if (type === "prompt") {
      data = { label: "Prompt", text: "" };
    } else if (type === "article") {
      data = { label: "Article Structure", title: "", sections: "" };
    } else if (type === "script") {
      data = { label: "Script Scene", location: "", action: "" };
    } else if (type === "music") {
      data = {
        label: "Music Rhythm",
        bpm: 120,
        timeSignature: "4/4" as string,
      };
    }

    const newNode: Node = { id, type: nodeType, data, position };
    set({ nodes: [...nodes, newNode] });
  },

  deleteNode: (nodeId) => {
    const { nodes, edges } = get();
    set({
      nodes: nodes.filter((n) => n.id !== nodeId),
      edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  },

  updateNodeData: (nodeId, data) => {
    const { nodes } = get();
    set({
      nodes: nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    });
  },

  // AI actions
  setAiConfig: (config) => {
    set({ aiConfig: config });
  },

  clearAiResult: () => {
    set({ aiRecommendResult: null, aiGenerateResult: null });
  },

  getEmptyNodes: () => {
    const { nodes } = get();
    return nodes.filter(isNodeEmpty);
  },

  getFilledNodes: () => {
    const { nodes } = get();
    return nodes.filter(hasNodeContent);
  },

  isAllNodesFilled: () => {
    const { nodes } = get();
    if (nodes.length === 0) return false;
    return nodes.every(hasNodeContent);
  },

  prepareRecommendPrompt: () => {
    const { getEmptyNodes, getFilledNodes } = get();

    const emptyNodes = getEmptyNodes();
    const filledNodes = getFilledNodes();

    if (emptyNodes.length === 0) {
      alert("没有空节点需要填充");
      return;
    }

    const targetNode = emptyNodes[0];
    const fields = getNodeFields(targetNode);

    if (fields.length === 0) {
      alert("该节点没有可填充的字段");
      return;
    }

    const filledNodesData = filledNodes.map((n) => ({
      label: String(n.data.label),
      content: getNodeContent(n),
    }));

    const systemPrompt = `你是一个创意写作助手。根据用户提供的已有内容，为空缺的节点生成合适的填充建议。建议应该符合上下文风格，并且内容合理。`;

    const userPrompt = `已有节点内容：
${filledNodesData.map((n) => `- ${n.label}: ${JSON.stringify(n.content)}`).join("\n")}

空缺节点信息：
- 节点标签: ${targetNode.data.label}
- 需要填充的字段: ${fields.join(", ")}

请为这个空缺节点生成填充内容。直接返回 JSON 格式的建议内容，不要有其他解释。格式如下：
{field1: "内容1", field2: "内容2", ...}`;

    set({
      aiRecommendPrompt: {
        systemPrompt,
        userPrompt,
      },
    });
  },

  executeRecommendPrompt: async (systemPrompt: string, userPrompt: string) => {
    const { aiConfig, getEmptyNodes } = get();

    if (!aiConfig) {
      alert("请先配置 AI");
      return;
    }

    const emptyNodes = getEmptyNodes();
    const targetNode = emptyNodes[0];

    set({ isAiLoading: true });

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiConfig.provider,
          model: aiConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "text-delta") {
                  resultText += data.textDelta;
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      try {
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        const suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        set({
          aiRecommendResult: {
            nodeId: targetNode.id,
            content: suggestion,
          },
          aiRecommendPrompt: null,
          isAiLoading: false,
        });
      } catch {
        alert("AI 返回格式解析失败");
        set({ isAiLoading: false });
      }
    } catch (error) {
      console.error("AI 推荐失败:", error);
      alert("AI 推荐失败，请检查 API 配置");
      set({ isAiLoading: false });
    }
  },

  acceptRecommendation: () => {
    const { aiRecommendResult, updateNodeData } = get();

    if (aiRecommendResult) {
      updateNodeData(aiRecommendResult.nodeId, aiRecommendResult.content);
      set({ aiRecommendResult: null });
    }
  },

  rejectRecommendation: () => {
    set({ aiRecommendResult: null, aiRecommendPrompt: null });
  },

  recommendForEmptyNode: () => {
    const { prepareRecommendPrompt } = get();
    prepareRecommendPrompt();
  },

  generateContent: () => {
    const { prepareGeneratePrompt } = get();
    prepareGeneratePrompt();
  },

  prepareGeneratePrompt: () => {
    const { getFilledNodes } = get();

    const filledNodes = getFilledNodes();

    if (filledNodes.length === 0) {
      alert("没有内容可以生成");
      return;
    }

    const nodesData = filledNodes.map((n) => ({
      label: String(n.data.label),
      content: getNodeContent(n),
    }));

    const systemPrompt = `你是一个创意写作大师。基于提供的创作节点内容，生成完整的、高质量的创作作品。注意保持风格一致性和内容连贯性。`;

    const userPrompt = `创作节点内容：
${nodesData.map((n) => `【${n.label}】\n${JSON.stringify(n.content, null, 2)}`).join("\n\n")}

请基于以上内容，创作出完整的作品。`;

    set({
      aiGeneratePrompt: {
        systemPrompt,
        userPrompt,
      },
    });
  },

  executeGeneratePrompt: async (systemPrompt: string, userPrompt: string) => {
    const { aiConfig } = get();

    if (!aiConfig) {
      alert("请先配置 AI");
      return;
    }

    set({ isAiLoading: true });

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiConfig.provider,
          model: aiConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "text-delta") {
                  resultText += data.textDelta;
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      set({
        aiGenerateResult: resultText,
        aiGeneratePrompt: null,
        isAiLoading: false,
      });
    } catch (error) {
      console.error("AI 生成失败:", error);
      alert("AI 生成失败，请检查 API 配置");
      set({ isAiLoading: false });
    }
  },
}));
