import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Award, RotateCcw, Sparkles, Star, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { anamAvatar } from "../services/anamAvatar";

const STAR_POSITIONS = [
  { top: "10%", left: "15%" },
  { top: "8%", left: "45%" },
  { top: "12%", left: "75%" },
  { top: "30%", left: "8%" },
  { top: "35%", left: "88%" },
  { top: "55%", left: "10%" },
  { top: "60%", left: "85%" },
  { top: "78%", left: "20%" },
  { top: "75%", left: "55%" },
  { top: "80%", left: "78%" },
];

export default function CompletionOverlay({ totalScore, correctCount, totalStages, earnedBadges, onRestart }) {
  const isPerfect = correctCount === totalStages;
  const [displayScore, setDisplayScore] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    if (isPerfect) {
      // Big celebration
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#ffca05", "#ffd84d", "#fff1a6", "#ffffff"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#ffca05", "#ffd84d", "#fff1a6", "#ffffff"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      // Burst from center
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { x: 0.5, y: 0.5 },
          colors: ["#ffca05", "#ffd84d", "#fff1a6", "#ffffff"],
          startVelocity: 45,
          ticks: 200,
        });
      }, 1200);
    } else {
      // Milder celebration
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { x: 0.5, y: 0.5 },
          colors: ["#ffca05", "#ffd84d", "#fff1a6", "#ffffff"],
          startVelocity: 25,
          ticks: 100,
        });
      }, 600);
    }

    // Score count-up
    const duration = isPerfect ? 2500 : 1500;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * totalScore));
      if (progress < 1) requestAnimationFrame(tick);
      else setShowContent(true);
    };
    tick();

    // Speak congratulation
    const speechText = isPerfect
      ? "Outstanding. You've mastered all ten VEON leadership principles with perfect clarity and conviction. You are a true VEONVERSE Leadership Master. Your score: " + totalScore + " points. Congratulations on this remarkable achievement."
      : "Well done. You completed all ten VEON leadership principles. Your score is " + totalScore + " points. " + correctCount + " out of " + totalStages + " perfect decisions. Every step makes you a stronger leader. Congratulations.";
    anamAvatar.speak(speechText, 0.9);
  }, []);

  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(255,202,5,0.18),transparent_35%),linear-gradient(135deg,#020811_0%,#06101c_52%,#020811_100%)]">
      {/* Floating stars in background */}
      {STAR_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: pos.top, left: pos.left }}
          animate={{
            rotate: [0, 360],
            scale: [0.6, 1.4, 0.6],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 3 + (i % 3) * 1.2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          <Star
            size={isPerfect ? 20 : 14}
            className="text-[#ffca05]/50"
            fill="currentColor"
          />
        </motion.div>
      ))}

      {/* Kaan's Portrait */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 150 }}
      >
        {/* Glow rings */}
        <motion.div
          className={`absolute -inset-8 rounded-full blur-2xl ${
            isPerfect ? "bg-[#ffca05]/20" : "bg-[#ffca05]/10"
          }`}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute -inset-4 rounded-full border-2 border-[#ffca05]/30"
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
        />
        <div className={`relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#8a6400] via-[#ffca05] to-[#fff1a6] shadow-xl ${
          isPerfect ? "ring-4 ring-[#ffca05]/40 shadow-amber-400/30" : ""
        }`}>
          <img
            src="/kaan_avatar.jpg"
            alt="Kaan Terzioglu"
            className="w-full h-full rounded-full object-cover object-top border-2 border-[#0b1827]"
          />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {isPerfect && (
          <motion.div
            className="flex items-center justify-center gap-2 mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Sparkles size={18} className="text-[#ffca05]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffca05]">
              Perfect Score
            </span>
            <Sparkles size={18} className="text-[#ffca05]" />
          </motion.div>
        )}
        <h1 className={`font-black tracking-tight ${isPerfect ? "text-4xl text-white" : "text-2xl text-slate-100"}`}>
          {isPerfect ? "Leadership Master" : "Great Effort, Leader"}
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          {isPerfect
            ? "You've demonstrated mastery across all ten VEON leadership principles. Flawless execution."
            : "You completed all ten principles. Every decision builds a stronger leadership foundation."}
        </p>
      </motion.div>

      {/* Score reveal */}
      <motion.div
        className="flex items-center justify-center gap-6 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-center">
          <div className="flex items-center gap-2">
            <Zap size={22} className="text-[#ffca05]" />
            <span className="text-5xl font-black text-white tabular-nums">{displayScore}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Points</p>
        </div>

        {showContent && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <p className={`text-4xl font-black ${isPerfect ? "text-[#ffca05]" : "text-slate-200"}`}>
              {correctCount}<span className="text-lg text-slate-500">/{totalStages}</span>
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Perfect Decisions</p>
          </motion.div>
        )}
      </motion.div>

      {/* Badges collected line */}
      {showContent && (
        <motion.div
          className="flex items-center gap-2 mt-5 px-4 py-2 rounded-full border border-[#1c3148] bg-[#07121f]/80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Award size={14} className="text-[#ffca05]" />
          <span className="text-xs font-bold text-slate-300">
            {earnedBadges.size > 0
              ? `${earnedBadges.size} badge${earnedBadges.size !== 1 ? "s" : ""} earned`
              : "Badges earned"}
          </span>
        </motion.div>
      )}

      {/* Restart */}
      {showContent && (
        <motion.button
          className="mt-8 rounded-full bg-[#ffca05] hover:bg-[#ffd84d] text-[#03101f] font-extrabold px-8 py-3 text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-amber-400/20 transition-all cursor-pointer flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onRestart}
        >
          <RotateCcw size={16} />
          Start again
        </motion.button>
      )}
    </section>
  );
}
