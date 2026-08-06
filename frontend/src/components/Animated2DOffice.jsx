import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Animated2DOffice({
  scene,
  isSpeaking,
  dialogueText,
  onOptionSelect,
  selectedOptionId,
  isFeedbackMode,
}) {
  const canvasRef = useRef(null);
  const [displayedText, setDisplayedText] = useState("");
  const [mentorPose, setMentorPose] = useState("sitting");

  // Trigger confetti when correct feedback option is selected
  useEffect(() => {
    if (isFeedbackMode && selectedOptionId === "A") {
      setMentorPose("celebrating");
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#ffc700", "#00d2ff", "#ffffff"],
      });
    } else if (isSpeaking) {
      setMentorPose("speaking");
    } else {
      setMentorPose("sitting");
    }
  }, [isFeedbackMode, selectedOptionId, isSpeaking]);

  // Typewriter effect for dialogue
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

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
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
  }, [scene?.principleId]);

  return (
    <div className="animated-2d-office-environment" style={{ background: scene?.bgGradient || "#060c18" }}>
      {/* 2D Canvas Ambient Layer */}
      <div className="ambient-canvas-wrapper">
        <canvas ref={canvasRef} className="ambient-particles-canvas" />
      </div>

      {/* Location Tag */}
      <motion.div
        className="office-location-tag"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        key={scene?.location}
      >
        📍 {scene?.location || "VEON Global Office"}
      </motion.div>

      {/* 2D Office Stage Scene */}
      <div className="office-2d-stage">
        {/* Office Window & Skyline */}
        <div className="office-bg-window">
          <div className="skyline-glow"></div>
          <div className="window-frame"></div>
        </div>

        {/* 2D Furniture Layer */}
        <div className="furniture-layer">
          <div className="office-desk">
            <div className="laptop-device">
              <div className="laptop-screen glowing"></div>
            </div>
            <div className="desk-lamp">💡</div>
            <div className="office-plant">🪴</div>
          </div>
          <div className="executive-chair"></div>
        </div>

        {/* Animated 2D Mentor Character */}
        <motion.div
          className={`mentor-character-node ${isSpeaking ? "speaking" : ""}`}
          initial={{ x: -180, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            y: mentorPose === "speaking" ? [0, -4, 0] : 0,
          }}
          transition={{
            x: { duration: 0.7, ease: "easeOut" },
            y: { repeat: mentorPose === "speaking" ? Infinity : 0, duration: 1.4 },
          }}
          key={scene?.principleId}
        >
          <div className="mentor-headshot-box">
            <img src="/kaan_avatar.jpg" alt="Kaan Mentor" className="mentor-avatar-img" />

            {/* Speaking Audio Equalizer */}
            {isSpeaking && (
              <div className="speech-wave-indicator">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          <div className="mentor-nametag-pill">
            <span className="live-dot green"></span>
            <span>Kaan Terzioğlu • VEON Leader</span>
          </div>
        </motion.div>
      </div>

      {/* Visual Novel Typewriter Dialogue Box */}
      <motion.div
        className="visual-novel-card-2d"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="vn-card-header">
          <span className="speaker-title">AI LEADERSHIP MENTOR</span>
          <span className="scene-phase-badge">{scene?.sceneTitle}</span>
        </div>

        <p className="vn-dialogue-body">
          {displayedText}
          <span className="cursor-blink">|</span>
        </p>

        {/* Scenario Choice Cards Overlay */}
        {scene?.choices && !isFeedbackMode && (
          <AnimatePresence>
            <motion.div
              className="choices-flex-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {scene.choices.map((choice) => (
                <motion.button
                  key={choice.id}
                  className={`choice-card-item ${selectedOptionId === choice.id ? "active-selected" : ""}`}
                  onClick={() => onOptionSelect(choice)}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="choice-badge-icon">{choice.id}</span>
                  <span className="choice-text-content">{choice.text}</span>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
