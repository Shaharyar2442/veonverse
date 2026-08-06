import { motion } from "framer-motion";
import { Award, Clock, Volume2, VolumeX, Zap } from "lucide-react";

export default function CFactorHeaderHUD({
  currentStageIndex,
  totalStages,
  score,
  currentPrincipleTitle,
  isMuted,
  onToggleMute,
  onReplayAudio,
}) {
  return (
    <header className="cfactor-header-hud">
      {/* Brand & Game Logo */}
      <div className="cfactor-brand">
        <div className="cfactor-logo-symbol">V</div>
        <div className="cfactor-brand-title">
          <span className="name-veon">VEON<span className="gold">VERSE</span></span>
          <span className="name-cfactor">C-FACTOR GAMIFIED ASSESSMENT</span>
        </div>
      </div>

      {/* Stage Progress Tracker */}
      <div className="cfactor-stage-tracker">
        <div className="tracker-top">
          <span className="stage-num-badge">Stage {currentStageIndex + 1} of {totalStages}</span>
          <span className="principle-name-tag">{currentPrincipleTitle}</span>
        </div>
        <div className="stage-progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentStageIndex + 1) / totalStages) * 100}%` }}
          />
        </div>
      </div>

      {/* Score & Energy Meter Badges */}
      <div className="cfactor-hud-meters">
        <motion.div
          className="hud-meter-pill gold"
          whileHover={{ scale: 1.05 }}
        >
          <Award size={16} className="icon-gold" />
          <span className="meter-label">Leadership Score</span>
          <span className="meter-val">{score}</span>
        </motion.div>

        <div className="hud-meter-pill cyan">
          <Zap size={16} className="icon-cyan" />
          <span className="meter-label">Energy</span>
          <span className="meter-val">100%</span>
        </div>

        <div className="hud-meter-pill">
          <Clock size={16} className="icon-dim" />
          <span className="meter-label">Timer</span>
          <span className="meter-val">0:45</span>
        </div>

        {/* Audio Controls */}
        <button className="hud-ctrl-btn" onClick={onReplayAudio} title="Replay Voice">
          <Volume2 size={16} />
        </button>
        <button className="hud-ctrl-btn" onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="active-wave" />}
        </button>
      </div>
    </header>
  );
}
