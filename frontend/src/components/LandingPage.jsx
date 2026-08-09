import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Award, Star } from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage({ onEnter }) {
  const [showContent, setShowContent] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(t);
  }, []);

  function handleEnter() {
    setIsTransitioning(true);
    setTimeout(onEnter, 800);
  }

  if (isTransitioning) {
    return (
      <motion.div
        className="absolute inset-0 bg-[#020811] z-[200] flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="text-center"
          animate={{ scale: [1, 1.6], opacity: [1, 0] }}
          transition={{ duration: 0.6, ease: "easeIn" }}
        >
          <Star size={48} className="mx-auto text-[#ffca05] mb-3" fill="#ffca05" />
          <p className="text-[#ffca05] font-black uppercase tracking-[0.4em] text-sm">Entering VEONVERSE</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#020811] overflow-hidden z-[150] flex flex-col items-center justify-center">
      {/* Spotlight */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 35%, rgba(255,202,5,0.07) 0%, transparent 55%)",
      }} />

      {/* Left curtain */}
      <AnimatePresence>
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1/2 z-10 pointer-events-none"
          initial={{ x: 0 }}
          animate={{ x: showContent ? "-55%" : 0 }}
          transition={{ duration: 1.2, ease: [0.6, 0, 0.4, 1], delay: 0.2 }}
        >
          <div className="w-full h-full flex">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{
                  background: `linear-gradient(90deg, 
                    rgba(2,8,17,1) 0%, 
                    rgba(8,20,35,${1 - i * 0.03}) 40%, 
                    rgba(14,28,48,${0.8 - i * 0.03}) 70%, 
                    rgba(2,8,17,1) 100%)`,
                }}
              />
            ))}
          </div>
          {/* Gold trim along curtain edge */}
          <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#8a6400] via-[#ffca05] to-[#8a6400]" />
        </motion.div>
      </AnimatePresence>

      {/* Right curtain */}
      <AnimatePresence>
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-1/2 z-10 pointer-events-none"
          initial={{ x: 0 }}
          animate={{ x: showContent ? "55%" : 0 }}
          transition={{ duration: 1.2, ease: [0.6, 0, 0.4, 1], delay: 0.2 }}
        >
          <div className="w-full h-full flex">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{
                  background: `linear-gradient(90deg, 
                    rgba(2,8,17,1) 0%, 
                    rgba(14,28,48,${0.8 - i * 0.03}) 30%, 
                    rgba(8,20,35,${1 - i * 0.03}) 60%, 
                    rgba(2,8,17,1) 100%)`,
                }}
              />
            ))}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#8a6400] via-[#ffca05] to-[#8a6400]" />
        </motion.div>
      </AnimatePresence>

      {/* Left Column */}
      <motion.div
        className="absolute left-[12%] md:left-[18%] top-[10%] bottom-[10%] w-12 md:w-16 flex flex-col items-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        {/* Column capital */}
        <div className="w-full h-10 md:h-14 border-2 border-[#ffca05]/30 border-b-0 rounded-t-lg bg-gradient-to-b from-[#ffca05]/10 to-transparent" />
        {/* Column shaft */}
        <div className="flex-1 w-full border-x-2 border-[#ffca05]/20 bg-gradient-to-r from-[#0a1726] via-[#07121f] to-[#0a1726]" />
        {/* Column base */}
        <div className="w-full h-10 md:h-14 border-2 border-[#ffca05]/30 border-t-0 rounded-b-lg bg-gradient-to-t from-[#ffca05]/10 to-transparent" />
      </motion.div>

      {/* Right Column */}
      <motion.div
        className="absolute right-[12%] md:right-[18%] top-[10%] bottom-[10%] w-12 md:w-16 flex flex-col items-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        <div className="w-full h-10 md:h-14 border-2 border-[#ffca05]/30 border-b-0 rounded-t-lg bg-gradient-to-b from-[#ffca05]/10 to-transparent" />
        <div className="flex-1 w-full border-x-2 border-[#ffca05]/20 bg-gradient-to-r from-[#0a1726] via-[#07121f] to-[#0a1726]" />
        <div className="w-full h-10 md:h-14 border-2 border-[#ffca05]/30 border-t-0 rounded-b-lg bg-gradient-to-t from-[#ffca05]/10 to-transparent" />
      </motion.div>

      {/* Top architectural arch */}
      <motion.div
        className="absolute top-[8%] md:top-[6%] left-1/2 -translate-x-1/2 w-[60%] max-w-lg h-1 bg-gradient-to-r from-transparent via-[#ffca05]/40 to-transparent rounded-full pointer-events-none"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: showContent ? 1 : 0, scaleX: showContent ? 1 : 0 }}
        transition={{ delay: 1.0, duration: 1 }}
      />

      {/* Bottom architectural base line */}
      <motion.div
        className="absolute bottom-[10%] md:bottom-[8%] left-1/2 -translate-x-1/2 w-[70%] max-w-2xl h-px bg-gradient-to-r from-transparent via-[#ffca05]/30 to-transparent pointer-events-none"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: showContent ? 1 : 0, scaleX: showContent ? 1 : 0 }}
        transition={{ delay: 1.0, duration: 1 }}
      />

      {/* Center Stage Content */}
      <motion.div
        className="relative z-20 flex flex-col items-center gap-6 md:gap-8 px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        {/* VEONVERSE branding */}
        <div className="space-y-2">
          <p className="text-[9px] md:text-[10px] font-black tracking-[0.5em] text-[#ffca05]/60 uppercase">
            The Executive Leadership Platform
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-100">
            VEON<span className="text-[#ffca05]">VERSE</span>
          </h1>
        </div>

        {/* Gold divider in place of the former portrait */}
        <motion.div
          className="w-24 h-px bg-gradient-to-r from-transparent via-[#ffca05]/50 to-transparent"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: showContent ? 1 : 0, scaleX: showContent ? 1 : 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        />

        {/* Tagline */}
        <motion.p
          className="text-sm md:text-base text-slate-400 font-medium max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ delay: 1.6 }}
        >
          10 Leadership Principles. One Voice. Your journey to becoming a VEON leader begins now.
        </motion.p>

        {/* Accolade row */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ delay: 1.8 }}
        >
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-[#ffca05]/60" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">10 Principles</span>
          </div>
          <div className="w-px h-4 bg-[#1c3148]" />
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-[#ffca05]/60" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Scenario-Based</span>
          </div>
          <div className="w-px h-4 bg-[#1c3148]" />
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-[#ffca05]/60" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Earn Badges</span>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          className="mt-4 bg-[#ffca05] hover:bg-[#ffd84d] text-[#03101f] font-extrabold px-10 py-3.5 rounded-full text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(255,202,5,0.25)] hover:shadow-[0_0_50px_rgba(255,202,5,0.4)] transition-all cursor-pointer flex items-center gap-3 group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 2.0, duration: 0.6 }}
          onClick={handleEnter}
        >
          <span>Take Your Seat</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>
    </div>
  );
}
