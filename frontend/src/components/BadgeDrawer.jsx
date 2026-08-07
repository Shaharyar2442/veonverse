import { AnimatePresence, motion } from "framer-motion";
import { Award, Star, X, Zap } from "lucide-react";

export default function BadgeDrawer({ isOpen, badges, totalScore = 0, onClose }) {
  const badgeEntries = Array.from(badges.entries()).map(([stageIndex, data]) => ({
    ...data,
    stageIndex,
  }));

  const maxPossible = 10;
  const correctCount = badgeEntries.filter((e) => e.stars === 3).length;

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
            className="fixed inset-x-0 bottom-0 z-[101] bg-[#030b16]/98 backdrop-blur-xl border-t border-[#1c3148] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.5)] max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#29435f] [&::-webkit-scrollbar-thumb]:rounded-full"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#29435f]" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c3148]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffca05]/10 border border-[#ffca05]/30 flex items-center justify-center">
                  <Award size={22} className="text-[#ffca05]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-100">Your Achievements</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {badges.size} of {maxPossible} badges earned
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

            {/* Score Summary */}
            <div className="px-6 pt-4 pb-2">
              <div className="bg-[#07121f] border border-[#1c3148] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ffca05]/15 flex items-center justify-center">
                    <Zap size={20} className="text-[#ffca05]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-100">Total Score</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {correctCount} perfect decisions &middot; {maxPossible} principles
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-black text-[#ffca05] tabular-nums">{totalScore}</span>
              </div>
            </div>

            {/* Badge Grid */}
            <div className="p-6 pt-2">
              {badgeEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#0b1827] border border-[#29435f] flex items-center justify-center">
                    <Award size={24} className="text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">No badges yet</p>
                  <p className="text-xs text-slate-600 mt-1">Complete a leadership scenario to earn your first badge</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {badgeEntries.map((entry, i) => (
                    <motion.div
                      key={entry.stageIndex}
                      className="bg-[#07121f] border border-[#1c3148] rounded-xl p-3.5 flex items-start gap-3 hover:border-[#ffca05]/40 transition-colors"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        entry.stars === 3
                          ? "bg-[#ffca05]/15 border border-[#ffca05]/40"
                          : "bg-slate-400/10 border border-slate-400/30"
                      }`}>
                        <Award size={20} className={entry.stars === 3 ? "text-[#ffca05]" : "text-slate-400"} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-extrabold text-slate-100 truncate">{entry.badge}</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{entry.principleTitle}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                size={10}
                                className={s <= entry.stars ? "text-[#ffca05]" : "text-slate-600"}
                                fill={s <= entry.stars ? "#ffca05" : "none"}
                              />
                            ))}
                          </div>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            entry.stars === 3
                              ? "bg-[#ffca05]/10 text-[#ffca05] border border-[#ffca05]/25"
                              : "bg-slate-400/10 text-slate-400 border border-slate-400/25"
                          }`}>
                            {entry.score} pts
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
