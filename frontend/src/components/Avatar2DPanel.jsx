import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { anamAvatar } from "../services/anamAvatar";

export default function Avatar2DPanel({ avatarState, currentText, isExecuting }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    anamAvatar.onStateChange((state) => {
      if (state.isSpeaking !== undefined) setIsSpeaking(state.isSpeaking);
    });
  }, []);

  useEffect(() => {
    if (currentText && !isMuted && avatarState === "speaking") {
      anamAvatar.speak(currentText);
    }
  }, [currentText, isMuted, avatarState]);

  function toggleMute() {
    if (isMuted) {
      setIsMuted(false);
      if (currentText) anamAvatar.speak(currentText);
    } else {
      anamAvatar.stop();
      setIsMuted(true);
    }
  }

  function replayAudio() {
    if (currentText) {
      setIsMuted(false);
      anamAvatar.speak(currentText);
    }
  }

  return (
    <motion.div
      className="avatar-2d-panel-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* 2D Vector Avatar Stage */}
      <div className="avatar-2d-viewport">
        {/* Orbital Thinking Ring (Active during processing) */}
        {isExecuting && (
          <motion.div
            className="orbital-thinking-ring"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <div className="orbital-dot dot1"></div>
            <div className="orbital-dot dot2"></div>
            <div className="orbital-dot dot3"></div>
          </motion.div>
        )}

        {/* Ambient Halo Glow */}
        <div className={`avatar-aura-glow ${isSpeaking ? "speaking-aura" : isExecuting ? "thinking-aura" : ""}`} />

        {/* Vector SVG 2D Character Frame */}
        <motion.div
          className="avatar-svg-container"
          animate={{
            y: isSpeaking ? [0, -3, 0] : [0, -2, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: isSpeaking ? 1.2 : 3,
            ease: "easeInOut",
          }}
        >
          <div className="avatar-portrait-ring">
            <img src="/kaan_avatar.jpg" alt="2D Leader Avatar" className="avatar-2d-portrait" />

            {/* Speaking Audio Equalizer Wave Overlay */}
            {isSpeaking && (
              <div className="avatar-audio-equalizer">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Avatar Status Badge */}
        <div className="avatar-status-pill">
          <span className={`status-dot-indicator ${isExecuting ? "thinking" : isSpeaking ? "speaking" : "idle"}`} />
          <span className="status-label">
            {isExecuting ? "Processing RAG Pipeline..." : isSpeaking ? "Speaking Response" : "AI Leader Avatar • Ready"}
          </span>
        </div>

        {/* Audio Mute & Replay Controls */}
        <div className="avatar-audio-controls">
          <button className="ctrl-icon-btn" onClick={replayAudio} title="Replay Avatar Voice">
            🔊
          </button>
          <button className="ctrl-icon-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? "🔇" : "🎙️"}
          </button>
        </div>
      </div>

      {/* Avatar Header & Identity */}
      <div className="avatar-info-footer">
        <div className="avatar-title-block">
          <h3>Kaan Terzioğlu Avatar</h3>
          <p>VEON Executive Leadership Mentor</p>
        </div>
      </div>
    </motion.div>
  );
}
