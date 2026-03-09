"use client";
import { useState } from "react";
import { useFlowStore } from "../store/flowStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Check, Play } from "lucide-react";

interface AiGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiGenerateDialog({ isOpen, onClose }: AiGenerateDialogProps) {
  const aiGenerateResult = useFlowStore((s) => s.aiGenerateResult);
  const aiGeneratePrompt = useFlowStore((s) => s.aiGeneratePrompt);
  const isAiLoading = useFlowStore((s) => s.isAiLoading);
  const clearAiResult = useFlowStore((s) => s.clearAiResult);
  const executeGeneratePrompt = useFlowStore((s) => s.executeGeneratePrompt);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setSystemPrompt("");
    setUserPrompt("");
    setCopied(false);
    clearAiResult();
    onClose();
  };

  const handlePrepare = () => {
    if (aiGeneratePrompt) {
      setSystemPrompt(aiGeneratePrompt.systemPrompt);
      setUserPrompt(aiGeneratePrompt.userPrompt);
    }
  };

  const handleExecute = async () => {
    await executeGeneratePrompt(systemPrompt, userPrompt);
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(
      `系统提示词：\n${systemPrompt}\n\n用户提示词：\n${userPrompt}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyResult = () => {
    if (aiGenerateResult) {
      navigator.clipboard.writeText(aiGenerateResult);
      alert("已复制到剪贴板");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="bg-[#252525] text-white sm:max-w-[700px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-white">AI 创作</DialogTitle>
        </DialogHeader>

        {isAiLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500 mb-3">AI 正在创作中...</p>
            <div className="w-6 h-6 border-3 border-gray-600 border-t-[#4a90d9] rounded-full animate-spin" />
          </div>
        ) : aiGeneratePrompt ? (
          <>
            {!systemPrompt && (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">提示词已生成，您可以修改后再执行</p>
                <Button onClick={handlePrepare} className="bg-[#4a90d9] hover:bg-[#4a90d9]/80">
                  编辑提示词
                </Button>
              </div>
            )}

            {systemPrompt && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">系统提示词</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPrompt}
                      className="text-gray-400 hover:text-white h-6 px-2"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span className="ml-1">{copied ? "已复制" : "复制"}</span>
                    </Button>
                  </div>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full h-24 bg-[#1e1e1e] border border-gray-600 rounded-md px-3 py-2 text-sm text-white resize-none"
                    placeholder="系统提示词..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">用户提示词</label>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="w-full h-40 bg-[#1e1e1e] border border-gray-600 rounded-md px-3 py-2 text-sm text-white resize-none"
                    placeholder="用户提示词..."
                  />
                </div>

                <DialogFooter className="gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    复制提示词
                  </Button>
                  <Button
                    onClick={handleExecute}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                  >
                    <Play size={14} />
                    执行 AI
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        ) : aiGenerateResult ? (
          <>
            <div className="bg-[#1e1e1e] rounded-lg p-4 max-h-[400px] overflow-auto">
              <pre className="whitespace-pre-wrap break-words text-sm text-white leading-relaxed">
                {aiGenerateResult}
              </pre>
            </div>

            <DialogFooter className="mt-4 gap-3">
              <Button
                onClick={handleCopyResult}
                className="flex-1 bg-[#4a90d9] hover:bg-[#4a90d9]/80"
              >
                复制内容
              </Button>
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                关闭
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex items-center justify-center py-10 text-gray-500">
            暂无生成内容
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
