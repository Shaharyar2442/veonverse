import { useEffect, useState } from "react";
import GameHUD from "./components/GameHUD";
import ScenarioCard from "./components/ScenarioCard";
import VectorStage from "./components/VectorStage";
import { C_FACTOR_SCENARIOS } from "./data/cFactorScenarios";
import { anamAvatar } from "./services/anamAvatar";

export default function App() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const currentScenario = C_FACTOR_SCENARIOS[currentStageIndex] || C_FACTOR_SCENARIOS[0];

  useEffect(() => {
    anamAvatar.onStateChange((state) => {
      if (state.isSpeaking !== undefined) setIsSpeaking(state.isSpeaking);
    });
  }, []);

  // Speak scenario text when stage changes
  useEffect(() => {
    setSelectedChoice(null);
    if (!isMuted && currentScenario?.avatarPrompt) {
      const textToSpeak = `${currentScenario.avatarPrompt} ${currentScenario.storyScenario}`;
      anamAvatar.speak(textToSpeak);
    }
  }, [currentStageIndex, isMuted]);

  function handleOptionSelect(choice) {
    setSelectedChoice(choice);
    const scoreAdd = choice.stars === 3 ? 100 : 35;
    setScore((prev) => prev + scoreAdd);

    if (!isMuted && choice.feedback) {
      anamAvatar.speak(choice.feedback);
    }
  }

  function handleNextStage() {
    setSelectedChoice(null);
    if (currentStageIndex < C_FACTOR_SCENARIOS.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    } else {
      setCurrentStageIndex(0);
    }
  }

  function toggleMute() {
    if (isMuted) {
      setIsMuted(false);
      const textToSpeak = selectedChoice ? selectedChoice?.feedback : currentScenario?.avatarPrompt;
      if (textToSpeak) anamAvatar.speak(textToSpeak);
    } else {
      anamAvatar.stop();
      setIsMuted(true);
    }
  }

  return (
    <div className="cfactor-game-root">
      {/* C-Factor Game HUD Top Navbar */}
      <GameHUD
        currentStage={currentStageIndex + 1}
        totalStages={C_FACTOR_SCENARIOS.length}
        score={score}
        energy={100}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        stageName={currentScenario.stageName}
      />

      {/* Main 2D Vector Stage & Interactive Dialogue */}
      <main className="game-stage-viewport">
        <VectorStage
          locationTag={currentScenario.locationTag}
          isSpeaking={isSpeaking}
          stageIndex={currentStageIndex}
        />

        <ScenarioCard
          scenario={currentScenario}
          onOptionSelect={handleOptionSelect}
          selectedChoice={selectedChoice}
          onNextStage={handleNextStage}
        />
      </main>
    </div>
  );
}
