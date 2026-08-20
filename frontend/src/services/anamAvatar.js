import { unsafe_createClientWithApiKey } from "@anam-ai/js-sdk";

/**
 * Anam API Avatar Service Integration
 * Handles WebRTC Avatar session initialization, speech synthesis, and real-time avatar interaction.
 */

// One narrator for the whole experience. Every utterance — principle briefing,
// scenario dialogue, choice feedback, completion — uses these exact settings, so
// the mentor never changes voice mid-journey.
const SPEECH_RATE = 1.0;
const SPEECH_PITCH = 0.95;

class AnamAvatarService {
  constructor() {
    this.apiKey = import.meta.env.VITE_ANAM_API_KEY || "";
    this.personaId = import.meta.env.VITE_ANAM_PERSONA_ID || "kaan-veon-leader";
    this.client = null;
    this.session = null;
    this.isSpeaking = false;
    this.onStateChangeCallbacks = [];
    this.voice = null;
    // Warm the voice list up front. The browser loads it asynchronously, and an
    // utterance created before it is ready silently falls back to the system
    // default — which is what made the briefing sound different to everything else.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this._resolveVoice();
    }
  }

  _loadVoices() {
    return new Promise((resolve) => {
      const ready = window.speechSynthesis.getVoices();
      if (ready.length) return resolve(ready);

      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        clearTimeout(timer);
        resolve(window.speechSynthesis.getVoices());
      };
      // Some browsers never fire the event; don't block speech forever.
      const timer = setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        resolve(window.speechSynthesis.getVoices());
      }, 1500);

      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    });
  }

  async _resolveVoice() {
    if (this.voice) return this.voice;

    const voices = await this._loadVoices();
    
    // Filter to only English voices first to avoid matching "Natural" or "Male"
    // voices from other languages (e.g. Windows "Microsoft Katja Online (Natural) - German")
    const englishVoices = voices.filter(v => v.lang && v.lang.startsWith("en"));

    this.voice =
      englishVoices.find(
        (v) =>
          v.name.includes("Natural") ||
          v.name.includes("Male") ||
          v.name.includes("David") ||
          v.name.includes("Google US English")
      ) ||
      englishVoices[0] ||
      voices[0] ||
      null;

    return this.voice;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  onStateChange(callback) {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((cb) => cb !== callback);
    };
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

  async speak(text) {
    this.isSpeaking = true;
    this._notifyStateChange({ isSpeaking: true });

    if (this.session && typeof this.session.talk === "function") {
      try {
        await this.session.talk(text);
      } finally {
        this.isSpeaking = false;
        this._notifyStateChange({ isSpeaking: false });
      }
    } else if ("speechSynthesis" in window) {
      // Resolve the voice before building the utterance, otherwise an early call
      // gets an empty voice list and the browser picks its own default.
      const voice = await this._resolveVoice();

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATE;
      utterance.pitch = SPEECH_PITCH;
      if (voice) utterance.voice = voice;

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
      }, Math.max(2000, (text.length * 50) / SPEECH_RATE));
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
