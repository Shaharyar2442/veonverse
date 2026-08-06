import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";

export default function RagChatDrawer({
  isOpen,
  onClose,
  query,
  responseOutput,
  retrievedSources,
  onRunPipeline,
  isExecuting,
}) {
  const [inputQuery, setInputQuery] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    onRunPipeline(inputQuery.trim());
    setInputQuery("");
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        className="rag-chat-drawer-panel"
        initial={{ x: 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="drawer-header">
          <div className="header-title">
            <Sparkles size={18} className="gold-icon" />
            <h3>RAG Execution Console</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Active Query Display */}
          <div className="query-display-card">
            <span className="card-label">Active Query</span>
            <p className="query-text">"{query}"</p>
          </div>

          {/* Retrieved Vector Context Chunks */}
          {retrievedSources.length > 0 && (
            <div className="sources-block">
              <div className="block-header">
                <BookOpen size={14} />
                <span>Retrieved Context Chunks ({retrievedSources.length})</span>
              </div>
              <div className="sources-list">
                {retrievedSources.map((src, idx) => (
                  <div key={idx} className="source-item">
                    <div className="source-item-top">
                      <span className="chunk-tag">Chunk #{src.chunkId}</span>
                      <span className="similarity-tag">{(src.score * 100).toFixed(1)}% Match</span>
                    </div>
                    <p className="chunk-desc">
                      Official Principle Knowledge Base ({src.chunkType})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatted Response Output */}
          <div className="response-output-block">
            <span className="block-label">LLM Generated Response (Groq llama-3.3-70b)</span>
            <div className="response-content-box">
              {isExecuting ? (
                <div className="streaming-placeholder">
                  <span className="pulse-dot"></span> Generating response tokens...
                </div>
              ) : (
                <p className="response-text">{responseOutput || "Run pipeline to generate response..."}</p>
              )}
            </div>
          </div>
        </div>

        {/* Input Form at Bottom of Drawer */}
        <form className="drawer-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Type a new query to run pipeline..."
            disabled={isExecuting}
          />
          <button type="submit" disabled={isExecuting || !inputQuery.trim()}>
            <Send size={16} />
          </button>
        </form>
      </motion.aside>
    </AnimatePresence>
  );
}
