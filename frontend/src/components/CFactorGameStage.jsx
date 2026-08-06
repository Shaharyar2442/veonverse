import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function CFactorGameStage({
  scenario,
  isSpeaking,
  dialogueText,
  onOptionSelect,
  selectedChoiceId,
}) {
  const canvasRef = useRef(null);
  const [displayedText, setDisplayedText] = useState("");

  // Typewriter effect for story text
  useEffect(() => {
    if (!dialogueText) return;
    setDisplayedText("");
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayedText(dialogueText.slice(0, idx));
      if (idx >= dialogueText.length) {
        clearInterval(interval);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [dialogueText]);

  // Bulletproof HTML5 2D Canvas Ambient Particle Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.15,
    }));

    function render() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 199, 0, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    }

    render();

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [scenario?.stageId]);

  return (
    <div className="cfactor-stage-viewport" style={{ background: scenario?.bgGradient || "#040810" }}>
      {/* 2D Canvas Particle Backdrop */}
      <div className="cfactor-canvas-backdrop">
        <canvas ref={canvasRef} className="cfactor-particles-canvas" />
      </div>

      {/* 2D City Skyline Background Layer */}
      <div className="cfactor-skyline-layer">
        <div className="city-silhouette"></div>
        <div className="location-chip">📍 {scenario?.locationTag || "VEON Global Hub"}</div>
      </div>

      {/* Main 2D Game Stage Center (2D Character + Dialogue HUD) */}
      <div className="cfactor-stage-main">
        {/* Prominent 2D Vector Avatar Character */}
        <motion.div
          className={`cfactor-avatar-node ${isSpeaking ? "speaking" : ""}`}
          initial={{ x: -160, opacity: 0 }}
          animate={{ x: 0, opacity: 1, y: isSpeaking ? [0, -4, 0] : 0 }}
          transition={{
            x: { duration: 0.7, ease: "easeOut" },
            y: { repeat: isSpeaking ? Infinity : 0, duration: 1.4 },
          }}
          key={scenario?.stageId}
        >
          <div className="avatar-vector-frame">
            <img src="/kaan_avatar.jpg" alt="2D Leader Avatar" className="avatar-vector-img" />

            {/* Audio Wave Visualizer */}
            {isSpeaking && (
              <div className="speech-wave-bar">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          <div className="avatar-name-badge">
            <span className="live-status-dot"></span>
            <span>Kaan Terzioğlu • VEON Leader</span>
          </div>
        </motion.div>

        {/* Narrative Dialogue Box & Interactive Scenario Cards */}
        <motion.div
          className="cfactor-dialogue-hud-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hud-card-header">
            <span className="hud-speaker-title">AI LEADERSHIP MENTOR</span>
            <span className="hud-stage-name">{scenario?.stageName}</span>
          </div>

          <p className="hud-dialogue-text">
            {displayedText}
            <span className="typewriter-blink">|</span>
          </p>

          {/* Interactive Decision Cards */}
          {scenario?.choices && (
            <AnimatePresence>
              <motion.div
                className="cfactor-decision-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {scenario.choices.map((choice) => (
                  <motion.button
                    key={choice.id}
                    className={`decision-card-btn ${selectedChoiceId === choice.id ? "selected" : ""}`}
                    onClick={() => onOptionSelect(choice)}
                    whileHover={{ scale: 1.02, x: 6 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="choice-badge-letter">{choice.id}</div>
                    <div className="choice-text-body">{choice.text}</div>
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
