import { RotateCcw } from "lucide-react";
import { StoryVisualizer } from "./StoryVisualizer";
import LuxuryBackground from "./LuxuryBackground";

export default function VectorStage({
  currentScenario,
  isMuted,
  onToggleMute,
  onReplayAudio,
  selectedChoice,
  dialogueStep,
  hideVisualizer = false,
}) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(18,57,95,0.24),transparent_34%),linear-gradient(135deg,#020811_0%,#06101c_52%,#020811_100%)] flex flex-col justify-between p-6">

      {/* Background Story Visualizer or Luxury Ambient */}
      {hideVisualizer ? (
        <LuxuryBackground />
      ) : (
        <StoryVisualizer
          visualConcept={currentScenario?.visualConcept || 'pulse'}
          dialogueStep={dialogueStep}
          selectedChoice={selectedChoice}
        />
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(71,117,163,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(71,117,163,0.10)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      {/* Top Bar: Controls */}
      <div className="relative z-20 flex justify-end items-start w-full pointer-events-none">
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="bg-[#07121f]/90 backdrop-blur-sm border border-[#29435f] px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-2">
            <button onClick={onReplayAudio} className="p-1 rounded-full hover:bg-[#ffca05]/10 text-slate-300 hover:text-[#ffca05] transition-colors" title="Replay Audio">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
