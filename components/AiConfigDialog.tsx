"use client";
import { useState } from "react";
import { useFlowStore } from "../store/flowStore";
import type { AiProvider } from "@/lib/services/ai/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AiConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiConfigDialog({ isOpen, onClose }: AiConfigDialogProps) {
  const aiConfig = useFlowStore((s) => s.aiConfig);
  const setAiConfig = useFlowStore((s) => s.setAiConfig);

  const [provider, setProvider] = useState<AiProvider>(
    aiConfig?.provider || "anthropic",
  );
  const [model, setModel] = useState(aiConfig?.model || "");
  const [baseURL, setBaseURL] = useState(aiConfig?.baseURL || "");

  const handleSave = () => {
    setAiConfig({
      provider,
      apiKey: "",
      model: model.trim() || undefined,
      baseURL: baseURL.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="bg-[#252525] text-white sm:max-w-100">
        <DialogHeader>
          <DialogTitle className="text-white">AI 配置</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-yellow-900/30 p-3 text-sm text-yellow-200">
            AI 配置现在由服务端环境变量管理。请在服务器上设置
            <code className="mx-1 rounded bg-yellow-900/50 px-1">AI_API_KEY</code>
            和可选的
            <code className="mx-1 rounded bg-yellow-900/50 px-1">AI_BASE_URL</code>
            环境变量。
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">AI 供应商</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProvider)}
              className="w-full rounded-md border border-gray-600 bg-[#1e1e1e] px-3 py-2 text-sm text-white"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="minimax">Minimax (Anthropic)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">
              模型 (可选)
              {provider === "anthropic" && (
                <span className="font-normal text-gray-500">
                  {" "}
                  - 默认: claude-3-5-sonnet-20241022
                </span>
              )}
              {provider === "openai" && (
                <span className="font-normal text-gray-500">
                  {" "}
                  - 默认: gpt-4o
                </span>
              )}
              {provider === "minimax" && (
                <span className="font-normal text-gray-500">
                  {" "}
                  - 默认: MiniMax-M2.5
                </span>
              )}
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="留空使用默认模型"
              className="w-full rounded-md border border-gray-600 bg-[#1e1e1e] px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">
              Base URL (可选)
              <span className="font-normal text-gray-500">
                {" "}
                - 用于代理或自定义端点
              </span>
            </label>
            <input
              type="text"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="如: https://api.openai.com/v1"
              className="w-full rounded-md border border-gray-600 bg-[#1e1e1e] px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-[#4a90d9] hover:bg-[#4a90d9]/80"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
