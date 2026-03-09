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

interface AiRecommendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiRecommendDialog({ isOpen, onClose }: AiRecommendDialogProps) {
  const aiRecommendResult = useFlowStore((s) => s.aiRecommendResult);
  const aiRecommendPrompt = useFlowStore((s) => s.aiRecommendPrompt);
  const isAiLoading = useFlowStore((s) => s.isAiLoading);
  const acceptRecommendation = useFlowStore((s) => s.acceptRecommendation);
  const rejectRecommendation = useFlowStore((s) => s.rejectRecommendation);
  const executeRecommendPrompt = useFlowStore((s) => s.executeRecommendPrompt);
  const nodes = useFlowStore((s) => s.nodes);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const targetNode = nodes.find((n) => n.id === aiRecommendResult?.nodeId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSystemPrompt("");
      setUserPrompt("");
      setCopied(false);
      onClose();
    }
  };

  const handlePrepare = () => {
    if (aiRecommendPrompt) {
      setSystemPrompt(aiRecommendPrompt.systemPrompt);
      setUserPrompt(aiRecommendPrompt.userPrompt);
    }
  };

  const handleExecute = async () => {
    await executeRecommendPrompt(systemPrompt, userPrompt);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      `系统提示词：\n${systemPrompt}\n\n用户提示词：\n${userPrompt}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#252525] text-white sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-white">AI 推荐</DialogTitle>
        </DialogHeader>

        {isAiLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500 mb-3">AI 正在思考中...</p>
            <div className="w-6 h-6 border-3 border-gray-600 border-t-[#4a90d9] rounded-full animate-spin" />
          </div>
        ) : aiRecommendPrompt ? (
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
                      onClick={handleCopy}
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
                    onClick={handleCopy}
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
        ) : aiRecommendResult ? (
          <>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">为节点</p>
              <p className="text-[#4a90d9] font-bold">
                {String(targetNode?.data.label) || "未知节点"}
              </p>
            </div>

            <div className="bg-[#1e1e1e] rounded-lg p-4 max-h-[300px] overflow-auto space-y-3">
              {Object.entries(aiRecommendResult.content).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-gray-500 mb-1">{key}</p>
                  <p className="text-white whitespace-pre-wrap">
                    {value || "(空)"}
                  </p>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-4 gap-3">
              <Button
                onClick={acceptRecommendation}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                接受推荐
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  rejectRecommendation();
                  onClose();
                }}
                className="flex-1"
              >
                拒绝
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex items-center justify-center py-10 text-gray-500">
            暂无推荐内容
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
