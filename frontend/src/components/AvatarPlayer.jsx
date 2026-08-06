import { useEffect, useRef, useState } from "react";
import { anamAvatar } from "../services/anamAvatar";

export default function AvatarPlayer({
  lastMessageText,
  avatarState,
  onOpenQuestionModal,
  onWatchVideoMessage,
}) {
  const videoRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiveStreamConnected, setIsLiveStreamConnected] = useState(false);

  useEffect(() => {
    anamAvatar.onStateChange((state) => {
      if (state.isSpeaking !== undefined) setIsSpeaking(state.isSpeaking);
      if (state.isConnected !== undefined) setIsLiveStreamConnected(state.isConnected);
    });

    if (videoRef.current) {
      anamAvatar.initializeSession(videoRef.current);
    }
  }, []);

  useEffect(() => {
    if (lastMessageText && !isMuted) {
      anamAvatar.speak(lastMessageText);
    }
  }, [lastMessageText, isMuted]);

  function toggleMute() {
    if (!isMuted) {
      anamAvatar.stop();
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (lastMessageText) {
        anamAvatar.speak(lastMessageText);
      }
    }
  }

  return (
    <div className="ask-kaan-widget">
      <div className="avatar-video-container">
        {isLiveStreamConnected ? (
          <video ref={videoRef} autoPlay playsInline className="anam-video-stream" />
        ) : (
          <div className={`avatar-portrait-wrapper ${isSpeaking ? "speaking" : ""}`}>
            <img src="/kaan_avatar.jpg" alt="Kaan Terzioğlu Avatar" className="avatar-portrait-img" />
            <div className="avatar-glow-overlay"></div>
            
            {/* Animated Audio Waves when avatar is speaking */}
            {isSpeaking && (
              <div className="audio-wave-bars">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        )}

        <div className="avatar-badge-tag">
          <span className="live-dot"></span>
          <span>{isSpeaking ? "Kaan is Speaking..." : avatarState || "AI Executive Leader"}</span>
        </div>

        <button className="mute-control-btn" onClick={toggleMute} title={isMuted ? "Unmute Avatar" : "Mute Avatar"}>
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="ask-kaan-body">
        <div className="ask-kaan-header">
          <h3>Ask Kaan</h3>
          <p>Ask questions about VEON Strategy, Leadership Principles and Culture.</p>
        </div>

        <div className="ask-kaan-actions">
          <button className="btn-watch-msg" onClick={onWatchVideoMessage}>
            <span className="play-icon">▶</span> Watch Message
          </button>
          <button className="btn-ask-q" onClick={onOpenQuestionModal}>
            <span className="msg-icon">💬</span> Ask Question
          </button>
        </div>

        <div className="popular-questions">
          <h4>Popular questions</h4>
          <ul>
            <li onClick={() => onOpenQuestionModal("What is VEON's purpose?")}>
              <span>What is VEON's purpose?</span>
              <span className="arrow">›</span>
            </li>
            <li onClick={() => onOpenQuestionModal("How do Leadership Principles help employees?")}>
              <span>How do Leadership Principles help employees?</span>
              <span className="arrow">›</span>
            </li>
            <li onClick={() => onOpenQuestionModal("What makes One VEON unique?")}>
              <span>What makes One VEON unique?</span>
              <span className="arrow">›</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
