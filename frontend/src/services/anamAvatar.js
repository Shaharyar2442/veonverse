import { unsafe_createClientWithApiKey, createClient, AnamEvent } from "@anam-ai/js-sdk";

/**
 * Anam API Avatar Service Integration
 * Handles WebRTC Avatar session initialization, speech synthesis, and real-time avatar interaction.
 */

class AnamAvatarService {
  constructor() {
    this.apiKey = import.meta.env.VITE_ANAM_API_KEY || "";
    this.personaId = import.meta.env.VITE_ANAM_PERSONA_ID || "kaan-veon-leader";
    this.client = null;
    this.session = null;
    this.isSpeaking = false;
    this.onStateChangeCallbacks = [];
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  onStateChange(callback) {
    this.onStateChangeCallbacks.push(callback);
  }

  _notifyStateChange(state) {
    this.onStateChangeCallbacks.forEach((cb) => cb(state));
  }

  async initializeSession(videoElement) {
    if (!this.isConfigured()) {
      console.log("Anam API key not detected. Operating in simulation mode.");
      return false;
    }

    try {
      if (typeof unsafe_createClientWithApiKey === "function") {
        this.client = unsafe_createClientWithApiKey(this.apiKey, {
          personaId: this.personaId,
        });

        if (this.client && typeof this.client.stream === "function") {
          this.session = await this.client.stream(videoElement);
          this._notifyStateChange({ isConnected: true, status: "ready" });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn("Anam API Session Connect Note:", err.message || err);
      this._notifyStateChange({ isConnected: false, error: err.message });
      return false;
    }
  }

  async speak(text, fallbackVoice = true) {
    this.isSpeaking = true;
    this._notifyStateChange({ isSpeaking: true });

    if (this.session && typeof this.session.talk === "function") {
      try {
        await this.session.talk(text);
      } catch (err) {
        console.error("Anam session talk error:", err);
      }
    } else if (fallbackVoice && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.name.includes("Natural") || v.name.includes("Male") || v.name.includes("David") || v.name.includes("Google US English")
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        this.isSpeaking = false;
        this._notifyStateChange({ isSpeaking: false });
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        this._notifyStateChange({ isSpeaking: false });
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        this.isSpeaking = false;
        this._notifyStateChange({ isSpeaking: false });
      }, Math.max(2000, text.length * 50));
    }
  }

  stop() {
    this.isSpeaking = false;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this._notifyStateChange({ isSpeaking: false });
  }
}

export const anamAvatar = new AnamAvatarService();
