import { motion } from "framer-motion";
import { MapPin, RotateCcw, Volume2 } from "lucide-react";
import { StoryVisualizer } from "./StoryVisualizer";

export default function VectorStage({
  locationTag = "Operations Command Center",
  isSpeaking = false,
  stageIndex = 0,
  currentScenario,
  isMuted,
  onReplayAudio,
  speechRate = 1.0,
  onChangeSpeechRate,
  selectedChoice,
  dialogueStep,
}) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 flex flex-col justify-between p-6">
      
      {/* Background Story Visualizer */}
      <StoryVisualizer 
        visualConcept={currentScenario?.visualConcept || 'pulse'} 
        dialogueStep={dialogueStep}
        selectedChoice={selectedChoice}
      />

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      {/* Top Bar: Avatar PIP + Controls */}
      <div className="relative z-20 flex justify-between items-start w-full pointer-events-none">
        
        {/* Avatar PIP Badge */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <motion.div
            className={`relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-sky-400 to-amber-400 shadow-xl ${
              isSpeaking ? "ring-4 ring-indigo-400/40 shadow-indigo-200" : ""
            }`}
            animate={{ y: isSpeaking ? [0, -2, 0] : [-1, 1, -1] }}
            transition={{ y: { repeat: Infinity, duration: isSpeaking ? 1.2 : 3.5, ease: "easeInOut" } }}
          >
            <img
              src="/kaan_avatar.jpg"
              alt="Executive Mentor"
              className="w-full h-full rounded-full object-cover object-top border-2 border-white shadow-inner bg-slate-200"
            />
            {/* Real-time Waveform Equalizer */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/95 border border-slate-200 px-3 py-1 rounded-full shadow-md flex items-center gap-1 z-20">
              <Volume2 size={12} className={isSpeaking ? "text-indigo-600 animate-pulse" : "text-slate-400"} />
              <div className="flex items-end gap-0.5 h-3 px-0.5">
                <span className={`w-1 bg-indigo-600 rounded-full transition-all duration-150 ${isSpeaking ? "animate-[wave_0.6s_infinite_alternate] h-3" : "h-1 opacity-40"}`} />
                <span className={`w-1 bg-indigo-600 rounded-full transition-all duration-150 ${isSpeaking ? "animate-[wave_0.6s_infinite_alternate_0.15s] h-2" : "h-1 opacity-40"}`} />
                <span className={`w-1 bg-indigo-600 rounded-full transition-all duration-150 ${isSpeaking ? "animate-[wave_0.6s_infinite_alternate_0.3s] h-4" : "h-1.5 opacity-40"}`} />
                <span className={`w-1 bg-indigo-600 rounded-full transition-all duration-150 ${isSpeaking ? "animate-[wave_0.6s_infinite_alternate_0.45s] h-2.5" : "h-1 opacity-40"}`} />
              </div>
            </div>
          </motion.div>
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Kaan Terzioğlu
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex flex-col items-end gap-4 pointer-events-auto">
          {/* Location & Audio Header */}
          <div className="flex flex-col items-end gap-2">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-2">
              <MapPin size={14} className="text-indigo-600" />
              <span>{locationTag}</span>
            </div>
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-2">
              <button onClick={onReplayAudio} className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors" title="Replay Audio">
                <RotateCcw size={14} />
              </button>
              <span className="w-px h-3 bg-slate-200"></span>
              <button onClick={onChangeSpeechRate} className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors" title="Change Speech Rate">
                {speechRate}x Speed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
