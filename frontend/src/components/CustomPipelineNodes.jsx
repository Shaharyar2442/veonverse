import { Handle, Position } from "@xyflow/react";
import { Cpu, Database, MessageSquare, Sparkles, Zap } from "lucide-react";

function BaseNode({ id, label, icon: Icon, status, duration, subtitle, badgeText, selected, onClick, children }) {
  const statusClass = status === "processing" ? "processing" : status === "success" ? "success" : status === "error" ? "error" : "idle";

  return (
    <div className={`custom-2d-pipeline-node ${statusClass} ${selected ? "selected-node" : ""}`} onClick={() => onClick(id)}>
      <Handle type="target" position={Position.Left} className="node-handle target-handle" />
      
      <div className="node-top-bar">
        <div className="node-icon-box">
          <Icon className="node-lucide-icon" size={16} />
        </div>
        <div className="node-title-group">
          <span className="node-label">{label}</span>
          <span className="node-subtitle">{subtitle}</span>
        </div>
        {badgeText && <span className="node-badge-tag">{badgeText}</span>}
      </div>

      {children && <div className="node-body-content">{children}</div>}

      <div className="node-footer-bar">
        <div className={`status-indicator-pill ${statusClass}`}>
          <span className="status-dot"></span>
          <span className="status-text">{status.toUpperCase()}</span>
        </div>
        {duration > 0 && <span className="latency-timer">{duration}ms</span>}
      </div>

      {status === "processing" && (
        <div className="micro-progress-bar">
          <div className="progress-fill"></div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="node-handle source-handle" />
    </div>
  );
}

export function QueryNode({ id, data, selected }) {
  return (
    <BaseNode
      id={id}
      label="User Query"
      subtitle="Input Prompt & Context"
      icon={MessageSquare}
      status={data.status}
      duration={data.duration}
      badgeText="Input"
      selected={selected}
      onClick={data.onSelectNode}
    >
      <p className="node-snippet-text">{data.payload?.query || data.query || "Waiting for query..."}</p>
    </BaseNode>
  );
}

export function EmbeddingNode({ id, data, selected }) {
  return (
    <BaseNode
      id={id}
      label="Query Embedding"
      subtitle="SentenceTransformers MiniLM"
      icon={Cpu}
      status={data.status}
      duration={data.duration}
      badgeText="384 Dim"
      selected={selected}
      onClick={data.onSelectNode}
    >
      <div className="vector-snippet-box">
        <span className="code-tag">Vector Payload:</span>
        <code className="vector-code">[0.042, -0.118, 0.285, ...]</code>
      </div>
    </BaseNode>
  );
}

export function VectorSearchNode({ id, data, selected }) {
  return (
    <BaseNode
      id={id}
      label="Vector RAG Search"
      subtitle="pgvector / SQLite Cosine"
      icon={Database}
      status={data.status}
      duration={data.duration}
      badgeText={data.payload?.matches ? `${data.payload.topK} Chunks` : "Vector DB"}
      selected={selected}
      onClick={data.onSelectNode}
    >
      {data.payload?.matches && (
        <div className="match-scores-preview">
          <span className="score-pill">Match 94.2%</span>
          <span className="score-pill">Match 89.5%</span>
        </div>
      )}
    </BaseNode>
  );
}

export function LLMNode({ id, data, selected }) {
  return (
    <BaseNode
      id={id}
      label="LLM Inference"
      subtitle="llama-3.3-70b-versatile"
      icon={Zap}
      status={data.status}
      duration={data.duration}
      badgeText="Groq AI"
      selected={selected}
      onClick={data.onSelectNode}
    >
      <p className="node-snippet-text">{data.payload?.rawResponse?.slice(0, 75) || "Generating tokens..."}</p>
    </BaseNode>
  );
}

export function OutputNode({ id, data, selected }) {
  return (
    <BaseNode
      id={id}
      label="Formatted Output"
      subtitle="Avatar Speech & RAG Drawer"
      icon={Sparkles}
      status={data.status}
      duration={data.duration}
      badgeText="Response"
      selected={selected}
      onClick={data.onSelectNode}
    >
      <p className="node-snippet-text">{data.payload?.text?.slice(0, 80) || "Waiting for pipeline..."}</p>
    </BaseNode>
  );
}
