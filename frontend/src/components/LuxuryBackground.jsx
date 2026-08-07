import { motion } from "framer-motion";
import { useMemo } from "react";

const PARTICLE_COUNT = 25;
const BEAM_ANGLES = [-35, -20, 15, 28];

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const size = 2 + (i % 5);
    const opacity = 0.1 + (i % 4) * 0.05;
    const duration = 8 + (i % 9) * 1.5;
    const delay = (i * 0.7) % duration;
    const xStart = 10 + (i * 17) % 80;
    const xDrift = -8 + (i % 17);
    return { size, opacity, duration, delay, xStart, xDrift };
  });
}

export default function LuxuryBackground() {
  const particles = useMemo(generateParticles, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* ── LIGHT BEAMS ── */}
      {BEAM_ANGLES.map((angle, i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute"
          style={{
            width: "200%",
            height: "120%",
            left: "-50%",
            top: "-10%",
            background: `linear-gradient(${angle}deg, transparent 30%, rgba(255,202,5,${0.03 + i * 0.012}) 48%, rgba(255,202,5,${0.05 + i * 0.015}) 50%, rgba(255,202,5,${0.03 + i * 0.012}) 52%, transparent 70%)`,
          }}
          animate={{
            x: ["-5%", "5%"],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            x: { duration: 18 + i * 4, repeat: Infinity, repeatType: "reverse", ease: "linear" },
            opacity: { duration: 14 + i * 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
          }}
        />
      ))}

      {/* ── GOLDEN LIGHT RAIN ── */}
      {particles.map((p, i) => (
        <motion.div
          key={`rain-${i}`}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(255,202,5,${p.opacity + 0.1}) 0%, rgba(255,202,5,${p.opacity * 0.3}) 100%)`,
            boxShadow: i % 7 === 0 ? `0 0 ${p.size * 3}px rgba(255,202,5,0.3)` : "none",
            left: `${p.xStart}%`,
            bottom: "-5%",
          }}
          animate={{
            y: ["0%", "-110%"],
            x: [0, p.xDrift],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
            times: [0, 0.15, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}
