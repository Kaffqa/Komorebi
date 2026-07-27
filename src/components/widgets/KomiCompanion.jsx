import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../services/supabase';

export function KomiCompanion({ constraintsRef }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { user } = useAuthStore();
  const [moodScore, setMoodScore] = useState(3); // Default 3 (Neutral)
  const [isFrozen, setIsFrozen] = useState(false);
  
  // Micro-feature States
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [petCenter, setPetCenter] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isSleeping, setIsSleeping] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [rubCount, setRubCount] = useState(0);
  const [particles, setParticles] = useState([]);

  const containerRef = useRef(null);
  const afkTimerRef = useRef(null);

  const messages = [
    "Halo! Butuh teman cerita?",
    "Jangan lupa jurnal harianmu ya! 📖",
    "Kamu sudah melakukan yang terbaik hari ini!",
    "Tarik napas dalam... hembuskan... 🌬️",
    "Komi siap mendengarkanmu.",
    "Banyak minum air putih ya! 💧"
  ];

  const motivationQuotes = [
    "Kamu luar biasa hari ini! 🌟",
    "Tetap semangat ya! ✨",
    "Jangan lupa istirahat sejenak 🍃",
    "Komi sangat bangga padamu! 💚",
    "Satu langkah kecil juga sebuah kemajuan!",
    "Hari yang berat? Kamu pasti bisa melewatinya!"
  ];

  const sadQuotes = [
    "Tidak apa-apa merasa sedih. Aku di sini untukmu. 🫂",
    "Menangis itu wajar. Jangan dipendam sendiri ya.",
    "Peluk jauh untukmu! Badai pasti berlalu."
  ];

  const happyQuotes = [
    "Wah, kamu terlihat sangat ceria hari ini! 🌟",
    "Senyummu menular! Terus pertahankan semangatmu! ✨",
    "Komi ikut bahagia melihatmu senang! 💚"
  ];

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood_score')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (moodData && moodData.mood_score) {
        setMoodScore(moodData.mood_score);
      }

      // Check if user has journaled today
      const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('entry_date', today);
      
      setIsFrozen(count === 0);
    }
    loadData();

    const handler = () => loadData();
    window.addEventListener('mood-updated', handler);
    window.addEventListener('journal-updated', handler);
    return () => {
      window.removeEventListener('mood-updated', handler);
      window.removeEventListener('journal-updated', handler);
    };
  }, [user]);

  // Mood based styling
  let themeColors = {
    highlight: "#A8D8B6",
    base: "#5D8B66",
    shadow: "#25432B",
    glow: "#5D8B66",
    stemStart: "#7DA085",
    stemEnd: "#3D6846",
    limbsDark: "#43674F",
    limbsLight: "#7DA085",
    blush: "#A8D8B6",
    faceDark: "#1F3323",
    faceLight: "#2D4732"
  };
  let moodFace = "normal";

  if (isFrozen) {
    themeColors = {
      highlight: "#E0F7FA",
      base: "#80DEEA",
      shadow: "#006064",
      glow: "#B2EBF2",
      stemStart: "#B2EBF2",
      stemEnd: "#00838F",
      limbsDark: "#006064",
      limbsLight: "#4DD0E1",
      blush: "#B2EBF2",
      faceDark: "#004D40",
      faceLight: "#00695C"
    };
    moodFace = "frozen";
  } else if (moodScore <= 2) {
    themeColors = { 
      highlight: "#82B1FF", 
      base: "#448AFF", 
      shadow: "#1A237E", 
      glow: "#448AFF",
      stemStart: "#82B1FF",
      stemEnd: "#1A237E",
      limbsDark: "#283593",
      limbsLight: "#5C6BC0",
      blush: "#82B1FF",
      faceDark: "#08103A",
      faceLight: "#1A237E"
    };
    moodFace = isHovered ? "happy" : "sad";
  } else if (moodScore >= 4) {
    themeColors = { 
      highlight: "#FFF59D", 
      base: "#FDD835", 
      shadow: "#F57F17", 
      glow: "#FDD835",
      stemStart: "#FFF59D",
      stemEnd: "#F57F17",
      limbsDark: "#E65100",
      limbsLight: "#FFB300",
      blush: "#FFCC80",
      faceDark: "#4A2900",
      faceLight: "#B84000"
    };
    moodFace = "happy";
  } else {
    // Normal mood: smile when being petted!
    moodFace = isHovered ? "happy" : "normal";
  }

  // Randomly show messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      // 30% chance to show a message every 10 seconds
      if (Math.random() > 0.7 && !showMessage) {
        let randomMsg;
        if (isFrozen) {
          const frozenMsgs = [
            "Komi kedinginan... 🥶",
            "Tulis jurnal hari ini untuk menghangatkanku!",
            "Brrr... aku beku...",
            "Tolong cairkan es ini dengan jurnalmu ❄️"
          ];
          randomMsg = frozenMsgs[Math.floor(Math.random() * frozenMsgs.length)];
        } else {
          randomMsg = messages[Math.floor(Math.random() * messages.length)];
        }
        setMessage(randomMsg);
        setShowMessage(true);

        // Hide message after 5 seconds
        setTimeout(() => {
          setShowMessage(false);
        }, 5000);
      }
    }, 10000);

    return () => clearInterval(messageInterval);
  }, [showMessage, isSleeping, isFrozen]);

  // AFK Timer & Eye Tracking
  useEffect(() => {
    let lastMoveTime = 0;
    
    const resetAfkTimer = () => {
      setIsSleeping(false);
      if (afkTimerRef.current) clearTimeout(afkTimerRef.current);
      afkTimerRef.current = setTimeout(() => {
        setIsSleeping(true);
      }, 10000); // Sleep after 10s idle
    };

    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMoveTime > 50) { // Throttle mouse position update
        setMousePos({ x: e.clientX, y: e.clientY });
        lastMoveTime = now;
      }
      // Always wake up and reset timer on mouse move
      setIsSleeping(false);
      if (afkTimerRef.current) clearTimeout(afkTimerRef.current);
      afkTimerRef.current = setTimeout(() => {
        setIsSleeping(true);
      }, 10000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", resetAfkTimer);
    window.addEventListener("click", resetAfkTimer);
    resetAfkTimer(); // Init

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", resetAfkTimer);
      window.removeEventListener("click", resetAfkTimer);
      if (afkTimerRef.current) clearTimeout(afkTimerRef.current);
    };
  }, []);

  // Update Pet Center for Eye Tracking
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPetCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  }, [isDragging, isHovered]);

  // Eye tracking offset calculation
  const dx = mousePos.x - petCenter.x;
  const dy = mousePos.y - petCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxOffset = 4; // Max pupil movement
  const distanceFactor = Math.min(distance / 150, 1);
  const pupilOffsetX = distance > 0 ? (dx / distance) * maxOffset * distanceFactor : 0;
  const pupilOffsetY = distance > 0 ? (dy / distance) * maxOffset * distanceFactor : 0;

  // Petting / Rubbing Logic
  const handlePetting = () => {
    if (isSleeping) return;
    setRubCount(prev => {
      const newCount = prev + 1;
      if (newCount > 15 && !isHappy) {
        setIsHappy(true);
        spawnHeartParticles();
        setTimeout(() => {
          setIsHappy(false);
          setRubCount(0);
        }, 3000);
      }
      return newCount;
    });
  };

  const spawnHeartParticles = () => {
    const newParticles = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      delay: i * 0.15
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const handleSingleClick = () => {
    if (!isSleeping && !isHappy) {
      let activeQuotes = motivationQuotes;
      if (moodScore <= 2) activeQuotes = sadQuotes;
      else if (moodScore >= 4) activeQuotes = happyQuotes;

      const randomQuote = activeQuotes[Math.floor(Math.random() * activeQuotes.length)];
      setMessage(randomQuote);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 5000);
    }
  };

  const handleDoubleClick = () => {
    navigate('/chat');
  };

  return (
    <div className="fixed z-[99] bottom-4 right-4 md:bottom-10 md:right-10 w-16 h-16 md:w-24 md:h-24 scale-[0.65] md:scale-100 origin-bottom-right">
      <motion.div
        ref={containerRef}
        className="relative flex flex-col items-center justify-end w-full h-full"
        drag
        dragConstraints={{ 
          left: -(typeof window !== 'undefined' ? window.innerWidth / (window.innerWidth < 768 ? 0.65 : 1) : 1000) + 100, 
          right: 20, 
          top: -(typeof window !== 'undefined' ? window.innerHeight / (window.innerWidth < 768 ? 0.65 : 1) : 1000) + 100, 
          bottom: 20 
        }}
        dragElastic={0.2}
        dragMomentum={false}
        whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        style={{ cursor: "grab" }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleSingleClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handlePetting}
      >
        {/* Komi Pet SVG Character */}
        <motion.div
          animate={{ 
            y: (isDragging || isSleeping) ? 0 : [0, -15, 0], // Stops floating when sleeping/dragging
            rotate: isDragging ? [0, -15, 15, -15, 15, 0] : 0 
          }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: isDragging ? { duration: 0.5, repeat: Infinity } : { type: "spring", stiffness: 300, damping: 20 }
          }}
          className="relative group flex justify-center"
        >
          {/* Thought Cloud Bubble (Positioned to the left to avoid scrollbar) */}
          <AnimatePresence>
            {(showMessage || isHovered || isFrozen) && !isDragging && (
              <motion.div
                initial={{ opacity: 0, x: -10, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -5, y: 5, scale: 0.8 }}
                onClick={() => {
                  if (isFrozen) navigate('/journaling');
                }}
                className={`absolute bottom-[90%] right-[80%] mb-4 w-max min-w-[140px] max-w-[220px] bg-white/95 backdrop-blur-sm border border-gray-100 text-gray-800 text-[13.5px] font-normal px-5 py-3 rounded-[30px] shadow-[0_8px_25px_rgba(0,0,0,0.1)] text-center z-50 origin-bottom-right transition-transform ${isFrozen ? 'pointer-events-auto cursor-pointer hover:scale-105 hover:bg-blue-50 active:scale-95' : 'pointer-events-none'}`}
              >
                {isFrozen ? (
                  <span>
                    Komi kedinginan... 🥶<br/>
                    <span className="font-bold text-[#448AFF] hover:text-blue-700 underline decoration-blue-300 decoration-2 underline-offset-2 transition-colors">
                      Tulis Jurnal Sekarang
                    </span> ❄️
                  </span>
                ) : (isHovered && !showMessage ? "Double click to Chat! 💬" : message)}
                
                {/* Thought Cloud Tail (Circles leading down to head) */}
                <div className="absolute -bottom-3 right-6 w-5 h-5 bg-white/95 rounded-full border border-gray-100 border-t-0 border-l-0 shadow-sm z-[-1]"></div>
                <div className="absolute -bottom-7 right-2 w-2.5 h-2.5 bg-white/95 rounded-full border border-gray-100 shadow-sm z-[-1]"></div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Zzz Sleep Bubble */}
          <AnimatePresence>
            {isSleeping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                className="absolute -top-8 right-2 text-2xl font-bold text-[#A8D8B6] select-none pointer-events-none drop-shadow-md z-50"
              >
                Zzz
              </motion.div>
            )}
          </AnimatePresence>

          {/* SVG Heart Particles for Petting (Not emoji) */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                animate={{ opacity: 1, y: -60, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
                className="absolute top-10 pointer-events-none z-50"
                style={{ left: `calc(50% + ${p.x}px)` }}
              >
                {/* Cute SVG Love/Heart shape */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill={themeColors.highlight} className="drop-shadow-sm transition-colors duration-1000" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </motion.div>
            ))}
          </AnimatePresence>

        {/* Glow effect behind */}
        <div 
          className="absolute inset-0 blur-2xl opacity-40 rounded-full transition-all duration-1000 ease-in-out" 
          style={{ backgroundColor: themeColors.glow, transform: moodScore >= 4 ? 'scale(1.3)' : 'scale(1.1)' }}
        ></div>
        
        {/* The Character (3D Leaf Shape) */}
        <svg width="88" height="110" viewBox="0 -10 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-[0_15px_25px_rgba(42,74,49,0.5)] transition-all duration-1000">
          <defs>
            <radialGradient id="leafGradient" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
              <stop offset="0%" stopColor={themeColors.highlight} className="transition-colors duration-1000" />
              <stop offset="40%" stopColor={themeColors.base} className="transition-colors duration-1000" />
              <stop offset="100%" stopColor={themeColors.shadow} className="transition-colors duration-1000" />
            </radialGradient>
            
            <linearGradient id="leafStem" x1="60" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor={themeColors.stemStart} className="transition-colors duration-1000" />
              <stop offset="1" stopColor={themeColors.stemEnd} className="transition-colors duration-1000" />
            </linearGradient>
          </defs>

          {/* Stem/Vine on top */}
          <path d="M60 10 C50 -5, 35 -5, 30 10 C25 25, 45 25, 45 15" stroke="url(#leafStem)" strokeWidth="6" strokeLinecap="round" fill="none" />

          {/* Main 3D Leaf Body (Plump Teardrop with rounded bottom) */}
          <path d="M 60 10 C 110 35, 120 95, 80 120 Q 60 130, 40 120 C 0 95, 10 35, 60 10 Z" fill="url(#leafGradient)" />
          
          {/* 3D Glossy Specular Highlight (Left edge crescent) */}
          <path d="M 60 10 C 10 35, 0 95, 40 120 Q 50 125, 60 125 C 25 105, 20 40, 60 15 Z" fill="white" opacity="0.35" />
          
          {/* Leaf Organic Veins (Subtle) */}
          <g stroke="#132B18" strokeWidth="2.5" strokeLinecap="round" opacity="0.15" fill="none">
            {/* Top Central Vein */}
            <path d="M 60 10 Q 59 25 60 45" />
            {/* Top Left Veins */}
            <path d="M 60 22 Q 40 28 25 45" />
            <path d="M 60 35 Q 35 40 15 65" />
            {/* Top Right Veins */}
            <path d="M 60 22 Q 80 28 95 45" />
            <path d="M 60 35 Q 85 40 105 65" />
            {/* Bottom Central Vein (Avoiding the face) */}
            <path d="M 60 105 Q 61 115 60 125" />
            {/* Bottom Side Veins */}
            <path d="M 60 110 Q 45 115 35 105" />
            <path d="M 60 110 Q 75 115 85 105" />
          </g>

          {/* Legs */}
          <path d="M40 125 Q45 138 35 138" stroke={themeColors.limbsDark} className="transition-colors duration-1000" strokeWidth="6" strokeLinecap="round" />
          <path d="M80 125 Q75 138 85 138" stroke={themeColors.limbsDark} className="transition-colors duration-1000" strokeWidth="6" strokeLinecap="round" />

          {/* Arms (Small and cute) */}
          <path d="M15 85 Q0 95 15 105" stroke={themeColors.limbsLight} className="transition-colors duration-1000" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M105 85 Q120 95 105 105" stroke={themeColors.limbsLight} className="transition-colors duration-1000" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* Face */}
          <g className="face-group">
            {isDragging ? (
              // Dizzy Eyes (Swirls or X_X)
              <g className="dizzy-eyes">
                <path d="M40 65 L50 75 M50 65 L40 75" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" />
                <path d="M70 65 L80 75 M80 65 L70 75" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" />
                <path d="M35 50 Q45 60 52 50" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M68 50 Q75 60 85 50" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M52 90 Q55 85 60 90 T68 90" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            ) : moodFace === "frozen" ? (
              <g className="frozen-eyes">
                <circle cx="42" cy="72" r="6" fill={themeColors.faceDark} />
                <circle cx="78" cy="72" r="6" fill={themeColors.faceDark} />
                <circle cx="44" cy="70" r="2.5" fill="white" />
                <circle cx="80" cy="70" r="2.5" fill="white" />
                {/* Teardrops */}
                <path d="M42 80 Q37 88 42 92 Q47 88 42 80" fill="#E0F7FA" opacity="0.9" />
                <path d="M78 80 Q73 88 78 92 Q83 88 78 80" fill="#E0F7FA" opacity="0.9" />
                {/* Sad/Cold mouth */}
                <path d="M55 90 Q60 83 65 90" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Cold eyebrows */}
                <path d="M35 55 Q45 45 52 50" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M68 50 Q75 45 85 55" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Blush */}
                <ellipse cx="38" cy="80" rx="5" ry="2.5" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.5" />
                <ellipse cx="82" cy="80" rx="5" ry="2.5" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.5" />
              </g>
            ) : moodFace === "happy" ? (
              <g className="happy-eyes">
                {isSleeping ? (
                  <>
                    <path d="M38 72 Q45 62 52 72" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M68 72 Q75 62 82 72" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" fill="none" />
                    <circle cx="60" cy="90" r="3" fill={themeColors.faceLight} /> {/* Snoring mouth */}
                  </>
                ) : (
                  <>
                    <path d="M38 72 Q45 62 52 72" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M68 72 Q75 62 82 72" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M50 85 Q60 100 70 85 Z" fill={themeColors.faceDark} /> 
                  </>
                )}
                <ellipse cx="38" cy="78" rx="6" ry="3" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.8" />
                <ellipse cx="82" cy="78" rx="6" ry="3" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.8" />
                <path d="M35 50 Q45 45 52 53" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M68 53 Q75 45 85 50" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            ) : moodFace === "sad" ? (
              <g className="sad-eyes">
                {isSleeping ? (
                  <>
                    <path d="M40 70 Q45 74 50 70" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M70 70 Q75 74 80 70" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" fill="none" />
                  </>
                ) : (
                  <>
                    <circle cx="48" cy="72" r="5" fill={themeColors.faceDark} />
                    <circle cx="72" cy="72" r="5" fill={themeColors.faceDark} />
                    <circle cx="49" cy="70" r="2" fill="white" />
                    <circle cx="71" cy="70" r="2" fill="white" />
                  </>
                )}
                <ellipse cx="38" cy="80" rx="5" ry="2.5" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.4" />
                <ellipse cx="82" cy="80" rx="5" ry="2.5" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.4" />
                {/* Sad eyebrows pointing up in middle */}
                <path d="M35 55 Q45 45 52 50" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M68 50 Q75 45 85 55" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Sad mouth */}
                {isSleeping ? (
                  <circle cx="60" cy="90" r="2.5" fill={themeColors.faceLight} />
                ) : (
                  <path d="M55 95 Q60 88 65 95" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                )}
              </g>
            ) : (
              <g className="normal-eyes">
                {isSleeping ? (
                  <>
                    <path d="M40 70 L50 70" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" />
                    <path d="M70 70 L80 70" stroke={themeColors.faceDark} strokeWidth="4" strokeLinecap="round" />
                    <circle cx="60" cy="90" r="3" fill={themeColors.faceLight} /> {/* Snoring mouth */}
                  </>
                ) : (
                  <>
                    <motion.ellipse 
                      cx="45" cy="70" rx="10" ry="12" fill="white"
                      initial={{ ry: 12 }}
                      animate={{ ry: [12, 1, 12] }} 
                      transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                    />
                    <motion.ellipse 
                      cx="75" cy="70" rx="10" ry="12" fill="white"
                      initial={{ ry: 12 }}
                      animate={{ ry: [12, 1, 12] }} 
                      transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                    />
                    
                    {/* Dynamic Eye Tracking Pupils */}
                    <motion.circle cx="48" cy="72" r="5" fill={themeColors.faceDark} animate={{ x: pupilOffsetX, y: pupilOffsetY }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
                    <motion.circle cx="72" cy="72" r="5" fill={themeColors.faceDark} animate={{ x: pupilOffsetX, y: pupilOffsetY }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
                    
                    {/* Eye Catchlights */}
                    <motion.circle cx="49" cy="70" r="2" fill="white" animate={{ x: pupilOffsetX * 0.8, y: pupilOffsetY * 0.8 }} />
                    <motion.circle cx="71" cy="70" r="2" fill="white" animate={{ x: pupilOffsetX * 0.8, y: pupilOffsetY * 0.8 }} />
                    
                    {/* Mouth */}
                    <path d="M55 90 Q60 95 65 90" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                  </>
                )}

                {/* Cute Blush */}
                <ellipse cx="38" cy="80" rx="5" ry="2.5" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.6" />
                <ellipse cx="82" cy="80" rx="5" ry="2.5" fill={themeColors.blush} className="transition-colors duration-1000" opacity="0.6" />

                {/* Smug eyebrows */}
                <path d="M35 55 Q45 50 52 58" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M68 58 Q75 50 85 55" stroke={themeColors.faceLight} strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}
          </g>

          {/* Ice Block Overlay */}
          {isFrozen && (
            <g className="ice-block">
              {/* Ice polygon covering the whole body */}
              <path d="M 20 0 L 100 10 L 115 60 L 100 145 L 20 140 L -5 80 Z" fill="white" opacity="0.25" stroke="#B2EBF2" strokeWidth="3" strokeLinejoin="round" />
              {/* Highlights on ice */}
              <path d="M 25 10 L 90 20 L 105 60" fill="none" stroke="white" strokeWidth="5" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 5 80 L 25 130" fill="none" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
              <path d="M 80 130 L 95 90" fill="none" stroke="white" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
            </g>
          )}

          {/* Interaction Shadow at the bottom */}
          <ellipse cx="60" cy="135" rx="25" ry="4" fill="#5D8B66" opacity="0.4" />
        </svg>

        {/* Small floating particles */}
        <motion.div animate={{ y: [-5, -20], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute top-4 left-4 w-2 h-2 bg-green-300 rounded-full"></motion.div>
        <motion.div animate={{ y: [-5, -30], opacity: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }} className="absolute top-10 right-4 w-3 h-3 bg-emerald-200 rounded-full blur-[1px]"></motion.div>

      </motion.div>
      </motion.div>
    </div>
  );
}
