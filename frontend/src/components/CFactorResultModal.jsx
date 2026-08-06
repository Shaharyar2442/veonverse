import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Award, CheckCircle2, Shield, Star } from "lucide-react";
import { useEffect } from "react";

export default function CFactorResultModal({
  isOpen,
  selectedChoice,
  scenario,
  onNextStage,
}) {
  useEffect(() => {
    if (isOpen && selectedChoice?.stars === 3) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#ffc700", "#00d2ff", "#ffffff"],
      });
    }
  }, [isOpen, selectedChoice]);

  if (!isOpen || !selectedChoice) return null;

  const isHighImpact = selectedChoice.stars === 3;

  return (
    <AnimatePresence>
      <div className="cfactor-modal-backdrop">
        <motion.div
          className="cfactor-result-card"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Header & Stars Rating */}
          <div className="result-header">
            <span className="result-stage-tag">{scenario.stageName} Complete</span>
            <h2 className="result-title">
              {isHighImpact ? "High-Impact Leadership Decision!" : "Baseline Scenario Response"}
            </h2>

            <div className="stars-rating-row">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15 * i, type: "spring", stiffness: 200 }}
                >
                  <Star
                    size={32}
                    className={i < selectedChoice.stars ? "star-active" : "star-inactive"}
                    fill={i < selectedChoice.stars ? "#ffc700" : "transparent"}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Feedback Body */}
          <div className="result-body">
            <div className="feedback-speech-box">
              <span className="mentor-tag">AI LEADER FEEDBACK</span>
              <p className="feedback-text">{selectedChoice.feedback}</p>
            </div>

            {/* Assessment Metrics Block */}
            <div className="metrics-grid-2col">
              <div className="metric-box">
                <span className="m-label">
                  <Shield size={14} className="icon-cyan" /> Psychometric Balance
                </span>
                <span className="m-val">{scenario.psychometricTension}</span>
              </div>

              <div className="metric-box">
                <span className="m-label">
                  <Award size={14} className="icon-gold" /> Target Hogan Competency
                </span>
                <span className="m-val">{scenario.hoganTarget}</span>
              </div>
            </div>

            {/* Unlocked Badge Banner */}
            {selectedChoice.badge && (
              <motion.div
                className="badge-unlocked-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CheckCircle2 size={24} className="icon-check" />
                <div className="badge-meta">
                  <span className="b-sub">UNLOCKED COMPETENCY BADGE</span>
                  <strong className="b-name">{selectedChoice.badge}</strong>
                </div>
                <span className="xp-gain-badge">+{selectedChoice.score} XP</span>
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          <div className="result-footer">
            <button className="btn-next-stage" onClick={onNextStage}>
              Proceed to Next Stage ➔
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
