import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Award, CheckCircle2, Shield, Star } from "lucide-react";
import { useEffect } from "react";

export default function StageCompleteModal({
  isOpen,
  selectedChoice,
  scenario,
  onNextStage,
}) {
  useEffect(() => {
    if (isOpen && selectedChoice?.stars === 3) {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.5 },
        colors: ["#ffc700", "#00d2ff", "#a855f7", "#ffffff"],
      });
    }
  }, [isOpen, selectedChoice]);

  if (!isOpen || !selectedChoice) return null;

  const isHighImpact = selectedChoice.stars === 3;
  const ptsGained = isHighImpact ? "+100 XP" : "+35 XP";

  return (
    <AnimatePresence>
      <div className="stage-complete-backdrop">
        <motion.div
          className="stage-complete-card"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Header & 3-Star Rating */}
          <div className="modal-top-header">
            <span className="stage-complete-tag">PRINCIPLE {scenario.principleTitle}</span>
            <h2 className="modal-title">
              {isHighImpact ? "High-Impact Leadership Choice!" : "Exploring Alternative Approaches"}
            </h2>

            <div className="stars-row">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15 * i, type: "spring", stiffness: 200 }}
                >
                  <Star
                    size={34}
                    className={i < selectedChoice.stars ? "star-gold" : "star-dim"}
                    fill={i < selectedChoice.stars ? "#ffc700" : "transparent"}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Feedback Body */}
          <div className="modal-body-content">
            <div className="executive-feedback-box">
              <span className="feedback-label">AI LEADER MENTOR INSIGHTS</span>
              <p className="feedback-body">{selectedChoice.feedback}</p>
            </div>

            {/* Assessment Metrics Block */}
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="m-title">
                  <Shield size={14} className="icon-cyan" /> Psychometric Balance
                </span>
                <span className="m-value">{scenario.psychometricTension}</span>
              </div>

              <div className="metric-card">
                <span className="m-title">
                  <Award size={14} className="icon-gold" /> Target Hogan Competency
                </span>
                <span className="m-value">{scenario.hoganTarget}</span>
              </div>
            </div>

            {/* Unlocked Competency Badge */}
            {selectedChoice.badge && (
              <motion.div
                className="unlocked-badge-row"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CheckCircle2 size={24} className="icon-check-gold" />
                <div className="badge-details">
                  <span className="b-label">UNLOCKED COMPETENCY BADGE</span>
                  <strong className="b-name">{selectedChoice.badge}</strong>
                </div>
                <span className="pts-badge-tag">{ptsGained}</span>
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          <div className="modal-footer-action">
            <button className="btn-continue-stage" onClick={onNextStage}>
              Explore Next Principle ➔
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
