import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MessageSquareQuote, MousePointerClick } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScenarioCard({
  scenario,
  dialogueStep,
  onAdvanceDialogue,
  onOptionSelect,
  selectedChoice,
  onNextStage,
  isSpeaking
}) {
  const [displayedText, setDisplayedText] = useState("");
  const isDialogueComplete = dialogueStep >= (scenario?.dialogue?.length - 1);
  const showChoices = isDialogueComplete && !selectedChoice;

  const currentLine = selectedChoice
    ? selectedChoice.feedback
    : scenario?.dialogue?.[dialogueStep] || "";

  useEffect(() => {
    if (!currentLine) return;
    setDisplayedText("");
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayedText(currentLine.slice(0, idx));
      if (idx >= currentLine.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [currentLine, scenario?.stageId, selectedChoice]);

  const handleBoxClick = () => {
    if (!showChoices && !selectedChoice && dialogueStep < scenario.dialogue.length - 1) {
      onAdvanceDialogue();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleBoxClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBoxClick]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (selectedChoice || !showChoices || !scenario?.choices) return;
      const key = e.key.toUpperCase();
      const matchedChoice = scenario.choices.find((c) => c.id === key);
      if (matchedChoice) onOptionSelect(matchedChoice);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scenario, selectedChoice, showChoices, onOptionSelect]);

  const highlightText = (text) => text;

  return (
    <motion.div
      className={`bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] flex flex-col z-50 overflow-hidden ${!showChoices && !selectedChoice ? 'cursor-pointer hover:border-indigo-300 transition-colors' : ''}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
      onClick={handleBoxClick}
    >
      <div className="p-5 md:p-7">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <MessageSquareQuote size={18} className="text-indigo-600" />
            <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
              {selectedChoice ? "Executive Decision Matrix" : "Scenario Briefing"}
            </span>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full uppercase tracking-wider">
            {scenario?.principleTitle}
          </span>
        </div>

        <p className="text-lg md:text-xl font-medium leading-relaxed text-slate-800 min-h-[4rem]">
          {highlightText(displayedText)}
          {isSpeaking && displayedText.length < currentLine.length && (
            <span className="inline-block w-2.5 h-5 ml-1.5 bg-indigo-500 animate-pulse align-middle"></span>
          )}
        </p>

        {!showChoices && !selectedChoice && (
          <div className="flex items-center justify-end mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-1">
            <MousePointerClick size={12} />
            Click or Space to continue ({dialogueStep + 1}/{scenario.dialogue.length})
          </div>
        )}
      </div>

      <AnimatePresence>
        {showChoices && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-slate-100 bg-slate-50/50 p-4"
          >
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
              Select Your Strategic Action (Press A or B):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenario.choices.map((choice) => (
                <motion.button
                  key={choice.id}
                  className="bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-lg transition-all duration-200 rounded-xl p-4 flex flex-col gap-2 text-left group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOptionSelect(choice);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="bg-indigo-600 text-white font-black text-[10px] w-6 h-6 flex items-center justify-center rounded-md shadow-sm group-hover:bg-indigo-700">
                    {choice.id}
                  </div>
                  <div className="text-sm leading-snug text-slate-800 font-bold group-hover:text-indigo-950">
                    {choice.text}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedChoice && (
        <motion.div
          className="border-t border-slate-100 bg-indigo-50/80 p-4 flex justify-between items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Evaluation complete.</span>
          </div>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onNextStage();
            }}
          >
            <span>Next Scenario</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
