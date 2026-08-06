import { motion } from "framer-motion";
import { Award, Layers, Maximize2, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";

export default function GameHUD({
  currentStage,
  totalStages,
  score,
  energy = 100,
  isMuted,
  onToggleMute,
  stageName = "Principle Experience",
  onSelectStage,
}) {
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between px-6 z-50 relative">
      {/* Brand & Principle Stage Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-md shadow-indigo-100">
          V
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              VEON<span className="text-indigo-600">VERSE</span>
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200/60 uppercase tracking-wider">
              Executive Mentor
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Principle {currentStage} of {totalStages}: <span className="font-semibold text-slate-800">{stageName}</span>
          </span>
        </div>
      </div>

      {/* Interactive Principles Timeline Node Selector */}
      <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/80 shadow-inner">
        {Array.from({ length: totalStages }, (_, idx) => {
          const stageNum = idx + 1;
          const isActive = stageNum === currentStage;
          const isPassed = stageNum < currentStage;

          return (
            <button
              key={stageNum}
              onClick={() => onSelectStage && onSelectStage(idx)}
              className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-300 scale-110"
                  : isPassed
                  ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                  : "bg-white text-slate-500 hover:bg-slate-200 border border-slate-200"
              }`}
              title={`Jump to Principle ${stageNum}`}
            >
              {stageNum}
            </button>
          );
        })}
      </div>

      {/* Right Metrics & Executive Controls */}
      <div className="flex items-center gap-3">
        {/* Leadership Score */}
        <motion.div
          className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
        >
          <Award size={15} className="text-amber-600" />
          <span className="text-amber-700/80 text-[10px] uppercase tracking-wider font-extrabold">XP Score</span>
          <span className="text-amber-950 font-black text-sm">{score}</span>
        </motion.div>

        {/* Energy Bar */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
          <Zap size={15} className="text-emerald-600 fill-emerald-600" />
          <span className="text-emerald-700/80 text-[10px] uppercase font-extrabold">Engagement</span>
          <span className="text-emerald-950 font-black text-xs">{energy}%</span>
        </div>

        {/* Mute/Unmute Audio Control */}
        <button
          className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 flex items-center justify-center transition-all duration-200 cursor-pointer"
          onClick={onToggleMute}
          title={isMuted ? "Unmute Mentor Audio" : "Mute Mentor Audio"}
        >
          {isMuted ? <VolumeX size={16} className="text-slate-400" /> : <Volume2 size={16} className="text-indigo-600" />}
        </button>

        {/* Fullscreen Control */}
        <button
          className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 flex items-center justify-center transition-all duration-200 cursor-pointer"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize2 size={16} className="text-slate-600" />
        </button>
      </div>
    </header>
  );
}
