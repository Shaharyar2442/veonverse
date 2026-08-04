import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const USER_ID = 1;

const STEP_NAMES = {
  1: "1. Workplace Story & Choice",
  2: "2. Mentor Feedback & Insights",
  3: "3. Core Principle Breakdown",
  4: "4. Practical Workplace Examples",
  5: "5. Personal Reflection & Action Plan",
  6: "6. Principle Mastery & Badge",
};

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
  const [principles, setPrinciples] = useState([]);
  const [activePrincipleId, setActivePrincipleId] = useState(1);
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(null);
  const [badges, setBadges] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [reflectionInput, setReflectionInput] = useState("");
  const [mentorQuestion, setMentorQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activePrinciple = useMemo(
    () => principles.find((p) => p.id === activePrincipleId) || principles[0],
    [principles, activePrincipleId]
  );

  const currentProgressItem = progress?.progress?.find((p) => p.principle_id === activePrincipleId);
  const currentStepNum = currentProgressItem?.step_number || 1;
  const currentStepName = STEP_NAMES[currentStepNum] || `Step ${currentStepNum} of 6`;

  const latestLessonMessage = useMemo(
    () => [...messages].reverse().find((m) => m.kind === "lesson" && m.principleId === activePrincipleId),
    [messages, activePrincipleId]
  );

  const currentAvatarState = latestLessonMessage?.avatarState || "Ready to Guide You";

  async function loadData() {
    try {
      const [principlesData, progressData, badgesData] = await Promise.all([
        api(`/principles?user_id=${USER_ID}`),
        api(`/users/${USER_ID}/progress`),
        api(`/users/${USER_ID}/badges`),
      ]);
      setPrinciples(principlesData.principles || []);
      setProgress(progressData);
      setBadges(badgesData.badges || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleNextLesson(input = null) {
    setLoading(true);
    setError("");
    try {
      const payload = { user_id: USER_ID, user_input: input };
      const result = await api(`/lessons/${activePrincipleId}/next`, {
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
          principleId: activePrincipleId,
        },
      ]);
      setSelectedOption("");
      await loadData();
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
    setMessages((prev) => [...prev, { kind: "lesson", role: "user", text: selectedOption, principleId: activePrincipleId }]);
    await handleNextLesson(selectedOption);
  }

  async function submitReflection() {
    if (!reflectionInput.trim()) return;
    const reflection = reflectionInput.trim();
    setMessages((prev) => [...prev, { kind: "lesson", role: "user", text: reflection, principleId: activePrincipleId }]);
    setReflectionInput("");
    await handleNextLesson(reflection);
  }

  async function askMentor() {
    if (!mentorQuestion.trim()) return;
    const question = mentorQuestion.trim();
    setLoading(true);
    setError("");
    setMessages((prev) => [...prev, { kind: "mentor", role: "user", text: question, principleId: activePrincipleId }]);
    setMentorQuestion("");
    try {
      const result = await api("/mentor/ask", {
        method: "POST",
        body: JSON.stringify({
          user_id: USER_ID,
          question,
          principle_id: activePrincipleId,
        }),
      });
      setMessages((prev) => [
        ...prev,
        {
          kind: "mentor",
          role: "assistant",
          text: result.text,
          avatarState: result.avatar_state || "Answering Question",
          sources: result.sources,
          principleId: activePrincipleId,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      loadData().catch(() => undefined);
    }
  }

  function handleSelectPrinciple(id) {
    setActivePrincipleId(id);
    setSelectedOption("");
    setReflectionInput("");
  }

  return (
    <div className="app">
      {/* Top Header */}
      <header className="topbar">
        <div>
          <h1>VEONVERSE AI Leadership Mentor</h1>
          <p className="subtitle">Interactive Leadership Mentorship & Executive Principles</p>
        </div>
        <div className="stats">
          <div className="stat-pill">Level <strong>{progress?.level ?? 1}</strong></div>
          <div className="stat-pill">XP <strong>{progress?.xp ?? 0}</strong></div>
          <div className="stat-pill">Badges Unlocked <strong>{badges.length} / 10</strong></div>
        </div>
      </header>

      <main className="main-layout">
        {/* Left Navigation: 10 Principles List */}
        <aside className="panel principles-sidebar">
          <h2>Leadership Principles</h2>
          <div className="principle-list">
            {principles.map((p) => {
              const isSelected = p.id === activePrincipleId;
              const pProgress = progress?.progress?.find((item) => item.principle_id === p.id);
              const isCompleted = pProgress?.status === "completed";
              return (
                <div
                  key={p.id}
                  className={`principle-card ${isSelected ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                  onClick={() => handleSelectPrinciple(p.id)}
                >
                  <div className="principle-card-header">
                    <span className="p-number">#{p.number}</span>
                    <span className="p-status-badge">
                      {isCompleted ? "✓ Mastered" : pProgress ? `Step ${pProgress.step_number}/6` : "Explore"}
                    </span>
                  </div>
                  <h3 className="p-title">{p.title}</h3>
                  <div className="p-tension-tag">{p.psychometric_tension}</div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Panel: Interactive AI Leader Avatar & Conversation */}
        <section className="panel chat">
          {/* Active Principle Header */}
          {activePrinciple && (
            <div className="active-principle-banner">
              <h2>#{activePrinciple.number}. {activePrinciple.title}</h2>
              <p className="summary">{activePrinciple.summary}</p>
              <div className="meta-tags">
                <span className="tag tension">⚖️ Core Balance: {activePrinciple.psychometric_tension}</span>
                <span className="tag hogan">🎯 Hogan Targets: {activePrinciple.hogan_competencies}</span>
              </div>
            </div>
          )}

          {/* Interactive AI Avatar Mentor Card */}
          <div className="avatar-mentor-card">
            <div className="avatar-icon-box">
              <span className="avatar-emoji">👤</span>
              <div className="avatar-pulse-ring"></div>
            </div>
            <div className="avatar-mentor-info">
              <div className="avatar-status-row">
                <strong className="avatar-name">AI Leadership Mentor Avatar</strong>
                <span className="avatar-state-badge">💬 {currentAvatarState}</span>
              </div>
              <p className="avatar-subtitle">
                Interactive Phase: <strong>{currentStepName}</strong>
              </p>
            </div>
            <button
              onClick={() => handleNextLesson()}
              disabled={loading}
              className="btn-primary start-step-btn"
            >
              {messages.filter((m) => m.principleId === activePrincipleId).length === 0
                ? "Start Interactive Discussion"
                : "Continue Discussion"}
            </button>
          </div>

          {/* Conversation Thread */}
          <div className="messages">
            {messages
              .filter((m) => m.principleId === activePrincipleId)
              .map((message, idx) => (
                <div key={idx} className={`bubble ${message.role === "user" ? "user" : "mentor"}`}>
                  <div className="meta">
                    <strong>{message.role === "user" ? "You (Employee)" : "Leadership Mentor Avatar"}</strong>
                    {message.avatarState ? <em>{message.avatarState}</em> : null}
                  </div>
                  <p>{message.text}</p>
                  {message.sources?.length ? (
                    <small className="sources-tag">Grounded RAG Sources: Chunks #{message.sources.join(", #")}</small>
                  ) : null}
                </div>
              ))}
            {messages.filter((m) => m.principleId === activePrincipleId).length === 0 && (
              <div className="empty-chat-notice">
                Click <strong>"Start Interactive Discussion"</strong> to have your AI Leadership Avatar introduce this principle through a real workplace story!
              </div>
            )}
          </div>

          {/* Interactive Scenario Options */}
          {latestLessonMessage?.principleId === activePrincipleId && latestLessonMessage?.options?.length === 4 ? (
            <div className="actions">
              <h3>How would you handle this scenario?</h3>
              <div className="option-grid">
                {latestLessonMessage.options.map((option, idx) => (
                  <button
                    key={idx}
                    className={`option-btn ${selectedOption === option ? "selected" : ""}`}
                    onClick={() => setSelectedOption(option)}
                    disabled={loading}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + idx)}.</span> {option}
                  </button>
                ))}
              </div>
              <button onClick={submitSelectedOption} disabled={loading || !selectedOption} className="btn-submit">
                Share Choice with Avatar
              </button>
            </div>
          ) : null}

          {/* Personal Reflection Input */}
          {latestLessonMessage?.principleId === activePrincipleId && latestLessonMessage?.step === "reflection" ? (
            <div className="actions">
              <h3>Your Personal Reflection</h3>
              <textarea
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                placeholder="How will you apply this principle in your role and team this week?"
                rows={3}
              />
              <button onClick={submitReflection} disabled={loading || !reflectionInput.trim()} className="btn-submit">
                Submit Reflection to Avatar
              </button>
            </div>
          ) : null}

          {/* Open RAG Question Box */}
          <div className="actions mentor-ask-section">
            <h3>Ask the Avatar Anything</h3>
            <div className="mentor-row">
              <input
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
                placeholder={`Ask a question about ${activePrinciple?.title || "this principle"}...`}
                onKeyDown={(e) => e.key === "Enter" && askMentor()}
              />
              <button onClick={askMentor} disabled={loading || !mentorQuestion.trim()} className="btn-secondary">
                Ask Avatar
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Earned Badges */}
        <aside className="panel badges-sidebar">
          <h2>Earned Badges ({badges.length})</h2>
          {badges.length === 0 ? (
            <p className="no-badges">No badges earned yet. Complete principle discussions with your avatar to unlock achievements!</p>
          ) : (
            <div className="badge-grid">
              {badges.map((b) => (
                <div className="badge-card" key={`${b.badge_id}-${b.earned_at}`}>
                  <div className="badge-icon">🏆</div>
                  <div className="badge-info">
                    <strong>{b.name}</strong>
                    <p>{b.criteria}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>

      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
