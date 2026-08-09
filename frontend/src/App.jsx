import { useEffect, useMemo, useState } from "react";
import GameHUD from "./components/GameHUD";
import ScenarioCard from "./components/ScenarioCard";
import VectorStage from "./components/VectorStage";
import BadgeDrawer from "./components/BadgeDrawer";
import CompletionOverlay from "./components/CompletionOverlay";
import LandingPage from "./components/LandingPage";
import PrincipleBriefing from "./components/PrincipleBriefing";
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
  const [totalScore, setTotalScore] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState(new Map());
  const [isBadgeDrawerOpen, setIsBadgeDrawerOpen] = useState(false);
  const [phase, setPhase] = useState("briefing");
  const [hasStarted, setHasStarted] = useState(false);

  const currentScenario = C_FACTOR_SCENARIOS[currentStageIndex] || C_FACTOR_SCENARIOS[0];

  const correctCount = useMemo(() => {
    let count = 0;
    earnedBadges.forEach((b) => { if (b.stars === 3) count++; });
    return count;
  }, [earnedBadges]);

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

  useEffect(() => {
    if (phase !== "dialogue" || selectedChoice) return;
    if (!isMuted && currentScenario?.dialogue) {
      const textToSpeak = currentScenario.dialogue[dialogueStep];
      if (textToSpeak) {
        anamAvatar.speak(textToSpeak);
      }
    }
  }, [currentStageIndex, phase, dialogueStep, isMuted]);

  function handleAdvanceDialogue() {
    if (dialogueStep < currentScenario.dialogue.length - 1) {
      setDialogueStep((prev) => prev + 1);
    }
  }

  function handleBeginChallenge() {
    anamAvatar.stop();
    setPhase("dialogue");
    setDialogueStep(0);
    setSelectedChoice(null);
  }

  function handleOptionSelect(choice) {
    setSelectedChoice(choice);
    if (!isMuted && choice.feedback) {
      anamAvatar.speak(choice.feedback);
    }
  }

  function handleNextStage() {
    anamAvatar.stop();

    if (selectedChoice) {
      setTotalScore((prev) => prev + selectedChoice.score);
      setEarnedBadges((prev) => {
        const next = new Map(prev);
        if (!prev.has(currentStageIndex)) {
          next.set(currentStageIndex, {
            badge: selectedChoice.badge,
            stars: selectedChoice.stars,
            score: selectedChoice.score,
            principleTitle: currentScenario.principleTitle,
          });
        }
        return next;
      });
    }

    setCompletedStages((prev) => {
      const next = new Set(prev);
      next.add(currentStageIndex);
      return next;
    });

    if (currentStageIndex === C_FACTOR_SCENARIOS.length - 1) {
      setIsComplete(true);
      return;
    }

    setSelectedChoice(null);
    setDialogueStep(0);
    setPhase("briefing");
    setCurrentStageIndex((prev) => prev + 1);
  }

  function handleSelectStage(index) {
    if (index >= 0 && index < C_FACTOR_SCENARIOS.length) {
      anamAvatar.stop();
      setSelectedChoice(null);
      setDialogueStep(0);
      setCurrentStageIndex(index);
      setIsComplete(false);
      setPhase("briefing");
    }
  }

  function handleRestartExperience() {
    setIsComplete(false);
    setCompletedStages(new Set());
    setTotalScore(0);
    setEarnedBadges(new Map());
    setIsBadgeDrawerOpen(false);
    setSelectedChoice(null);
    setDialogueStep(0);
    setPhase("briefing");
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
      {!hasStarted ? (
        <LandingPage onEnter={() => setHasStarted(true)} />
      ) : (
        <>
          <GameHUD
        currentStage={currentStageIndex + 1}
        totalStages={C_FACTOR_SCENARIOS.length}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        stageName={currentScenario.stageName}
        onSelectStage={handleSelectStage}
        completedStages={completedStages}
        totalScore={totalScore}
        badgeCount={earnedBadges.size}
        onOpenBadges={() => setIsBadgeDrawerOpen(true)}
      />

      <main className="game-stage-viewport">
        {isComplete ? (
          <CompletionOverlay
            totalScore={totalScore}
            correctCount={correctCount}
            totalStages={C_FACTOR_SCENARIOS.length}
            earnedBadges={earnedBadges}
            onRestart={handleRestartExperience}
          />
        ) : (
          <>
            <VectorStage
              currentScenario={currentScenario}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onReplayAudio={handleReplayAudio}
              selectedChoice={selectedChoice}
              dialogueStep={dialogueStep}
              hideVisualizer={phase === "briefing"}
            />

            {phase === "briefing" ? (
              <PrincipleBriefing
                scenario={currentScenario}
                onBegin={handleBeginChallenge}
              />
            ) : (
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
            )}
          </>
        )}
      </main>

      <BadgeDrawer
        isOpen={isBadgeDrawerOpen}
        badges={earnedBadges}
        totalScore={totalScore}
        onClose={() => setIsBadgeDrawerOpen(false)}
      />
        </>
      )}
    </div>
  );
}
