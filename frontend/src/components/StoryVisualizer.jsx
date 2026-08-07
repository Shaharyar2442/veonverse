import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NODES_PARTICLE_SEED = Array.from({ length: 150 }, (_, i) => {
  const x1 = ((i * 37 + 13) % 800) - 400;
  const y1 = ((i * 53 + 7) % 400) - 200;
  const x2 = ((i * 73 + 29) % 800) - 400;
  const y2 = ((i * 41 + 19) % 400) - 200;
  const dur = 4 + ((i * 17) % 20) / 10;
  return { x1, y1, x2, y2, dur, isWarning: i % 5 === 0 };
});

const NODES_PATH_SEED = Array.from({ length: 20 }, (_, i) => {
  const sx = (i * 91 + 23) % 800;
  const sy = (i * 67 + 17) % 400;
  const c1x = (i * 43 + 31) % 800;
  const c1y = (i * 127 + 11) % 400;
  const ex = (i * 61 + 47) % 800;
  const ey = (i * 83 + 13) % 400;
  return { sx, sy, c1x, c1y, ex, ey };
});

export const StoryVisualizer = ({ visualConcept, dialogueStep = 0, selectedChoice }) => {
  const containerStyle = "absolute inset-0 flex items-center justify-center -translate-y-10 md:-translate-y-14 overflow-hidden pointer-events-none z-0";
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
          className="relative w-[800px] h-[400px] border border-[#29435f] rounded-xl bg-[#07121f]/70 backdrop-blur-sm overflow-hidden flex items-center justify-center"
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
                className="absolute w-full h-1 bg-[#ffca05] shadow-[0_0_30px_5px_rgba(255,202,5,0.45)] origin-left"
              />
            )}
          </AnimatePresence>

          {/* Failure State */}
          <AnimatePresence>
            {isResolvedWrong && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#07121f]/90 backdrop-blur-md flex items-center justify-center"
              >
                <div className="text-4xl font-black text-slate-400 uppercase tracking-widest border-4 border-slate-500 p-6 rounded-lg rotate-[-10deg]">
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
                {NODES_PARTICLE_SEED.map((p, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: [p.x1, p.x2],
                      y: [p.y1, p.y2],
                      opacity: showWarnings && p.isWarning ? [1, 0, 1] : 0.4
                    }}
                    transition={{ duration: p.dur, repeat: Infinity, ease: "linear" }}
                    className={`absolute top-1/2 left-1/2 rounded-full ${showWarnings && p.isWarning ? 'w-4 h-4 bg-[#ffca05]' : 'w-2 h-2 bg-[#54718f]'}`}
                  />
                ))}
                {/* Tangled Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  {NODES_PATH_SEED.map((p, i) => (
                    <motion.path
                      key={i}
                      d={`M ${p.sx} ${p.sy} Q ${p.c1x} ${p.c1y}, ${p.ex} ${p.ey}`}
                      fill="transparent"
                      stroke={showWarnings ? "#ffca05" : "#54718f"}
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
            <path d="M 10 50 L 90 50 M 50 10 L 50 90" stroke={mapRed ? "#ffca05" : "#29435f"} strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" fill="transparent" stroke={mapRed ? "#ffca05" : "#29435f"} strokeWidth="0.5" strokeDasharray="2 2" />
            
            {/* Glowing active nodes */}
            <circle cx="20" cy="50" r="2" fill={isResolvedWrong ? "#54718f" : "#ffca05"} />
            <circle cx="80" cy="50" r="2" fill={isResolvedWrong ? "#54718f" : "#ffca05"} />
            <circle cx="50" cy="20" r="2" fill={isResolvedWrong ? "#54718f" : "#ffca05"} />
            
            {/* Center Dead Zone */}
            <motion.circle 
              cx="50" cy="50" r="8" 
              fill={isResolvedCorrect ? "#ffca05" : (mapRed ? "#ffca05" : "#54718f")}
              animate={mapRed ? { r: [8, 12, 8], opacity: [1, 0.5, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            {isResolvedCorrect && (
               <motion.circle cx="50" cy="50" r="40" fill="transparent" stroke="#ffca05" strokeWidth="2" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }} />
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
                    className="w-12 h-16 bg-[#0b1827] rounded-t-xl rounded-b-md border-4 border-[#54718f] flex flex-col items-center pt-2 shadow-2xl relative"
                  >
                     <div className="w-6 h-6 border-4 border-[#8aa4bd] rounded-full absolute -top-8"></div>
                     <div className="w-3 h-4 bg-[#8aa4bd] rounded-full mt-2"></div>
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
              className="absolute top-1/2 left-0 w-full h-12 bg-[#b97800]/80 -translate-y-1/2 rotate-12 flex items-center justify-center overflow-hidden origin-left"
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

  const renderSvgScene = (children, label) => (
    <div className={containerStyle} aria-label={label} role="img">
      <motion.svg
        viewBox="0 0 800 440"
        className="w-full max-w-5xl h-[min(58vw,440px)]"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55 }}
      >
        {children}
      </motion.svg>
    </div>
  );

  const outcomeColor = isResolvedCorrect ? "#ffca05" : isResolvedWrong ? "#54718f" : "#ffca05";
  const dangerColor = isResolvedWrong ? "#54718f" : "#ffca05";

  const renderOrbit = () => renderSvgScene(<>
    <motion.circle cx="400" cy="220" r="42" fill="#0b1827" stroke={outcomeColor} strokeWidth="3" animate={{ scale: isResolvedCorrect ? [1, 1.12, 1] : 1 }} transition={{ duration: 1.8, repeat: Infinity }} />
    <text x="400" y="227" textAnchor="middle" className="fill-slate-100 text-[16px] font-bold">IDEA</text>
    {[110, 165].map((radius, index) => <motion.circle key={radius} cx="400" cy="220" r={radius} fill="none" stroke={index ? "#29435f" : "#ffca05"} strokeWidth="2" strokeDasharray={index ? "5 8" : ""} animate={{ rotate: selectedChoice ? 0 : 360 }} transition={{ duration: 11 + index * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "400px 220px" }} />)}
    {[0, 120, 240].map((angle, index) => <motion.g key={angle} transform={`rotate(${angle} 400 220)`}><motion.circle cx="400" cy="110" r="12" fill={index === 0 && dialogueStep >= 2 ? dangerColor : "#ffca05"} animate={index === 0 && dialogueStep >= 2 ? { cx: isResolvedCorrect ? [400, 245, 400] : 400 } : {}} transition={{ duration: 1.2 }} /><circle cx="400" cy="110" r="4" fill="#07121f" /></motion.g>)}
    {isResolvedCorrect && <motion.path d="M 238 220 C 155 170 170 75 290 68" fill="none" stroke="#ffca05" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />}
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">BREAK THE ORBIT</text>
  </>, "An idea breaking out of an orbit");

  const renderPulse = () => renderSvgScene(<>
    {[120, 190, 260, 330].map(y => <path key={y} d={`M 95 ${y} H 705`} stroke="#29435f" strokeWidth="1" />)}
    <motion.path d={isResolvedCorrect ? "M 95 270 H 220 L 275 270 L 315 125 L 360 350 L 415 190 L 470 270 H 705" : "M 95 270 H 705"} fill="none" stroke={isResolvedCorrect ? "#ffca05" : dangerColor} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4 }} />
    <motion.circle cx={isResolvedCorrect ? "470" : "400"} cy="270" r="12" fill={isResolvedCorrect ? "#ffca05" : dangerColor} animate={{ scale: [1, 1.7, 1] }} transition={{ duration: 1, repeat: Infinity }} />
    {dialogueStep >= 2 && !selectedChoice && <text x="400" y="90" textAnchor="middle" className="fill-[#ffca05] text-[18px] font-bold">GOOD ENOUGH?</text>}
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">RAISE THE STANDARD</text>
  </>, "A performance pulse rising above a flat line");

  const renderGrowth = () => renderSvgScene(<>
    <path d="M 100 350 H 700" stroke="#29435f" strokeWidth="4" />
    <motion.path d="M 400 350 C 400 290 380 260 400 200 C 420 145 400 115 400 70" fill="none" stroke={outcomeColor} strokeWidth="12" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: dialogueStep >= 1 || selectedChoice ? 1 : 0.35 }} transition={{ duration: 1.2 }} />
    {[{ x: 350, y: 220, r: -28 }, { x: 455, y: 150, r: 28 }, { x: 355, y: 125, r: -32 }, { x: 455, y: 85, r: 30 }].map((leaf, index) => <motion.ellipse key={index} cx={leaf.x} cy={leaf.y} rx="36" ry="16" fill={isResolvedWrong ? "#29435f" : "#ffca05"} animate={{ scale: dialogueStep >= 2 || selectedChoice ? 1 : 0, rotate: leaf.r }} transition={{ delay: index * 0.15, type: "spring" }} style={{ transformOrigin: `${leaf.x}px ${leaf.y}px` }} />)}
    <motion.circle cx="400" cy="62" r="19" fill="#ffca05" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.6, repeat: Infinity }} />
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">POTENTIAL INTO MOMENTUM</text>
  </>, "A spark growing into a thriving tree");

  const renderShield = () => renderSvgScene(<>
    {[150, 220, 290].map((y, index) => <motion.path key={y} d={`M 95 ${y} C 210 ${y - 55} 275 ${y + 55} 350 ${y} S 545 ${y - 55} 705 ${y}`} fill="none" stroke={index === 1 && dialogueStep >= 2 ? dangerColor : "#29435f"} strokeWidth="5" strokeLinecap="round" animate={{ x: [-15, 15, -15] }} transition={{ duration: 3 + index, repeat: Infinity }} />)}
    <motion.path d="M 400 72 L 510 112 V 218 C 510 290 465 340 400 370 C 335 340 290 290 290 218 V 112 Z" fill="#0b1827" stroke={outcomeColor} strokeWidth="7" initial={{ scale: 0.7 }} animate={{ scale: 1 }} />
    <motion.path d="M 355 215 L 388 248 L 452 173" fill="none" stroke={outcomeColor} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: selectedChoice ? 1 : 0.55 }} transition={{ duration: 0.8 }} />
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">COURAGE MAKES TRUST VISIBLE</text>
  </>, "A transparent shield protecting trust");

  const renderRocket = () => renderSvgScene(<>
    <path d="M 110 355 C 250 335 370 285 680 62" fill="none" stroke="#29435f" strokeWidth="5" strokeDasharray="10 12" />
    <motion.g animate={{ x: isResolvedCorrect ? [0, 150] : 0, y: isResolvedCorrect ? [0, -115] : 0 }} transition={{ duration: 1.5, ease: "easeOut" }}>
      <path d="M 270 300 C 300 210 365 160 435 125 C 450 205 425 275 340 325 Z" fill={outcomeColor} />
      <circle cx="382" cy="205" r="20" fill="#07121f" opacity="0.9" />
      <path d="M 300 295 L 250 335 L 310 325 M 335 320 L 315 370 L 365 326" fill={outcomeColor} />
      <motion.path d="M 275 305 L 205 360 L 285 332" fill="#ffca05" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.35, repeat: Infinity }} />
    </motion.g>
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">MAKE THE MOONSHOT</text>
  </>, "A rocket following an audacious upward trajectory");

  const renderBalance = () => renderSvgScene(<>
    <motion.g animate={{ rotate: isResolvedWrong ? [0, 8, 0] : isResolvedCorrect ? [0, -2, 2, 0] : [0, 3, -3, 0] }} transition={{ duration: 2.2, repeat: Infinity }} style={{ transformOrigin: "400px 215px" }}>
      <path d="M 400 90 V 340 M 245 195 H 555 M 400 90 L 370 135 M 400 90 L 430 135" stroke={outcomeColor} strokeWidth="8" strokeLinecap="round" />
      <path d="M 245 195 L 175 305 H 315 Z M 555 195 L 485 305 H 625 Z" fill="#0b1827" stroke={outcomeColor} strokeWidth="5" />
    </motion.g>
    <motion.circle cx={isResolvedWrong ? "555" : "400"} cy={isResolvedWrong ? "255" : "195"} r="20" fill="#ffca05" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">INTEGRITY KEEPS THE BALANCE</text>
  </>, "Scales balancing long-term value and integrity");

  const renderMerge = () => renderSvgScene(<>
    {[[150, 120], [150, 320], [650, 120], [650, 320]].map(([x, y], index) => <React.Fragment key={index}><motion.path d={`M ${x} ${y} L 400 220`} stroke={outcomeColor} strokeWidth="4" strokeDasharray="8 8" initial={{ pathLength: 0 }} animate={{ pathLength: dialogueStep >= 1 || selectedChoice ? 1 : 0.25 }} transition={{ delay: index * 0.12 }} /><motion.circle cx={x} cy={y} r="34" fill="#0b1827" stroke={outcomeColor} strokeWidth="4" animate={isResolvedCorrect ? { x: [0, (400 - x) * 0.72], y: [0, (220 - y) * 0.72], opacity: [1, 0.2] } : {}} transition={{ duration: 1.4, delay: index * 0.12 }} /></React.Fragment>)}
    <motion.circle cx="400" cy="220" r={isResolvedCorrect ? "70" : "52"} fill="#0b1827" stroke={outcomeColor} strokeWidth="6" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
    <text x="400" y="228" textAnchor="middle" className="fill-slate-100 text-[17px] font-bold">ONE VEON</text>
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">MANY TEAMS, ONE CORE</text>
  </>, "Teams merging into one shared core");

  const renderCore = () => renderSvgScene(<>
    {[120, 185, 250, 315].map((y, index) => <motion.path key={y} d={`M 90 ${y} C 180 ${y - 85} 270 ${y + 85} 360 ${y} S 550 ${y - 85} 710 ${y}`} fill="none" stroke="#29435f" strokeWidth="3" strokeDasharray="7 10" animate={{ x: [-20, 20, -20] }} transition={{ duration: 2.2 + index * 0.25, repeat: Infinity }} />)}
    {[105, 72, 42].map((radius, index) => <motion.circle key={radius} cx="400" cy="220" r={radius} fill={index === 2 ? outcomeColor : "none"} fillOpacity={index === 2 ? "0.18" : "0"} stroke={outcomeColor} strokeWidth={index === 2 ? "8" : "3"} animate={{ scale: isResolvedCorrect ? [1, 1.25, 1] : [1, 1.1, 1] }} transition={{ duration: 1.2 + index * 0.3, repeat: Infinity }} />)}
    <motion.circle cx="400" cy="220" r="18" fill="#ffca05" animate={{ scale: [1, 1.45, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
    <text x="400" y="405" textAnchor="middle" className="fill-slate-400 text-[13px] font-semibold tracking-[3px]">STAY LIT THROUGH THE STORM</text>
  </>, "A resilient core glowing through a storm");

  switch (visualConcept) {
    case 'nodes': return renderNodes();
    case 'blocks': return renderBlocks();
    case 'orbit': return renderOrbit();
    case 'pulse': return renderPulse();
    case 'growth': return renderGrowth();
    case 'shield': return renderShield();
    case 'rocket': return renderRocket();
    case 'balance': return renderBalance();
    case 'merge': return renderMerge();
    case 'core': return renderCore();
    default: return renderPulse();
  }
};
