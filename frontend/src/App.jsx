import { useEffect, useState } from "react";
import GameHUD from "./components/GameHUD";
import ScenarioCard from "./components/ScenarioCard";
import VectorStage from "./components/VectorStage";
import { C_FACTOR_SCENARIOS } from "./data/cFactorScenarios";
import { anamAvatar } from "./services/anamAvatar";

export default function App() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [dialogueStep, setDialogueStep] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completedStages, setCompletedStages] = useState(new Set());

  const currentScenario = C_FACTOR_SCENARIOS[currentStageIndex] || C_FACTOR_SCENARIOS[0];

  const avatarState =
    selectedChoice && selectedChoice.stars === 3 && !isSpeaking
      ? "celebrating"
      : isSpeaking
      ? "speaking"
      : "idle";

  useEffect(() => {
    const unsubscribe = anamAvatar.onStateChange((state) => {
      if (state.isSpeaking !== undefined) setIsSpeaking(state.isSpeaking);
    });
    return unsubscribe;
  }, []);

  // Speak when dialogueStep changes or stage changes or unmuted
  useEffect(() => {
    if (selectedChoice) return; // Choice feedback handles its own speech
    if (!isMuted && currentScenario?.dialogue) {
      const textToSpeak = currentScenario.dialogue[dialogueStep];
      if (textToSpeak) {
        anamAvatar.speak(textToSpeak);
      }
    }
  }, [currentStageIndex, dialogueStep, isMuted]);

  function handleAdvanceDialogue() {
    if (dialogueStep < currentScenario.dialogue.length - 1) {
      setDialogueStep(prev => prev + 1);
    }
  }

  function handleOptionSelect(choice) {
    setSelectedChoice(choice);
    if (!isMuted && choice.feedback) {
      anamAvatar.speak(choice.feedback);
    }
  }

  function handleNextStage() {
    setCompletedStages((prev) => {
      const next = new Set(prev);
      next.add(currentStageIndex);
      return next;
    });

    if (currentStageIndex === C_FACTOR_SCENARIOS.length - 1) {
      anamAvatar.stop();
      setIsComplete(true);
      return;
    }

    setSelectedChoice(null);
    setDialogueStep(0);
    setCurrentStageIndex((prev) => prev + 1);
  }

  function handleSelectStage(index) {
    if (index >= 0 && index < C_FACTOR_SCENARIOS.length) {
      setSelectedChoice(null);
      setDialogueStep(0);
      setCurrentStageIndex(index);
      setIsComplete(false);
    }
  }

  function handleRestartExperience() {
    setIsComplete(false);
    setCompletedStages(new Set());
    setSelectedChoice(null);
    setDialogueStep(0);
    setCurrentStageIndex(0);
  }

  function handleReplayAudio() {
    const textToSpeak = selectedChoice
      ? selectedChoice.feedback
      : currentScenario?.dialogue[dialogueStep];
    if (textToSpeak) {
      anamAvatar.speak(textToSpeak);
    }
  }

  function toggleMute() {
    if (isMuted) {
      setIsMuted(false);
      const textToSpeak = selectedChoice ? selectedChoice.feedback : currentScenario?.dialogue[dialogueStep];
      if (textToSpeak) anamAvatar.speak(textToSpeak);
    } else {
      anamAvatar.stop();
      setIsMuted(true);
    }
  }

  return (
    <div className="cfactor-game-root font-sans">
      <GameHUD
        currentStage={currentStageIndex + 1}
        totalStages={C_FACTOR_SCENARIOS.length}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        stageName={currentScenario.stageName}
        onSelectStage={handleSelectStage}
        completedStages={completedStages}
      />

      <main className="game-stage-viewport">
        {isComplete ? (
          <section className="absolute inset-0 flex items-center justify-center px-6 bg-[radial-gradient(circle_at_50%_35%,rgba(255,202,5,0.12),transparent_28%),linear-gradient(135deg,#020811_0%,#06101c_52%,#020811_100%)]">
            <div className="w-full max-w-xl rounded-2xl border border-[#ffca05]/35 bg-[#07121f]/95 px-8 py-10 text-center shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#ffca05]/50 bg-[#ffca05]/10 text-3xl text-[#ffca05]">✓</div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffca05]">Experience complete</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white">All 10 principles complete.</h1>
              <p className="mt-4 text-base leading-relaxed text-slate-300">Thank you for completing the VEONVERSE Leadership Mentor experience.</p>
              <button
                className="mt-8 rounded-full bg-[#ffca05] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-[#03101f] transition-colors hover:bg-[#ffd84d]"
                onClick={handleRestartExperience}
              >
                Start again
              </button>
            </div>
          </section>
        ) : <>
          <VectorStage
            locationTag={currentScenario.locationTag}
            isSpeaking={isSpeaking}
            stageIndex={currentStageIndex}
            currentScenario={currentScenario}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onReplayAudio={handleReplayAudio}
            selectedChoice={selectedChoice}
            dialogueStep={dialogueStep}
            avatarState={avatarState}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50">
            <ScenarioCard
              scenario={currentScenario}
              dialogueStep={dialogueStep}
              onAdvanceDialogue={handleAdvanceDialogue}
              onOptionSelect={handleOptionSelect}
              selectedChoice={selectedChoice}
              onNextStage={handleNextStage}
              isSpeaking={isSpeaking}
              isFinalStage={currentStageIndex === C_FACTOR_SCENARIOS.length - 1}
            />
          </div>
        </>}
      </main>
    </div>
  );
}
