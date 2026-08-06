import { useEffect, useState } from "react";

export default function StoryCanvas({
  scene,
  avatarState,
  isSpeaking,
  dialogueText,
  onOptionSelect,
  selectedOptionId,
  isFeedbackMode,
}) {
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

  return (
    <div className="story-canvas" style={{ background: scene?.bgGradient || "#060c18" }}>
      {/* Background Environment Decorative Layer */}
      <div className="environment-bg-decor">
        <div className="ambient-grid-lines"></div>
        <div className="location-badge">📍 {scene?.location || "VEON Global Office"}</div>
      </div>

      {/* 2D Avatar Stage Layer */}
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

      {/* Visual Novel Speech Bubble Layer */}
      <div className="visual-novel-dialogue-box">
        <div className="dialogue-header">
          <span className="speaker-name">AI LEADERSHIP MENTOR</span>
          <span className="step-tag">{scene?.sceneTitle}</span>
        </div>

        <p className="dialogue-text">
          {displayedText}
          <span className="typewriter-cursor">|</span>
        </p>

        {/* Interactive Scenario Choice Overlay */}
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
