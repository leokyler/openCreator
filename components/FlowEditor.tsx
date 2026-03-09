"use client";
import { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { useFlowStore } from "../store/flowStore";
import { AiConfigDialog } from "./AiConfigDialog";
import { AiRecommendDialog } from "./AiRecommendDialog";
import { AiGenerateDialog } from "./AiGenerateDialog";
import { Button } from "@/components/ui/button";
import "@xyflow/react/dist/style.css";

interface CreativeNodeData {
  label?: string;
  text?: string;
  title?: string;
  sections?: string;
  location?: string;
  action?: string;
  placeholder?: Record<string, string>;
  [key: string]: unknown;
}

const CreativeNode = ({
  id,
  data,
  type,
}: {
  id: string;
  data: CreativeNodeData;
  type?: string;
}) => {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const placeholder = data.placeholder as Record<string, string> | undefined;

  const hasText = data.text !== undefined || (placeholder && placeholder.text !== undefined);
  const hasTitle = data.title !== undefined || (placeholder && placeholder.title !== undefined);
  const hasSections = data.sections !== undefined || (placeholder && placeholder.sections !== undefined);
  const hasLocation = data.location !== undefined || (placeholder && placeholder.location !== undefined);
  const hasAction = data.action !== undefined || (placeholder && placeholder.action !== undefined);

  const handleChange = (field: string, value: string) => {
    updateNodeData(id, { [field]: value });
  };

  return (
    <div className="min-w-35 max-w-45 p-2 bg-white rounded-lg border border-gray-200">
      {(type === "default" || type === "output" || type === "input") && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="bg-[#4a90d9]! w-2! h-2!"
        />
      )}
      <div className="font-bold mb-1 text-gray-800 text-xs whitespace-nowrap">
        {data.label}
      </div>
      {hasText && (
        <textarea
          value={data.text || ""}
          onChange={(e) => handleChange("text", e.target.value)}
          placeholder={placeholder?.text || "Enter text..."}
          className="w-full h-10 resize-none p-1 text-xs"
        />
      )}
      {hasTitle && (
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder={placeholder?.title || "Title"}
          className="w-full mb-1 p-1 text-xs"
        />
      )}
      {hasSections && (
        <textarea
          value={data.sections || ""}
          onChange={(e) => handleChange("sections", e.target.value)}
          placeholder={placeholder?.sections || "Sections"}
          className="w-full h-12.5 resize-none p-1 text-[10px]"
        />
      )}
      {hasLocation && (
        <input
          type="text"
          value={data.location || ""}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder={placeholder?.location || "Location"}
          className="w-full mb-1 p-1 text-xs"
        />
      )}
      {hasAction && (
        <textarea
          value={data.action || ""}
          onChange={(e) => handleChange("action", e.target.value)}
          placeholder={placeholder?.action || "Action"}
          className="w-full h-10 resize-none p-1 text-xs"
        />
      )}
      {(type === "default" || type === "input" || type === undefined) && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="bg-[#4ad97c]! w-2! h-2!"
        />
      )}
    </div>
  );
};

const nodeTypes = {
  creativeInput: (props: { id: string; data: CreativeNodeData }) => (
    <CreativeNode {...props} type="input" />
  ),
  creativeProcess: (props: { id: string; data: CreativeNodeData }) => (
    <CreativeNode {...props} type="default" />
  ),
  creativeOutput: (props: { id: string; data: CreativeNodeData }) => (
    <CreativeNode {...props} type="output" />
  ),
};

function FlowEditor() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const setNodes = useFlowStore((s) => s.setNodes);
  const setEdges = useFlowStore((s) => s.setEdges);
  const addNode = useFlowStore((s) => s.addNode);

  const aiConfig = useFlowStore((s) => s.aiConfig);
  const isAiLoading = useFlowStore((s) => s.isAiLoading);
  const isAllNodesFilled = useFlowStore((s) => s.isAllNodesFilled);
  const getEmptyNodes = useFlowStore((s) => s.getEmptyNodes);
  const recommendForEmptyNode = useFlowStore((s) => s.recommendForEmptyNode);
  const generateContent = useFlowStore((s) => s.generateContent);

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showRecommendDialog, setShowRecommendDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges],
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(
        addEdge(
          { ...params, animated: true, style: { stroke: "#4a90d9" } },
          edges,
        ),
      ),
    [edges, setEdges],
  );

  const handleAddNode = (type: string) => {
    addNode(type, {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    });
  };

  const handleAiRecommend = () => {
    if (!aiConfig) {
      setShowConfigDialog(true);
      return;
    }
    recommendForEmptyNode();
    setShowRecommendDialog(true);
  };

  const handleAiGenerate = () => {
    if (!aiConfig) {
      setShowConfigDialog(true);
      return;
    }
    generateContent();
    setShowGenerateDialog(true);
  };

  const handleAiAction = () => {
    const emptyNodes = getEmptyNodes();
    if (emptyNodes.length > 0) {
      handleAiRecommend();
    } else if (isAllNodesFilled()) {
      handleAiGenerate();
    } else {
      alert("没有空节点需要填充，且节点未全部填满");
    }
  };

  return (
    <div className="flex w-full" style={{ height: "calc(100vh - 60px)" }}>
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#1e1e1e]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#444"
          />
          <Controls className="bg-[#333] rounded-lg" />
          <MiniMap
            nodeColor="#4a90d9"
            maskColor="rgba(0, 0, 0, 0.3)"
            className="bg-[#252525] rounded-lg"
          />
          <Panel className="flex gap-2">
            <Button size="sm" onClick={() => handleAddNode("input")}>
              + Input
            </Button>
            <Button size="sm" onClick={() => handleAddNode("process")}>
              + Process
            </Button>
            <Button size="sm" onClick={() => handleAddNode("output")}>
              + Output
            </Button>
          </Panel>
          <Panel className="flex gap-2">
            <Button
              onClick={handleAiAction}
              disabled={isAiLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAiLoading ? "AI工作中..." : "✨ AI 助手"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfigDialog(true)}
            >
              ⚙️
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      <div className="w-70 bg-[#252525] border-l border-[#333] p-4 overflow-auto">
        <h3 className="text-white mb-4">创作节点</h3>

        <NodeCard
          title="Text Input"
          desc="文本输入节点"
          titleColor="text-[#4a90d9]"
          onClick={() => handleAddNode("input")}
        />
        <NodeCard
          title="Prompt"
          desc="提示词节点"
          titleColor="text-[#d98c4a]"
          onClick={() => handleAddNode("prompt")}
        />
        <NodeCard
          title="Article Structure"
          desc="文章结构"
          titleColor="text-[#d98c4a]"
          onClick={() => handleAddNode("article")}
        />
        <NodeCard
          title="Script Scene"
          desc="脚本场景"
          titleColor="text-[#d98c4a]"
          onClick={() => handleAddNode("script")}
        />
        <NodeCard
          title="Music Rhythm"
          desc="音乐节奏"
          titleColor="text-[#d98c4a]"
          onClick={() => handleAddNode("music")}
        />
        <NodeCard
          title="Output"
          desc="输出节点"
          titleColor="text-[#4ad97c]"
          onClick={() => handleAddNode("output")}
        />

        <div className="mt-6 p-3 bg-[#1e1e1e] rounded-lg">
          <h4 className="text-white mb-2">✨ AI 辅助</h4>
          <ul className="text-gray-500 text-xs list-disc list-inside leading-relaxed mb-3">
            <li>有空白节点时：点击推荐填充</li>
            <li>全部填满时：点击生成内容</li>
          </ul>
          <Button
            onClick={handleAiAction}
            disabled={isAiLoading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isAiLoading ? "AI工作中..." : "✨ 启动 AI 助手"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowConfigDialog(true)}
            className="w-full mt-2"
          >
            ⚙️ AI 配置
          </Button>
        </div>

        <div className="mt-6 p-3 bg-[#1e1e1e] rounded-lg">
          <h4 className="text-white mb-2">使用说明</h4>
          <ul className="text-gray-500 text-xs list-disc list-inside leading-relaxed">
            <li>点击侧边栏添加节点</li>
            <li>拖拽连接点连线</li>
            <li>点击节点删除</li>
          </ul>
        </div>
      </div>

      <AiConfigDialog
        isOpen={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
      />
      <AiRecommendDialog
        isOpen={showRecommendDialog}
        onClose={() => setShowRecommendDialog(false)}
      />
      <AiGenerateDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
      />
    </div>
  );
}

function NodeCard({
  title,
  desc,
  titleColor,
  onClick,
}: {
  title: string;
  desc: string;
  titleColor: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-3 bg-[#1e1e1e] rounded-lg mb-2 cursor-pointer border border-[#333] hover:border-gray-500 transition-colors"
    >
      <div className={`font-bold ${titleColor}`}>{title}</div>
      <div className="text-xs text-gray-500">{desc}</div>
    </div>
  );
}

export { useFlowStore };
export default FlowEditor;
