import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function VectorStage({
  locationTag = "Kyivstar Operations Command Center",
  isSpeaking = false,
  stageIndex = 0,
}) {
  const canvasRef = useRef(null);

  // 2D Ambient Canvas Particle Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.4 + 0.15,
    }));

    function render() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 199, 0, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    }

    render();

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [stageIndex]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-900 flex items-center justify-between p-6">
      {/* 2D Canvas Ambient Particle Backdrop */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Isometric City & Command Center Backdrop with Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,199,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,199,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Location Badge */}
      <div className="absolute top-4 left-6 z-20 pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg shadow-cyan-950/30 flex items-center gap-2">
        <span>📍 {locationTag}</span>
      </div>

      {/* Anchored 2D Vector Character Stage with Radial Spotlight Glow */}
      <div className="relative z-10 flex flex-col items-center justify-center min-w-[280px]">
        {/* Radial Spotlight Glow Behind Character */}
        <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.25)_0%,transparent_70%)] pointer-events-none blur-xl"></div>

        {/* 2D Character Image with Breathing / Floating Animation */}
        <motion.div
          className={`relative w-64 h-64 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-cyan-400 to-purple-500 shadow-[0_0_40px_rgba(6,182,212,0.4)] ${isSpeaking ? "shadow-[0_0_60px_rgba(255,199,0,0.6)]" : ""}`}
          initial={{ x: -160, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            y: isSpeaking ? [0, -4, 0] : [-4, 4, -4],
          }}
          transition={{
            x: { duration: 0.8, ease: "easeOut" },
            y: { repeat: Infinity, duration: isSpeaking ? 1.4 : 4, ease: "easeInOut" },
          }}
          key={stageIndex}
        >
          <img src="/kaan_avatar.jpg" alt="2D Executive Avatar" className="w-full h-full rounded-full object-cover object-top" />

          {/* Audio Wave Visualizer Indicator */}
          {isSpeaking && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-5 z-20">
              <span className="w-1 bg-amber-400 rounded-full animate-[wave_0.7s_infinite_alternate]"></span>
              <span className="w-1 bg-amber-400 rounded-full animate-[wave_0.7s_infinite_alternate_0.2s] h-4"></span>
              <span className="w-1 bg-amber-400 rounded-full animate-[wave_0.7s_infinite_alternate_0.4s] h-5"></span>
              <span className="w-1 bg-amber-400 rounded-full animate-[wave_0.7s_infinite_alternate_0.15s] h-3"></span>
            </div>
          )}
        </motion.div>

        {/* Character Nameplate Badge */}
        <div className="mt-3 bg-slate-900/90 border border-amber-400/50 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg shadow-black/50 z-20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
          <span>Kaan Terzioğlu • VEON Leader</span>
        </div>
      </div>
    </div>
  );
}
