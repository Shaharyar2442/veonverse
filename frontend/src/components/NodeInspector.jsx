import { AnimatePresence, motion } from "framer-motion";
import { Clock, Code, Database, X } from "lucide-react";

export default function NodeInspector({ nodeDetails, onClose }) {
  if (!nodeDetails) return null;

  const { nodeId, status, duration, payload } = nodeDetails;

  return (
    <AnimatePresence>
      <motion.aside
        className="node-inspector-drawer"
        initial={{ x: 340, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 340, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="inspector-header">
          <div className="title-group">
            <h3>Node Inspector</h3>
            <span className="node-id-tag">ID: {nodeId}</span>
          </div>
          <button className="close-inspector-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="inspector-body">
          {/* Status & Latency Block */}
          <div className="inspector-stat-card">
            <div className="stat-col">
              <span className="stat-label">Execution Status</span>
              <span className={`status-pill ${status}`}>{status.toUpperCase()}</span>
            </div>
            <div className="stat-col">
              <span className="stat-label">Latency</span>
              <span className="duration-pill">
                <Clock size={12} /> {duration} ms
              </span>
            </div>
          </div>

          {/* Node Payload Details */}
          {nodeId === "node-embed" && payload?.vectorSnippet && (
            <div className="inspector-block">
              <span className="block-title">
                <Code size={14} /> Vector Embedding Snippet (384-Dim)
              </span>
              <div className="vector-code-block">
                <pre>{JSON.stringify(payload.vectorSnippet, null, 2)}</pre>
              </div>
            </div>
          )}

          {nodeId === "node-vector" && payload?.matches && (
            <div className="inspector-block">
              <span className="block-title">
                <Database size={14} /> Vector RAG Search Results
              </span>
              <p className="sub-text">Search Engine: <strong>{payload.searchEngine}</strong></p>
              <div className="matches-list">
                {payload.matches.map((m, idx) => (
                  <div key={idx} className="match-item-card">
                    <span className="chunk-id">Chunk #{m.chunkId}</span>
                    <span className="similarity-badge">{(m.score * 100).toFixed(1)}% Match</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON Inspection */}
          <div className="inspector-block">
            <span className="block-title">Raw Execution Payload</span>
            <div className="raw-json-box">
              <pre>{JSON.stringify(payload || { status: "Awaiting execution..." }, null, 2)}</pre>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
