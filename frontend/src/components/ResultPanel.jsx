import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, CheckCircle2, Lightbulb, Shield, Star } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ResultPanel({ choice, scenario, onNextStage, isFinalStage }) {
  const isHighImpact = choice.stars === 3;
  const hasFiredConfetti = useRef(false);

  useEffect(() => {
    if (isHighImpact && !hasFiredConfetti.current) {
      hasFiredConfetti.current = true;
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { x: 0.5, y: 0.55 },
        colors: ["#ffca05", "#ffd84d", "#fff1a6", "#ffffff"],
        startVelocity: 30,
        decay: 0.92,
        ticks: 120,
      });
    }
  }, [isHighImpact]);

  const scoreColor = isHighImpact
    ? "text-[#ffca05] bg-[#ffca05]/10 border-[#ffca05]/30"
    : "text-slate-400 bg-slate-400/10 border-slate-400/30";

  return (
    <AnimatePresence>
      <motion.div
        className="border-t border-[#1c3148] bg-[#030b16]/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="p-3 md:p-4 space-y-3">
          {/* Stars + Score in one row */}
          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 14, delay: 0.05 }}
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((starNum) => {
                const filled = starNum <= choice.stars;
                return (
                  <motion.div
                    key={starNum}
                    initial={{ opacity: 0, rotate: -30 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.05 + starNum * 0.08 }}
                  >
                    <Star
                      size={22}
                      className={filled ? "text-[#ffca05] drop-shadow-[0_0_4px_rgba(255,202,5,0.4)]" : "text-slate-600"}
                      fill={filled ? "#ffca05" : "none"}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold tracking-wide ${scoreColor}`}>
              <Award size={13} />
              Score: {choice.score}
            </div>
          </motion.div>

          {/* Feedback + Badge in compact row */}
          <motion.div
            className="space-y-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm leading-snug text-slate-300 text-center max-w-2xl mx-auto px-2">
              {choice.feedback}
            </p>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#ffca05]/30 bg-[#ffca05]/10 text-[#ffca05]">
                <Award size={14} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{choice.badge}</span>
              </div>
            </div>
          </motion.div>

          {/* Psychometric Tension */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-[#07121f]/80 border border-[#1c3148] rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Shield size={11} className="text-[#ffca05]" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Psychometric Tension</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-200 leading-tight text-center">{scenario.psychometricTension}</p>
            </div>
          </motion.div>

          {/* Takeaways — compact */}
          <motion.div
            className="max-w-lg mx-auto space-y-1.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <Lightbulb size={11} />
              Key Takeaways
            </div>
            {scenario.takeaways.map((takeaway, idx) => (
              <motion.div
                key={idx}
                className="flex items-start gap-2 bg-[#07121f]/50 border border-[#1c3148] rounded-lg px-3 py-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.07 }}
              >
                <CheckCircle2 size={14} className="text-[#ffca05] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-snug">{takeaway}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Next Stage Button */}
        <motion.div
          className="border-t border-[#1c3148] bg-[#ffca05]/[0.04] px-4 py-3 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="bg-[#ffca05] hover:bg-[#ffd84d] text-[#03101f] font-extrabold px-7 py-2.5 rounded-full text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-amber-400/20 transition-all cursor-pointer flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onNextStage();
            }}
          >
            <span>{isFinalStage ? "Complete Experience" : "Next Principle"}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
