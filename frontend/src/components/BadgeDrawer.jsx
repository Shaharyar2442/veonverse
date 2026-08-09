import { AnimatePresence, motion } from "framer-motion";
import { Award, CheckCircle2, Star, X, Zap } from "lucide-react";
import { C_FACTOR_SCENARIOS } from "../data/cFactorScenarios";

const TOTAL = C_FACTOR_SCENARIOS.length;
const RADIUS = 150;
const CENTER_X = 50;
const CENTER_Y = 50;

function getCirclePosition(index) {
  const angle = (360 / TOTAL) * index - 90;
  const rad = (angle * Math.PI) / 180;
  return {
    left: `${CENTER_X + Math.cos(rad) * (RADIUS / 3)}%`,
    top: `${CENTER_Y + Math.sin(rad) * (RADIUS / 2.6)}%`,
  };
}

function shortTitle(title) {
  return title
    .replace("We ", "")
    .replace("Our ", "")
    .substring(0, 22);
}

export default function BadgeDrawer({ isOpen, badges, totalScore = 0, onClose }) {
  const allPrinciples = C_FACTOR_SCENARIOS.map((s, idx) => {
    const earned = badges.get(idx);
    return {
      id: s.stageId,
      title: shortTitle(s.principleTitle),
      fullTitle: s.principleTitle,
      earned: !!earned,
      stars: earned ? earned.stars : 0,
      badge: earned ? earned.badge : null,
      score: earned ? earned.score : 0,
    };
  });

  const earnedCount = allPrinciples.filter((p) => p.earned).length;
  const correctCount = allPrinciples.filter((p) => p.stars === 3).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-[101] bg-[#030b16]/98 backdrop-blur-xl border-t border-[#1c3148] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#29435f] [&::-webkit-scrollbar-thumb]:rounded-full"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#29435f]" />
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffca05]/10 border border-[#ffca05]/30 flex items-center justify-center">
                  <Award size={22} className="text-[#ffca05]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-100">Achievements</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {earnedCount} of {TOTAL} earned &middot; {correctCount} mastered
                  </p>
                </div>
              </div>
              <button
                className="w-9 h-9 rounded-full bg-[#0b1827] border border-[#29435f] hover:border-[#ffca05] hover:bg-[#ffca05]/10 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>

            {/* Badge Circle + Key */}
            <div className="relative w-full max-w-[440px] mx-auto my-4 px-8" style={{ height: "min(65vw, 380px)" }}>
              {/* Key — left side */}
              <div className="absolute -left-18 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffca05]/20 border border-[#ffca05] shrink-0" />
                  <span className="text-[8px] text-slate-500 font-semibold hidden md:inline">Mastered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300/10 border border-slate-400 shrink-0" />
                  <span className="text-[8px] text-slate-500 font-semibold hidden md:inline">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0b1827] border border-[#1c3148] shrink-0" />
                  <span className="text-[8px] text-slate-500 font-semibold hidden md:inline">Locked</span>
                </div>
              </div>

              {/* Circle */}
              <div className="relative w-full h-full">
                {allPrinciples.map((principle, idx) => {
                  const pos = getCirclePosition(idx);
                  const isGold = principle.stars === 3;
                  const isSilver = principle.earned && principle.stars < 3;
                  const isUnearned = !principle.earned;

                  return (
                    <motion.div
                      key={principle.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
                      style={{ left: pos.left, top: pos.top }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.06, type: "spring", stiffness: 200 }}
                      title={principle.fullTitle}
                    >
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isGold
                          ? "bg-[#ffca05]/20 border-2 border-[#ffca05] shadow-[0_0_15px_rgba(255,202,5,0.25)]"
                          : isSilver
                            ? "bg-slate-300/10 border-2 border-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.12)]"
                            : "bg-[#0b1827]/80 border-2 border-[#1c3148]"
                          }`}
                        whileHover={{ scale: 1.12 }}
                      >
                        {isGold ? (
                          <Star size={15} className="text-[#ffca05]" fill="#ffca05" />
                        ) : isSilver ? (
                          <Star size={15} className="text-slate-400" fill="currentColor" />
                        ) : (
                          <span className="text-[10px] font-extrabold text-slate-600">{principle.id}</span>
                        )}
                      </motion.div>

                      {isGold && <CheckCircle2 size={10} className="text-[#ffca05]" />}
                      {isSilver && <CheckCircle2 size={10} className="text-slate-400" />}

                      <span className={`text-[7px] font-bold uppercase tracking-tight text-center leading-tight max-w-[48px] ${isGold ? "text-[#ffca05]" : isSilver ? "text-slate-400" : "text-slate-700"
                        }`}>
                        {principle.title}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Center hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-14 h-14 rounded-full bg-[#07121f] border-2 border-[#1c3148] flex flex-col items-center justify-center shadow-lg">
                    <Zap size={16} className="text-[#ffca05]" />
                    <span className="text-base font-black text-white leading-none tabular-nums">{totalScore}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
