import React from 'react';
import { motion } from 'framer-motion';

export function MindTree({ depressionLevel = "Normal", anxietyLevel = "Normal", stressLevel = "Normal" }) {
  // Mapping logic
  const isDepressionHigh = depressionLevel === "Severe" || depressionLevel === "Extremely Severe";
  const isDepressionModerate = depressionLevel === "Moderate";
  const leafColor = isDepressionHigh ? "#9CA3AF" : (isDepressionModerate ? "#D97706" : "#5D8B66");
  const leafColorLight = isDepressionHigh ? "#D1D5DB" : (isDepressionModerate ? "#F59E0B" : "#7DA085");
  const leafColorDark = isDepressionHigh ? "#6B7280" : (isDepressionModerate ? "#B45309" : "#43674F");

  const isAnxietyHigh = anxietyLevel === "Severe" || anxietyLevel === "Extremely Severe";
  const isAnxietyModerate = anxietyLevel === "Moderate";
  
  const windAnimation = isAnxietyHigh 
    ? { rotate: [0, 5, -4, 3, -2, 0], transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } } 
    : (isAnxietyModerate 
        ? { rotate: [0, 5, -3, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } } 
        : { rotate: [0, 2, -1, 0], scale: [1, 1.03, 1], transition: { repeat: Infinity, duration: 5, ease: "easeInOut" } });

  const isStressHigh = stressLevel === "Severe" || stressLevel === "Extremely Severe";
  const isStressModerate = stressLevel === "Moderate";

  return (
    <div className="relative w-full h-[240px] rounded-[24px] overflow-hidden bg-gradient-to-b from-[#E5EBE7]/50 dark:from-black/20 to-transparent flex items-end justify-center transition-colors duration-300">
      
      {/* Background Weather / Stress */}
      {(!isStressModerate && !isStressHigh) && (
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-8 right-8 flex items-center justify-center"
        >
          {/* Glowing Aura */}
          <div className="absolute w-12 h-12 bg-yellow-300/50 rounded-full blur-md" />
          {/* Sun Core */}
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
        </motion.div>
      )}

      {/* Clouds for Moderate/High Stress */}
      {(isStressModerate || isStressHigh) && (
        <motion.div 
          animate={{ x: [-15, 15, -15] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute top-6 left-4"
        >
          <svg width="60" height="30" viewBox="0 0 60 30" fill={isStressHigh ? "#6B7280" : "#D1D5DB"} className="overflow-visible">
            <circle cx="15" cy="15" r="10" />
            <circle cx="30" cy="10" r="14" />
            <circle cx="45" cy="15" r="10" />
            <rect x="15" y="10" width="30" height="15" />
          </svg>
        </motion.div>
      )}

      {isStressHigh && (
        <motion.div 
          animate={{ x: [-10, 20, -10] }}
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 1 }}
          className="absolute top-4 right-6"
        >
          <svg width="80" height="40" viewBox="0 0 80 40" fill="#4B5563" className="overflow-visible">
            <circle cx="20" cy="20" r="12" />
            <circle cx="40" cy="15" r="18" />
            <circle cx="60" cy="20" r="12" />
            <rect x="20" y="14" width="40" height="18" />
          </svg>
        </motion.div>
      )}
      
      {/* Rain for High Stress */}
      {isStressHigh && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
           {[...Array(6)].map((_, i) => (
             <motion.div 
               key={i}
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 260, opacity: [0, 1, 0] }}
               transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
               className="absolute w-[2px] h-4 bg-blue-400 rounded-full"
               style={{ left: `${15 + i * 15}%`, transform: 'rotate(15deg)' }}
             />
           ))}
        </div>
      )}

      {/* Ground (z-20 so the trunk is hidden behind it) */}
      <div className="absolute -bottom-2 left-0 right-0 h-12 bg-[#D4DFD8] dark:bg-black/30 rounded-t-[100%] z-20">
        {/* Soft Grass Tufts */}
        <svg viewBox="0 0 40 20" className="absolute top-2 left-[12%] w-10 h-5 text-[#9FB6A6]/60 dark:text-white/10 overflow-visible">
          <circle cx="10" cy="15" r="5" fill="currentColor" />
          <circle cx="20" cy="12" r="8" fill="currentColor" />
          <circle cx="30" cy="15" r="5" fill="currentColor" />
          <rect x="10" y="15" width="20" height="5" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 40 20" className="absolute top-1 left-[38%] w-6 h-3 text-[#9FB6A6]/40 dark:text-white/5 overflow-visible">
          <circle cx="10" cy="15" r="5" fill="currentColor" />
          <circle cx="20" cy="12" r="8" fill="currentColor" />
          <circle cx="30" cy="15" r="5" fill="currentColor" />
          <rect x="10" y="15" width="20" height="5" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 40 20" className="absolute top-4 right-[32%] w-7 h-3.5 text-[#9FB6A6]/50 dark:text-white/10 overflow-visible">
          <circle cx="10" cy="15" r="5" fill="currentColor" />
          <circle cx="20" cy="12" r="8" fill="currentColor" />
          <circle cx="30" cy="15" r="5" fill="currentColor" />
          <rect x="10" y="15" width="20" height="5" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 40 20" className="absolute top-3 right-[10%] w-8 h-4 text-[#9FB6A6]/60 dark:text-white/10 overflow-visible">
          <circle cx="10" cy="15" r="5" fill="currentColor" />
          <circle cx="20" cy="12" r="8" fill="currentColor" />
          <circle cx="30" cy="15" r="5" fill="currentColor" />
          <rect x="10" y="15" width="20" height="5" fill="currentColor" />
        </svg>
      </div>

      {/* Tree SVG */}
      <div className="relative w-[180px] h-[200px] z-10 origin-bottom flex flex-col items-center justify-end pb-2">
        
        {/* Canopy / Leaves (Animated based on Anxiety) */}
        <motion.div 
          className="absolute top-0 w-[140px] h-[120px] origin-bottom z-10"
          animate={windAnimation}
        >
          <svg viewBox="-10 -15 160 140" className="w-full h-full drop-shadow-md overflow-visible">
            {/* Back leaves */}
            <circle cx="40" cy="50" r="35" fill={leafColorDark} className="transition-colors duration-1000" />
            <circle cx="100" cy="40" r="30" fill={leafColorDark} className="transition-colors duration-1000" />
            <circle cx="70" cy="30" r="40" fill={leafColorDark} className="transition-colors duration-1000" />
            
            {/* Front leaves */}
            <circle cx="35" cy="65" r="25" fill={leafColor} className="transition-colors duration-1000" />
            <circle cx="105" cy="55" r="25" fill={leafColor} className="transition-colors duration-1000" />
            <circle cx="70" cy="50" r="45" fill={leafColor} className="transition-colors duration-1000" />
            <circle cx="60" cy="25" r="30" fill={leafColorLight} className="transition-colors duration-1000" />
            <circle cx="85" cy="35" r="25" fill={leafColorLight} className="transition-colors duration-1000" />
          </svg>

          {/* Falling leaves if Anxiety is High or Depression is High */}
          {(isAnxietyHigh || isDepressionHigh) && (
            <motion.div
              initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: 120, x: 20, opacity: 0, rotate: 90 }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
              className="absolute top-[80px] left-[30px] w-4 h-2 rounded-full transition-colors duration-1000"
              style={{ backgroundColor: leafColor }}
            />
          )}
          {(isAnxietyHigh || isDepressionHigh) && (
            <motion.div
              initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: 140, x: -30, opacity: 0, rotate: -90 }}
              transition={{ repeat: Infinity, duration: 4, delay: 1.5 }}
              className="absolute top-[60px] left-[90px] w-3 h-2 rounded-full transition-colors duration-1000"
              style={{ backgroundColor: leafColorLight }}
            />
          )}
        </motion.div>

        {/* Trunk (Proportional and connected to leaves) */}
        <svg viewBox="0 0 100 120" className="w-[100px] h-[120px] relative z-0 mt-[40px]">
          <path 
            d="M 50 120 L 50 25 M 50 90 Q 30 60 20 30 M 50 85 Q 70 60 80 30 M 50 105 Q 80 80 95 45" 
            fill="none" 
            stroke="#5C4033" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>

      </div>
    </div>
  );
}
