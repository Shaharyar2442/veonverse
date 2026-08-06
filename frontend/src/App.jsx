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
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  const currentScenario = C_FACTOR_SCENARIOS[currentStageIndex] || C_FACTOR_SCENARIOS[0];

  useEffect(() => {
    anamAvatar.onStateChange((state) => {
      if (state.isSpeaking !== undefined) setIsSpeaking(state.isSpeaking);
    });
  }, []);

  // Speak when dialogueStep changes or stage changes or unmuted
  useEffect(() => {
    if (selectedChoice) return; // Choice feedback handles its own speech
    if (!isMuted && currentScenario?.dialogue) {
      const textToSpeak = currentScenario.dialogue[dialogueStep];
      if (textToSpeak) {
        anamAvatar.speak(textToSpeak, speechRate);
      }
    }
  }, [currentStageIndex, dialogueStep, isMuted, speechRate]);

  function handleAdvanceDialogue() {
    if (dialogueStep < currentScenario.dialogue.length - 1) {
      setDialogueStep(prev => prev + 1);
    }
  }

  function handleOptionSelect(choice) {
    setSelectedChoice(choice);
    const scoreAdd = choice.stars === 3 ? 100 : 35;
    setScore((prev) => prev + scoreAdd);

    if (!isMuted && choice.feedback) {
      anamAvatar.speak(choice.feedback, speechRate);
    }
  }

  function handleNextStage() {
    setSelectedChoice(null);
    setDialogueStep(0);
    if (currentStageIndex < C_FACTOR_SCENARIOS.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    } else {
      setCurrentStageIndex(0);
    }
  }

  function handleSelectStage(index) {
    if (index >= 0 && index < C_FACTOR_SCENARIOS.length) {
      setSelectedChoice(null);
      setDialogueStep(0);
      setCurrentStageIndex(index);
    }
  }

  function handleReplayAudio() {
    const textToSpeak = selectedChoice
      ? selectedChoice.feedback
      : currentScenario?.dialogue[dialogueStep];
    if (textToSpeak) {
      anamAvatar.speak(textToSpeak, speechRate);
    }
  }

  function handleChangeSpeechRate() {
    setSpeechRate((prev) => {
      if (prev === 1.0) return 1.25;
      if (prev === 1.25) return 1.5;
      return 1.0;
    });
  }

  function toggleMute() {
    if (isMuted) {
      setIsMuted(false);
      const textToSpeak = selectedChoice ? selectedChoice.feedback : currentScenario?.dialogue[dialogueStep];
      if (textToSpeak) anamAvatar.speak(textToSpeak, speechRate);
    } else {
      anamAvatar.stop();
      setIsMuted(true);
    }
  }

  return (
    <div className="cfactor-game-root bg-slate-50 text-slate-900 font-sans">
      <GameHUD
        currentStage={currentStageIndex + 1}
        totalStages={C_FACTOR_SCENARIOS.length}
        score={score}
        energy={100}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        stageName={currentScenario.stageName}
        onSelectStage={handleSelectStage}
      />

      <main className="game-stage-viewport">
        <VectorStage
          locationTag={currentScenario.locationTag}
          isSpeaking={isSpeaking}
          stageIndex={currentStageIndex}
          currentScenario={currentScenario}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onReplayAudio={handleReplayAudio}
          speechRate={speechRate}
          onChangeSpeechRate={handleChangeSpeechRate}
          selectedChoice={selectedChoice}
          dialogueStep={dialogueStep}
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
          />
        </div>
      </main>
    </div>
  );
}
