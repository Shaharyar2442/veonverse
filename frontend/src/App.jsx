import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USER_ID = 1;
const PRINCIPLE_ID = 1;

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `Request failed: ${response.status}`);
  }
  return response.json();
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(null);
  const [badges, setBadges] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [reflectionInput, setReflectionInput] = useState("");
  const [mentorQuestion, setMentorQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentStep = progress?.progress?.find((p) => p.principle_id === PRINCIPLE_ID);
  const stepIndicator = `${currentStep?.step_number || 1} / 6`;

  const latestLessonMessage = useMemo(
    () => [...messages].reverse().find((m) => m.kind === "lesson"),
    [messages]
  );

  async function refreshProgressAndBadges() {
    const [progressData, badgesData] = await Promise.all([
      api(`/users/${USER_ID}/progress`),
      api(`/users/${USER_ID}/badges`),
    ]);
    setProgress(progressData);
    setBadges(badgesData.badges || []);
  }

  useEffect(() => {
    refreshProgressAndBadges().catch((err) => setError(err.message));
  }, []);

  async function handleNextLesson(input = null) {
    setLoading(true);
    setError("");
    try {
      const payload = { user_id: USER_ID, user_input: input };
      const result = await api(`/lessons/${PRINCIPLE_ID}/next`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessages((prev) => [
        ...prev,
        {
          kind: "lesson",
          role: "assistant",
          text: result.text,
          options: result.options,
          avatarState: result.avatar_state,
          step: result.step,
        },
      ]);
      setSelectedOption("");
      await refreshProgressAndBadges();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function submitSelectedOption() {
    if (!selectedOption) return;
    setMessages((prev) => [...prev, { kind: "lesson", role: "user", text: selectedOption }]);
    await handleNextLesson(selectedOption);
  }

  async function submitReflection() {
    if (!reflectionInput.trim()) return;
    const reflection = reflectionInput.trim();
    setMessages((prev) => [...prev, { kind: "lesson", role: "user", text: reflection }]);
    setReflectionInput("");
    await handleNextLesson(reflection);
  }

  async function askMentor() {
    if (!mentorQuestion.trim()) return;
    const question = mentorQuestion.trim();
    setLoading(true);
    setError("");
    setMessages((prev) => [...prev, { kind: "mentor", role: "user", text: question }]);
    setMentorQuestion("");
    try {
      const result = await api("/mentor/ask", {
        method: "POST",
        body: JSON.stringify({
          user_id: USER_ID,
          question,
          principle_id: PRINCIPLE_ID,
        }),
      });
      setMessages((prev) => [
        ...prev,
        {
          kind: "mentor",
          role: "assistant",
          text: result.text,
          avatarState: result.avatar_state,
          sources: result.sources,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      refreshProgressAndBadges().catch(() => undefined);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>VEONVERSE AI Leadership Mentor</h1>
        <div className="stats">
          <span>XP: {progress?.xp ?? 0}</span>
          <span>Step: {stepIndicator}</span>
          <span>Badges: {badges.length}</span>
        </div>
      </header>

      <main className="content">
        <section className="panel chat">
          <div className="chat-header">
            <h2>Lesson + Mentor Chat</h2>
            <button onClick={() => handleNextLesson()} disabled={loading}>
              Advance Lesson
            </button>
          </div>
          <div className="messages">
            {messages.map((message, idx) => (
              <div key={idx} className={`bubble ${message.role === "user" ? "user" : "mentor"}`}>
                <div className="meta">
                  <strong>{message.role === "user" ? "You" : "Mentor"}</strong>
                  {message.avatarState ? <em>{message.avatarState}</em> : null}
                </div>
                <p>{message.text}</p>
                {message.sources?.length ? (
                  <small>Retrieved Chunks: {message.sources.join(", ")}</small>
                ) : null}
              </div>
            ))}
          </div>

          {latestLessonMessage?.options?.length === 4 ? (
            <div className="actions">
              <h3>Select a scenario option</h3>
              <div className="option-grid">
                {latestLessonMessage.options.map((option, idx) => (
                  <button
                    key={idx}
                    className={selectedOption === option ? "selected" : ""}
                    onClick={() => setSelectedOption(option)}
                    disabled={loading}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button onClick={submitSelectedOption} disabled={loading || !selectedOption}>
                Submit Option
              </button>
            </div>
          ) : null}

          {latestLessonMessage?.step === "reflection" ? (
            <div className="actions">
              <h3>Your Reflection</h3>
              <textarea
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                placeholder="Write your reflection..."
              />
              <button onClick={submitReflection} disabled={loading || !reflectionInput.trim()}>
                Submit Reflection
              </button>
            </div>
          ) : null}

          <div className="actions">
            <h3>Ask the Mentor</h3>
            <div className="mentor-row">
              <input
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
                placeholder="Ask a principle-related question..."
              />
              <button onClick={askMentor} disabled={loading || !mentorQuestion.trim()}>
                Ask
              </button>
            </div>
          </div>
        </section>

        <section className="panel badges">
          <h2>Earned Badges</h2>
          {badges.length === 0 ? (
            <p>No badges yet.</p>
          ) : (
            <ul>
              {badges.map((badge) => (
                <li key={`${badge.badge_id}-${badge.earned_at}`}>
                  <strong>{badge.name}</strong>
                  <p>{badge.criteria}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
