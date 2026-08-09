import { Award, Check, Maximize2, Volume2, VolumeX } from "lucide-react";

export default function GameHUD({
  currentStage,
  totalStages,
  isMuted,
  onToggleMute,
  stageName = "Principle Experience",
  onSelectStage,
  completedStages = new Set(),
  totalScore = 0,
  badgeCount = 0,
  onOpenBadges,
}) {
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <header className="h-16 bg-[#030b16]/95 backdrop-blur-md border-b border-[#1c3148] shadow-[0_8px_24px_rgba(0,0,0,0.28)] flex items-center justify-between px-6 z-50 relative">
      {/* Brand & Principle Stage Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#ffca05] text-[#03101f] rounded-lg flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20">
          V
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-slate-100">
              VEON<span className="text-[#ffca05]">VERSE</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Principle {currentStage} of {totalStages}: <span className="font-semibold text-slate-200">{stageName}</span>
            </span>
            {/* Accumulated Score */}
            {totalScore > 0 && (
              <span className="text-[10px] font-extrabold text-[#ffca05] bg-[#ffca05]/10 border border-[#ffca05]/25 px-2 py-0.5 rounded-full">
                {totalScore} pts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Principles Timeline Node Selector */}
      <div className="hidden lg:flex items-center gap-1.5 bg-[#07121f] p-1.5 rounded-full border border-[#1c3148] shadow-inner">
        {Array.from({ length: totalStages }, (_, idx) => {
          const stageNum = idx + 1;
          const isActive = stageNum === currentStage;
          const isCompleted = completedStages.has(idx);
          const isPassed = stageNum < currentStage;

          return (
            <button
              key={stageNum}
              onClick={() => onSelectStage && onSelectStage(idx)}
              className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isCompleted
                  ? "bg-emerald-600/80 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-500/20"
                  : isActive
                  ? "bg-[#ffca05] text-[#03101f] shadow-md shadow-amber-400/20 scale-110"
                  : isPassed
                  ? "bg-[#17273a] text-[#ffca05] hover:bg-[#203752]"
                  : "bg-[#0b1827] text-slate-400 hover:bg-[#17273a] border border-[#29435f]"
              }`}
              title={`${isCompleted ? "Completed" : "Principle " + stageNum}${isActive ? " (current)" : ""}`}
            >
              {isCompleted ? <Check size={14} strokeWidth={3} /> : stageNum}
            </button>
          );
        })}
      </div>

      {/* Executive controls */}
      <div className="flex items-center gap-3">
        {/* Achievements / Badges */}
        <button
          className="relative w-9 h-9 rounded-full bg-[#0b1827] border border-[#29435f] hover:border-[#ffca05] hover:bg-[#ffca05]/10 text-slate-300 flex items-center justify-center transition-all duration-200 cursor-pointer"
          onClick={onOpenBadges}
          title="View Achievements"
        >
          <Award size={16} className="text-[#ffca05]" />
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-extrabold text-white flex items-center justify-center shadow-sm">
              {badgeCount}
            </span>
          )}
        </button>

        {/* Mute/Unmute Audio Control */}
        <button
          className="w-9 h-9 rounded-full bg-[#0b1827] border border-[#29435f] hover:border-[#ffca05] hover:bg-[#ffca05]/10 text-slate-300 flex items-center justify-center transition-all duration-200 cursor-pointer"
          onClick={onToggleMute}
          title={isMuted ? "Unmute Mentor Audio" : "Mute Mentor Audio"}
        >
          {isMuted ? <VolumeX size={16} className="text-slate-500" /> : <Volume2 size={16} className="text-[#ffca05]" />}
        </button>

        {/* Fullscreen Control */}
        <button
          className="w-9 h-9 rounded-full bg-[#0b1827] border border-[#29435f] hover:border-[#ffca05] hover:bg-[#ffca05]/10 text-slate-300 flex items-center justify-center transition-all duration-200 cursor-pointer"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize2 size={16} className="text-slate-300" />
        </button>
      </div>
    </header>
  );
}
