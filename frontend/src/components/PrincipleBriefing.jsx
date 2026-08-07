import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Lightbulb, Shield, Target } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { anamAvatar } from "../services/anamAvatar";

export default function PrincipleBriefing({ scenario, onBegin }) {
  const [visible, setVisible] = useState(false);
  const spoken = useRef(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [scenario.stageId]);

  useEffect(() => {
    if (!spoken.current && scenario.teachingBrief) {
      spoken.current = true;
      anamAvatar.speak(scenario.teachingBrief, 0.85);
    }
  }, [scenario.stageId]);

  return (
    <motion.div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
    >
      <div className="bg-[#07121f]/95 backdrop-blur-xl border border-[#1c3148] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)] p-5 md:p-7 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ffca05]/15 border border-[#ffca05]/30 flex items-center justify-center">
              <BookOpen size={16} className="text-[#ffca05]" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Leadership Principle</p>
              <h2 className="text-base md:text-lg font-extrabold text-slate-100">
                {scenario.principleTitle}
              </h2>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#ffca05] bg-[#ffca05]/10 border border-[#ffca05]/30 px-3 py-1 rounded-full uppercase tracking-wider">
            {scenario.stageName}
          </span>
        </div>

        {/* Teaching text */}
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#030b16]/60 border border-[#1c3148] rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="shrink-0 mt-0.5"
              >
                <Lightbulb size={20} className="text-[#ffca05]" />
              </motion.div>
              <p className="text-sm md:text-base leading-relaxed text-slate-300">
                {scenario.teachingBrief}
              </p>
            </div>
          </motion.div>
        )}

        {/* Tension + Hogan */}
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="bg-[#030b16]/80 border border-[#1c3148] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield size={13} className="text-[#ffca05]" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">The Tension</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-[#ffca05]">{scenario.leftForce}</span>
                <div className="h-px flex-1 bg-[#1c3148]" />
                <span className="text-[11px] font-extrabold text-slate-400">{scenario.rightForce}</span>
              </div>
            </div>
            <div className="bg-[#030b16]/80 border border-[#1c3148] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target size={13} className="text-[#ffca05]" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hogan Target</span>
              </div>
              <p className="text-[11px] font-extrabold text-slate-200">{scenario.hoganTarget}</p>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        {visible && (
          <motion.div
            className="flex justify-center pt-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              className="bg-[#ffca05] hover:bg-[#ffd84d] text-[#03101f] font-extrabold px-8 py-3 rounded-full text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-amber-400/20 transition-all cursor-pointer flex items-center gap-2"
              onClick={onBegin}
            >
              <span>Accept Challenge</span>
              <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
