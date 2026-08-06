import { AlignLeft, Layers, Map, Play, Sparkles } from "lucide-react";

export default function ControlDock({
  onRunPipeline,
  isExecuting,
  selectedPrincipleId,
  onSelectPrinciple,
  showMinimap,
  onToggleMinimap,
  onToggleChatDrawer,
  showChatDrawer,
}) {
  return (
    <div className="control-dock-bar">
      {/* Principle Context Selector */}
      <div className="dock-group">
        <span className="dock-label">Principle Context:</span>
        <select
          className="dock-select"
          value={selectedPrincipleId}
          onChange={(e) => onSelectPrinciple(Number(e.target.value))}
          disabled={isExecuting}
        >
          <option value={1}>#1. Clarity is Our Superpower</option>
          <option value={2}>#2. Our Pioneering Spirit Defines Us</option>
          <option value={3}>#3. We Fight Against Mediocrity</option>
          <option value={4}>#4. We Put Results Above Rituals</option>
          <option value={5}>#5. We Hire for Potential and Drive</option>
          <option value={6}>#6. Courage Fuels Our Leadership</option>
          <option value={7}>#7. We Aim for Audacious Impact</option>
          <option value={8}>#8. We Incentivize with Integrity</option>
          <option value={9}>#9. We Stand Strong Together</option>
          <option value={10}>#10. We Never Give Up</option>
        </select>
      </div>

      <div className="dock-divider"></div>

      {/* Main Run Execution Action */}
      <button
        className={`dock-btn-primary ${isExecuting ? "running" : ""}`}
        onClick={() => onRunPipeline()}
        disabled={isExecuting}
      >
        {isExecuting ? (
          <>
            <span className="spinner-dot"></span> Executing RAG...
          </>
        ) : (
          <>
            <Play size={16} className="play-icon" /> Run Pipeline
          </>
        )}
      </button>

      <div className="dock-divider"></div>

      {/* Canvas Controls */}
      <div className="dock-tools-group">
        <button className="dock-tool-btn" onClick={onToggleMinimap} title="Toggle Minimap">
          <Map size={16} color={showMinimap ? "#ffc700" : "#94a3b8"} />
          <span>Minimap</span>
        </button>

        <button className={`dock-tool-btn ${showChatDrawer ? "active" : ""}`} onClick={onToggleChatDrawer} title="Toggle RAG Chat Drawer">
          <Sparkles size={16} color={showChatDrawer ? "#ffc700" : "#94a3b8"} />
          <span>RAG Drawer</span>
        </button>
      </div>
    </div>
  );
}
