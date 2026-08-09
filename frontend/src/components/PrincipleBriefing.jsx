import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { anamAvatar } from "../services/anamAvatar";

const PARTICLES = Array.from({ length: 60 }, (_, i) => {
  const angle = (360 / 60) * i + (Math.random() - 0.5) * 15;
  const rad = (angle * Math.PI) / 180;
  const dist = 100 + Math.random() * 180;
  const size = 3 + Math.random() * 7;
  return { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, delay: Math.random() * 0.25, size };
});

export default function PrincipleBriefing({ scenario, onBegin }) {
  const [phase, setPhase] = useState("idle");
  const spoken = useRef(false);
  const timers = useRef([]);
  const particles = useMemo(() => PARTICLES, [scenario.stageId]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    spoken.current = false;
    setPhase("idle");

    const t0 = setTimeout(() => setPhase("approach"), 400);
    const t1 = setTimeout(() => setPhase("collide"), 3000);
    const t2 = setTimeout(() => setPhase("title"), 3500);
    const t3 = setTimeout(() => setPhase("content"), 4100);
    const t4 = setTimeout(() => setPhase("ready"), 4800);

    timers.current = [t0, t1, t2, t3, t4];
    return () => timers.current.forEach(clearTimeout);
  }, [scenario.stageId]);

  useEffect(() => {
    if (phase === "title" && !spoken.current) {
      spoken.current = true;
      anamAvatar.speak(scenario.teachingBrief);
    }
  }, [phase]);

  const contentVisible = phase === "content" || phase === "ready";
  const titleVisible = phase === "title" || contentVisible;
  const duelActive = phase === "approach" || phase === "collide";

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
      animate={phase === "collide" ? { x: [0, -4, 6, -3, 2, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* ── COLLISION FLASH ── */}
      <AnimatePresence>
        {phase === "collide" && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 300, height: 300,
              left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(255,202,5,0.4) 0%, rgba(255,202,5,0.1) 40%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* ── RING WAVE ── */}
      <AnimatePresence>
        {phase === "collide" && (
          <motion.div
            className="absolute rounded-full border-2 border-[#ffca05]/60 pointer-events-none"
            style={{ width: 160, height: 160, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* ── PARTICLES ── */}
      <AnimatePresence>
        {phase === "collide" && particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size, height: p.size,
              background: i % 4 === 0 ? "#fff1a6" : i % 4 === 1 ? "#ffca05" : i % 4 === 2 ? "#ffd84d" : "#ffe88a",
              boxShadow: i % 6 === 0 ? "0 0 6px rgba(255,202,5,0.8)" : "none",
              left: "50%", top: "50%",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* ── TENSION DUEL ORBS ── */}
      <AnimatePresence>
        {duelActive && (
          <>
            {/* Left orb — gold */}
            <motion.div
              className="absolute rounded-full flex items-center justify-center pointer-events-none"
              style={{
                width: 130, height: 130,
                background: "radial-gradient(circle at 40% 35%, #ffd84d 0%, #ffca05 35%, #b88600 100%)",
                boxShadow: "0 0 80px rgba(255,202,5,0.5), 0 0 160px rgba(255,202,5,0.2), inset 0 0 30px rgba(255,255,255,0.1)",
                left: "50%", top: "50%",
              }}
              initial={{ x: -400, y: -10, scale: 0, opacity: 0 }}
              animate={{
                x: 0, y: 0,
                scale: phase === "collide" ? 0 : 1,
                opacity: phase === "collide" ? 0 : 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                x: { duration: 2.4, ease: [0.25, 0.1, 0.25, 1] },
                y: { duration: 2.4, ease: [0.25, 0.1, 0.25, 1] },
                scale: { duration: 0.4, ease: "easeIn" },
                opacity: { duration: 0.4 },
              }}
            >
              <span className="text-[12px] font-extrabold text-[#03101f] text-center leading-tight px-4">
                {scenario.leftForce}
              </span>
            </motion.div>

            {/* Right orb — grey */}
            <motion.div
              className="absolute rounded-full flex items-center justify-center pointer-events-none"
              style={{
                width: 130, height: 130,
                background: "radial-gradient(circle at 40% 35%, #708198 0%, #4a5568 40%, #2d3748 100%)",
                boxShadow: "0 0 50px rgba(112,129,152,0.35), inset 0 0 20px rgba(255,255,255,0.05)",
                left: "50%", top: "50%",
              }}
              initial={{ x: 400, y: -10, scale: 0, opacity: 0 }}
              animate={{
                x: 0, y: 0,
                scale: phase === "collide" ? 0 : 1,
                opacity: phase === "collide" ? 0 : 0.5,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                x: { duration: 2.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 },
                y: { duration: 2.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 },
                scale: { duration: 0.4, ease: "easeIn" },
                opacity: { duration: 0.4 },
              }}
            >
              <span className="text-[12px] font-extrabold text-slate-200 text-center leading-tight px-4">
                {scenario.rightForce}
              </span>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TITLE REVEAL ── */}
      <AnimatePresence>
        {titleVisible && (
          <motion.div
            className="text-center px-6"
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
          >
            <motion.p
              className="text-[10px] font-black text-[#ffca05]/70 uppercase tracking-[0.4em] mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Leadership Principle
            </motion.p>
            <motion.h1
              className="text-3xl md:text-5xl font-black text-white leading-tight max-w-lg mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {scenario.principleTitle}
            </motion.h1>
            <motion.div
              className="mt-4 inline-block"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <span className="text-[11px] font-bold text-[#ffca05] bg-[#ffca05]/10 border border-[#ffca05]/30 px-4 py-1.5 rounded-full uppercase tracking-wider">
                {scenario.stageName}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TEACHING TEXT + CARDS ── */}
      <AnimatePresence>
        {contentVisible && (
          <motion.div
            className="w-[90%] max-w-2xl pointer-events-auto mt-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-[#07121f]/95 backdrop-blur-xl border border-[#1c3148] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)] p-5 md:p-6 space-y-4">

              <motion.div
                className="bg-[#030b16]/60 border border-[#1c3148] rounded-xl p-4"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-sm leading-relaxed text-slate-300">
                  {scenario.teachingBrief}
                </p>
              </motion.div>

              {scenario.behaviourStatement && (
                <motion.div
                  className="border-l-2 border-[#ffca05] bg-[#ffca05]/[0.06] rounded-r-lg px-4 py-3"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 }}
                >
                  <p className="text-sm font-semibold leading-relaxed text-[#ffca05]">
                    {scenario.behaviourStatement}
                  </p>
                </motion.div>
              )}

              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-[#030b16]/80 border border-[#1c3148] rounded-xl p-3 w-full max-w-md">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Shield size={13} className="text-[#ffca05]" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">The Tension</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-extrabold text-[#ffca05]">{scenario.leftForce}</span>
                    <motion.div
                      className="h-px flex-1 bg-[#1c3148]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      style={{ transformOrigin: "left" }}
                    />
                    <span className="text-[12px] font-extrabold text-slate-400">{scenario.rightForce}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA ── */}
      <AnimatePresence>
        {phase === "ready" && (
          <motion.div
            className="pointer-events-auto mt-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <motion.button
              className="bg-[#ffca05] hover:bg-[#ffd84d] text-[#03101f] font-extrabold px-10 py-3.5 rounded-full text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(255,202,5,0.25)] hover:shadow-[0_0_50px_rgba(255,202,5,0.4)] transition-all cursor-pointer flex items-center gap-3 group"
              onClick={onBegin}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
            >
              <span>Accept Challenge</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
