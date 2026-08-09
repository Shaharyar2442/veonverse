import { AnimatePresence, motion } from "framer-motion";
import { Award, Star, X, Zap } from "lucide-react";
import { C_FACTOR_SCENARIOS } from "../data/cFactorScenarios";

const TOTAL = C_FACTOR_SCENARIOS.length;

// Journey-path geometry. Nodes alternate between two rows and are joined by a
// dotted curve, so every principle keeps its full title on its own column.
const STEP = 138;      // horizontal spacing per principle
const NODE = 54;       // badge diameter
const ROW_HIGH = 68;   // centre-y of the raised nodes
const ROW_LOW = 124;   // centre-y of the lowered nodes
const AREA_HEIGHT = 224;
const TRACK_WIDTH = TOTAL * STEP;

function nodeCentre(index) {
  return {
    x: index * STEP + STEP / 2,
    y: index % 2 === 0 ? ROW_HIGH : ROW_LOW,
  };
}

// Smooth S-curve through every node centre, drawn dotted behind the badges.
function buildTrackPath() {
  const points = C_FACTOR_SCENARIOS.map((_, i) => nodeCentre(i));
  const curves = points.slice(1).map((point, i) => {
    const prev = points[i];
    const handle = STEP / 2;
    return `C ${prev.x + handle} ${prev.y}, ${point.x - handle} ${point.y}, ${point.x} ${point.y}`;
  });
  return `M ${points[0].x} ${points[0].y} ${curves.join(" ")}`;
}

const TRACK_PATH = buildTrackPath();

export default function BadgeDrawer({ isOpen, badges, totalScore = 0, onClose }) {
  const allPrinciples = C_FACTOR_SCENARIOS.map((s, idx) => {
    const earned = badges.get(idx);
    return {
      id: s.stageId,
      title: s.principleTitle,
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
            className="fixed inset-x-0 bottom-0 z-[101] bg-[#030b16]/98 backdrop-blur-xl border-t border-[#1c3148] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#29435f] [&::-webkit-scrollbar-thumb]:rounded-full"
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

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07121f] border border-[#1c3148]">
                  <Zap size={14} className="text-[#ffca05]" />
                  <span className="text-sm font-black text-white tabular-nums leading-none">{totalScore}</span>
                </div>
                <button
                  className="w-9 h-9 rounded-full bg-[#0b1827] border border-[#29435f] hover:border-[#ffca05] hover:bg-[#ffca05]/10 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Journey path — scrolls sideways only if the viewport is narrower than the track */}
            <div className="overflow-x-auto overflow-y-hidden px-6 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#29435f] [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="relative mx-auto" style={{ width: TRACK_WIDTH, height: AREA_HEIGHT }}>
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={TRACK_WIDTH}
                  height={AREA_HEIGHT}
                  aria-hidden="true"
                >
                  <path
                    d={TRACK_PATH}
                    fill="none"
                    stroke="#ffca05"
                    strokeOpacity="0.4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="1 10"
                  />
                </svg>

                {allPrinciples.map((principle, idx) => {
                  const { x, y } = nodeCentre(idx);
                  const isGold = principle.stars === 3;
                  const isSilver = principle.earned && principle.stars < 3;

                  return (
                    <motion.div
                      key={principle.id}
                      className="absolute flex flex-col items-center"
                      style={{ left: x - STEP / 2, top: y - NODE / 2, width: STEP }}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05, type: "spring", stiffness: 220, damping: 18 }}
                      title={
                        principle.earned
                          ? `${principle.title} — ${principle.badge} (${principle.score} pts)`
                          : `${principle.title} — locked`
                      }
                    >
                      <div className="relative">
                        {/* Step number */}
                        <span
                          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black tabular-nums shadow-sm ${
                            principle.earned
                              ? "bg-[#ffca05] text-[#03101f]"
                              : "bg-[#17273a] text-slate-400 border border-[#29435f]"
                          }`}
                        >
                          {principle.id}
                        </span>

                        <motion.div
                          className={`rounded-2xl flex items-center justify-center border-2 transition-colors ${
                            isGold
                              ? "bg-[#ffca05]/15 border-[#ffca05] shadow-[0_0_20px_rgba(255,202,5,0.28)]"
                              : isSilver
                              ? "bg-slate-300/10 border-slate-400 shadow-[0_0_14px_rgba(148,163,184,0.15)]"
                              : "bg-[#0b1827] border-[#1c3148]"
                          }`}
                          style={{ width: NODE, height: NODE }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Star
                            size={24}
                            className={isGold ? "text-[#ffca05]" : isSilver ? "text-slate-300" : "text-[#29435f]"}
                            fill={isGold ? "#ffca05" : isSilver ? "currentColor" : "none"}
                          />
                        </motion.div>
                      </div>

                      <span
                        className={`mt-2.5 px-1 text-[10px] font-bold uppercase tracking-tight text-center leading-[1.3] ${
                          isGold ? "text-[#ffca05]" : isSilver ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {principle.title}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Key */}
            <div className="flex items-center justify-center gap-5 pt-2 pb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffca05]/20 border border-[#ffca05]" />
                <span className="text-[10px] text-slate-500 font-medium">Mastered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300/10 border border-slate-400" />
                <span className="text-[10px] text-slate-500 font-medium">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0b1827] border border-[#1c3148]" />
                <span className="text-[10px] text-slate-500 font-medium">Locked</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
