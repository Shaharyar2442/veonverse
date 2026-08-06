import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ScenarioCard({
  scenario,
  onOptionSelect,
  selectedChoice,
  onNextStage,
}) {
  const [displayedText, setDisplayedText] = useState("");

  const fullText = selectedChoice
    ? selectedChoice.feedback
    : `${scenario?.avatarPrompt || ""}\n\n${scenario?.storyScenario || ""}`;

  // Typewriter effect for story text & feedback
  useEffect(() => {
    if (!fullText.trim()) return;
    setDisplayedText("");
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(interval);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [fullText, scenario?.stageId, selectedChoice]);

  // Keyboard shortcut listener ([A], [B])
  useEffect(() => {
    function handleKeyDown(e) {
      if (selectedChoice || !scenario?.choices) return;
      const key = e.key.toUpperCase();
      const matchedChoice = scenario.choices.find((c) => c.id === key);
      if (matchedChoice) {
        onOptionSelect(matchedChoice);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scenario, selectedChoice, onOptionSelect]);

  return (
    <motion.div
      className="border-l-4 border-cyan-400 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-y-auto z-10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Speech Dialogue Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <span className="text-xs font-extrabold text-amber-400 tracking-wider">
          {selectedChoice ? "AI LEADER INSIGHT" : "AI EXECUTIVE MENTOR"}
        </span>
        <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
          {scenario?.stageName}
        </span>
      </div>

      {/* Typewriter Dialogue Body */}
      <p className="text-base leading-relaxed text-slate-100 mb-6 whitespace-pre-wrap flex-1">
        {displayedText}
        <span className="text-amber-400 animate-pulse">|</span>
      </p>

      {/* Choice Cards (Options A / B) */}
      {!selectedChoice && scenario?.choices && (
        <AnimatePresence>
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {scenario.choices.map((choice) => (
              <motion.button
                key={choice.id}
                className="bg-slate-900/80 border border-slate-700/80 text-slate-100 hover:border-cyan-400 hover:bg-cyan-950/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.01] transition-all duration-200 rounded-lg p-4 flex items-center gap-4 text-left cursor-pointer"
                onClick={() => onOptionSelect(choice)}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-cyan-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded shadow-[0_0_10px_rgba(6,182,212,0.5)] flex-shrink-0">
                  [{choice.id}]
                </div>
                <div className="text-sm leading-snug text-white font-medium">{choice.text}</div>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Continue to Next Principle Action (Appears after option selection) */}
      {selectedChoice && (
        <motion.div
          className="flex justify-end pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold px-6 py-3 rounded-full text-sm shadow-[0_0_20px_rgba(255,199,0,0.4)] transition-all duration-200 cursor-pointer flex items-center gap-2"
            onClick={onNextStage}
          >
            Explore Next Principle ➔
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
