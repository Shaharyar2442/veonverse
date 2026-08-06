import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import {
  EmbeddingNode,
  LLMNode,
  OutputNode,
  QueryNode,
  VectorSearchNode,
} from "./CustomPipelineNodes";

const initialNodes = [
  {
    id: "node-query",
    type: "queryNode",
    position: { x: 50, y: 140 },
    data: { label: "User Query", status: "idle", duration: 0 },
  },
  {
    id: "node-embed",
    type: "embeddingNode",
    position: { x: 340, y: 140 },
    data: { label: "Query Embedding", status: "idle", duration: 0 },
  },
  {
    id: "node-vector",
    type: "vectorSearchNode",
    position: { x: 630, y: 140 },
    data: { label: "Vector RAG Search", status: "idle", duration: 0 },
  },
  {
    id: "node-llm",
    type: "llmNode",
    position: { x: 920, y: 140 },
    data: { label: "LLM Inference", status: "idle", duration: 0 },
  },
  {
    id: "node-output",
    type: "outputNode",
    position: { x: 1210, y: 140 },
    data: { label: "Formatted Output", status: "idle", duration: 0 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "node-query", target: "node-embed", animated: true, style: { stroke: "#1e3a5f", strokeWidth: 2 } },
  { id: "e2-3", source: "node-embed", target: "node-vector", animated: true, style: { stroke: "#1e3a5f", strokeWidth: 2 } },
  { id: "e3-4", source: "node-vector", target: "node-llm", animated: true, style: { stroke: "#1e3a5f", strokeWidth: 2 } },
  { id: "e4-5", source: "node-llm", target: "node-output", animated: true, style: { stroke: "#1e3a5f", strokeWidth: 2 } },
];

export default function PipelineCanvas({ pipelineState, onSelectNode, showMinimap }) {
  const nodeTypes = useMemo(
    () => ({
      queryNode: QueryNode,
      embeddingNode: EmbeddingNode,
      vectorSearchNode: VectorSearchNode,
      llmNode: LLMNode,
      outputNode: OutputNode,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync ReactFlow nodes with pipelineState execution statuses
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const nodeState = pipelineState.nodes[node.id] || { status: "idle", duration: 0 };
        return {
          ...node,
          data: {
            ...node.data,
            query: pipelineState.query,
            status: nodeState.status,
            duration: nodeState.duration,
            payload: nodeState.payload,
            onSelectNode: () => onSelectNode(node.id),
          },
        };
      })
    );

    // Update edge animation glowing strokes based on active processing node
    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const sourceState = pipelineState.nodes[edge.source]?.status;
        const targetState = pipelineState.nodes[edge.target]?.status;
        const isEdgeActive = sourceState === "success" || targetState === "processing";

        return {
          ...edge,
          animated: isEdgeActive,
          style: {
            stroke: isEdgeActive ? "#ffc700" : "#1e3a5f",
            strokeWidth: isEdgeActive ? 3 : 2,
          },
        };
      })
    );
  }, [pipelineState, onSelectNode, setNodes, setEdges]);

  return (
    <div className="pipeline-canvas-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background variant="dots" gap={24} size={1.5} color="#162848" />
        <Controls className="react-flow-controls-custom" showInteractive={false} />
        {showMinimap && (
          <MiniMap
            className="react-flow-minimap-custom"
            nodeColor={(node) => {
              const status = pipelineState.nodes[node.id]?.status;
              return status === "processing" ? "#ffc700" : status === "success" ? "#10b981" : "#1e3a5f";
            }}
            maskColor="rgba(4, 8, 16, 0.8)"
          />
        )}
      </ReactFlow>
    </div>
  );
}
