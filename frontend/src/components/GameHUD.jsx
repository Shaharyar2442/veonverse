import { motion } from "framer-motion";
import { Award, Clock, Maximize2, Volume2, VolumeX, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function GameHUD({
  currentStage,
  totalStages,
  score,
  energy = 100,
  isMuted,
  onToggleMute,
  stageName = "PRINCIPLE EXPERIENCE",
}) {
  const [timeLeft, setTimeLeft] = useState(45);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 45));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStage]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-between px-6 z-50 relative">
      {/* Brand & Principle Stage Badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-400 text-slate-950 rounded-lg flex items-center justify-center font-extrabold text-xl shadow-[0_0_15px_rgba(255,199,0,0.4)]">
          V
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-extrabold tracking-wide text-white">
            VEON<span className="text-amber-400">VERSE</span>
          </span>
          <span className="text-xs text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            PRINCIPLE {currentStage} OF {totalStages}: {stageName}
          </span>
        </div>
      </div>

      {/* Center Principle Exploration Progress Bar */}
      <div className="flex flex-col items-center w-72">
        <div className="flex justify-between w-full text-xs mb-1">
          <span className="text-slate-400 font-semibold">EXPLORATION PROGRESS</span>
          <span className="text-amber-400 font-bold">{Math.round((currentStage / totalStages) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStage / totalStages) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Right Metrics & Controls */}
      <div className="flex items-center gap-3">
        {/* Leadership Mastery Badge */}
        <motion.div
          className="bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-300/40 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
        >
          <Award size={15} className="text-slate-950 fill-amber-300" />
          <span className="text-slate-950/80 text-[10px] uppercase tracking-wider font-extrabold">Mastery</span>
          <span className="text-slate-950 font-black text-sm">{score}</span>
        </motion.div>

        {/* Energy Meter */}
        <div className="bg-slate-900/80 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          <Zap size={15} className="text-emerald-400 fill-emerald-400" />
          <span className="text-slate-400 text-[10px] uppercase font-bold">Energy</span>
          <span className="text-emerald-400 font-bold">{energy}%</span>
        </div>

        {/* Timer Badge */}
        <div className="bg-slate-900/80 border border-slate-700/80 text-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
          <Clock size={15} className="text-slate-400" />
          <span className="font-mono text-cyan-400 font-bold">0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
        </div>

        {/* Action Controls */}
        <button
          className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700/80 hover:border-cyan-400 hover:bg-cyan-950/40 text-white flex items-center justify-center transition-all duration-200"
          onClick={onToggleMute}
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-amber-400" />}
        </button>

        <button
          className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700/80 hover:border-cyan-400 hover:bg-cyan-950/40 text-white flex items-center justify-center transition-all duration-200"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </header>
  );
}
