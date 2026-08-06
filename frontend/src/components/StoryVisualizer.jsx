import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const StoryVisualizer = ({ visualConcept, dialogueStep = 0, selectedChoice }) => {
  const containerStyle = "absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0";
  const isResolvedCorrect = selectedChoice && selectedChoice.stars === 3;
  const isResolvedWrong = selectedChoice && selectedChoice.stars < 3;

  const renderNodes = () => {
    // Principle 1: Clarity (nodes)
    // Step 0: Blank. Step 1: 400 reports (chaotic). Step 2: argue (warning flashes).
    const showChaos = dialogueStep >= 1 && !selectedChoice;
    const showWarnings = dialogueStep >= 2 && !selectedChoice;
    
    return (
      <div className={containerStyle}>
        {/* The Dashboard Frame */}
        <motion.div 
          className="relative w-[800px] h-[400px] border border-slate-200/50 rounded-xl bg-white/20 backdrop-blur-sm overflow-hidden flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Success State */}
          <AnimatePresence>
            {isResolvedCorrect && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute w-full h-1 bg-emerald-500 shadow-[0_0_30px_5px_rgba(16,185,129,0.5)] origin-left"
              />
            )}
          </AnimatePresence>

          {/* Failure State */}
          <AnimatePresence>
            {isResolvedWrong && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-200/80 backdrop-blur-md flex items-center justify-center"
              >
                <div className="text-4xl font-black text-slate-500 uppercase tracking-widest border-4 border-slate-500 p-6 rounded-lg rotate-[-10deg]">
                  System Paused
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chaos State */}
          <AnimatePresence>
            {showChaos && (
              <motion.div 
                className="absolute inset-0"
                exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
              >
                {[...Array(150)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: [Math.random() * 800 - 400, Math.random() * 800 - 400],
                      y: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                      opacity: showWarnings && i % 5 === 0 ? [1, 0, 1] : 0.4
                    }}
                    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "linear" }}
                    className={`absolute top-1/2 left-1/2 rounded-full ${showWarnings && i % 5 === 0 ? 'w-4 h-4 bg-red-500' : 'w-2 h-2 bg-slate-400'}`}
                  />
                ))}
                {/* Tangled Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  {[...Array(20)].map((_, i) => (
                    <motion.path
                      key={i}
                      d={`M ${Math.random()*800} ${Math.random()*400} Q ${Math.random()*800} ${Math.random()*400}, ${Math.random()*800} ${Math.random()*400}`}
                      fill="transparent"
                      stroke={showWarnings ? "#ef4444" : "#94a3b8"}
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  ))}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  const renderBlocks = () => {
    // Principle 4: Results (blocks/padlocks)
    // Step 0: Network map. Step 1: Padlocks appear.
    const showPadlocks = dialogueStep >= 1 && !selectedChoice;
    const mapRed = dialogueStep >= 2 && !selectedChoice;

    return (
      <div className={containerStyle}>
        <motion.div 
          className="relative w-[700px] h-[500px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Base Network Map */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Grid */}
            <path d="M 10 50 L 90 50 M 50 10 L 50 90" stroke={mapRed ? "#fca5a5" : "#cbd5e1"} strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" fill="transparent" stroke={mapRed ? "#f87171" : "#cbd5e1"} strokeWidth="0.5" strokeDasharray="2 2" />
            
            {/* Glowing active nodes */}
            <circle cx="20" cy="50" r="2" fill={isResolvedWrong ? "#94a3b8" : "#6366f1"} />
            <circle cx="80" cy="50" r="2" fill={isResolvedWrong ? "#94a3b8" : "#6366f1"} />
            <circle cx="50" cy="20" r="2" fill={isResolvedWrong ? "#94a3b8" : "#6366f1"} />
            
            {/* Center Dead Zone */}
            <motion.circle 
              cx="50" cy="50" r="8" 
              fill={isResolvedCorrect ? "#10b981" : (mapRed ? "#ef4444" : "#94a3b8")}
              animate={mapRed ? { r: [8, 12, 8], opacity: [1, 0.5, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            {isResolvedCorrect && (
               <motion.circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="2" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }} />
            )}
          </svg>

          {/* Bureaucracy Padlocks */}
          <AnimatePresence>
            {showPadlocks && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center gap-4"
                exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, rotate: dialogueStep >= 3 ? [0, -10, 10, 0] : 0 }}
                    transition={{ 
                      y: { type: "spring", bounce: 0.5, delay: i * 0.1 },
                      rotate: { repeat: Infinity, duration: 0.5, delay: Math.random() } 
                    }}
                    className="w-12 h-16 bg-slate-800 rounded-t-xl rounded-b-md border-4 border-slate-600 flex flex-col items-center pt-2 shadow-2xl relative"
                  >
                     <div className="w-6 h-6 border-4 border-slate-400 rounded-full absolute -top-8"></div>
                     <div className="w-3 h-4 bg-slate-400 rounded-full mt-2"></div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wrong Choice Tape */}
          {isResolvedWrong && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="absolute top-1/2 left-0 w-full h-12 bg-red-600/80 -translate-y-1/2 rotate-12 flex items-center justify-center overflow-hidden origin-left"
            >
              <div className="text-white font-black uppercase tracking-[0.5em] whitespace-nowrap text-xl">
                RESTRICTED AREA • WAITING FOR APPROVAL • RESTRICTED AREA • WAITING FOR APPROVAL
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  };

  const renderGeneric = () => {
    // Fallback reactive diorama for other principles
    return (
      <div className={containerStyle}>
        <motion.div 
          className="relative flex items-center justify-center w-full h-full"
          animate={{
            backgroundColor: isResolvedCorrect ? "rgba(16, 185, 129, 0.05)" : (isResolvedWrong ? "rgba(148, 163, 184, 0.1)" : "transparent")
          }}
        >
          <motion.div
            className="w-64 h-64 border-2 rounded-full flex items-center justify-center"
            animate={{
              borderColor: isResolvedCorrect ? "#10b981" : (isResolvedWrong ? "#94a3b8" : "#cbd5e1"),
              rotate: selectedChoice ? 0 : 360,
              scale: dialogueStep * 0.1 + 1
            }}
            transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 0.5 } }}
          >
            <motion.div
              className="w-16 h-16 rounded-full"
              animate={{
                backgroundColor: isResolvedCorrect ? "#10b981" : (isResolvedWrong ? "#64748b" : "#6366f1"),
                scale: isResolvedCorrect ? [1, 1.5, 1] : 1
              }}
              transition={isResolvedCorrect ? { repeat: Infinity, duration: 2 } : {}}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  switch (visualConcept) {
    case 'nodes': return renderNodes();
    case 'blocks': return renderBlocks();
    default: return renderGeneric();
  }
};
