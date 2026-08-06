import * as PIXI from "pixi.js";
import { useEffect, useRef, useState } from "react";

export default function PixiStoryCanvas({
  scene,
  isSpeaking,
  dialogueText,
  onOptionSelect,
  selectedOptionId,
  isFeedbackMode,
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const [displayedText, setDisplayedText] = useState("");

  // Typewriter effect for dialogue text
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
    }, 18);
    return () => clearInterval(interval);
  }, [dialogueText]);

  // PixiJS 2D Canvas WebGL Stage Setup
  useEffect(() => {
    const parentContainer = containerRef.current;
    if (!parentContainer) return;

    let app;
    let isDestroyed = false;

    async function initPixi() {
      app = new PIXI.Application();
      await app.init({
        resizeTo: parentContainer,
        backgroundAlpha: 0,
        antialias: true,
      });

      if (isDestroyed) {
        app.destroy(true);
        return;
      }

      appRef.current = app;
      parentContainer.appendChild(app.canvas);

      // Create animated 2D background particles in PixiJS stage
      const particleContainer = new PIXI.Container();
      app.stage.addChild(particleContainer);

      const particles = [];
      for (let i = 0; i < 40; i++) {
        const p = new PIXI.Graphics();
        p.circle(0, 0, Math.random() * 3 + 1);
        p.fill({ color: 0xffc700, alpha: Math.random() * 0.5 + 0.2 });
        p.x = Math.random() * app.screen.width;
        p.y = Math.random() * app.screen.height;
        p.vy = (Math.random() - 0.5) * 0.5;
        p.vx = (Math.random() - 0.5) * 0.5;
        particleContainer.addChild(p);
        particles.push(p);
      }

      // PixiJS Ticker for 60 FPS 2D animation loop
      app.ticker.add(() => {
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = app.screen.width;
          if (p.x > app.screen.width) p.x = 0;
          if (p.y < 0) p.y = app.screen.height;
          if (p.y > app.screen.height) p.y = 0;
        });
      });
    }

    initPixi();

    return () => {
      isDestroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [scene?.principleId]);

  return (
    <div className="pixi-story-canvas" style={{ background: scene?.bgGradient || "#060c18" }}>
      {/* PixiJS WebGL Canvas Mounting Container */}
      <div ref={containerRef} className="pixi-stage-container" />

      {/* Decorative Location Overlay */}
      <div className="pixi-location-badge">📍 {scene?.location || "VEON Operations Hub"}</div>

      {/* 2D Animated Character Stage */}
      <div className={`avatar-2d-stage ${isSpeaking ? "speaking" : ""}`}>
        <div className="avatar-2d-glow"></div>
        <div className="avatar-portrait-frame">
          <img src="/kaan_avatar.jpg" alt="2D Leader Avatar" className="avatar-2d-img" />
          
          {/* Audio Wave Visualizer */}
          {isSpeaking && (
            <div className="equalizer-wave">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        <div className="avatar-name-tag">
          <span className="live-dot"></span>
          <span>Kaan Terzioğlu • VEON Leader</span>
        </div>
      </div>

      {/* Visual Novel Dialogue & Choice Box */}
      <div className="visual-novel-dialogue-box">
        <div className="dialogue-header">
          <span className="speaker-name">AI LEADERSHIP MENTOR</span>
          <span className="step-tag">{scene?.sceneTitle}</span>
        </div>

        <p className="dialogue-text">
          {displayedText}
          <span className="typewriter-cursor">|</span>
        </p>

        {/* Scenario Choice Overlay */}
        {scene?.choices && !isFeedbackMode && (
          <div className="scenario-choices-grid">
            {scene.choices.map((choice) => (
              <button
                key={choice.id}
                className={`choice-card-2d ${selectedOptionId === choice.id ? "selected" : ""}`}
                onClick={() => onOptionSelect(choice)}
              >
                <div className="choice-badge">{choice.id}</div>
                <div className="choice-body">
                  <p>{choice.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
