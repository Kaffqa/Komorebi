import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import { ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Mini Komi SVG (reusable leaf character)
function MiniKomi({ size = 120, className = "" }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 -10 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="tourLeafGrad" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
          <stop offset="0%" stopColor="#A8D8B6" />
          <stop offset="40%" stopColor="#5D8B66" />
          <stop offset="100%" stopColor="#25432B" />
        </radialGradient>
        <linearGradient id="tourStemGrad" x1="60" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DA085" />
          <stop offset="1" stopColor="#3D6846" />
        </linearGradient>
      </defs>
      <path d="M60 10 C50 -5, 35 -5, 30 10 C25 25, 45 25, 45 15" stroke="url(#tourStemGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M 60 10 C 110 35, 120 95, 80 120 Q 60 130, 40 120 C 0 95, 10 35, 60 10 Z" fill="url(#tourLeafGrad)" />
      <path d="M 60 10 C 10 35, 0 95, 40 120 Q 50 125, 60 125 C 25 105, 20 40, 60 15 Z" fill="white" opacity="0.35" />
      <g stroke="#132B18" strokeWidth="2.5" strokeLinecap="round" opacity="0.15" fill="none">
        <path d="M 60 10 Q 59 25 60 45" />
        <path d="M 60 22 Q 40 28 25 45" />
        <path d="M 60 35 Q 35 40 15 65" />
        <path d="M 60 22 Q 80 28 95 45" />
        <path d="M 60 35 Q 85 40 105 65" />
      </g>
      <path d="M40 125 Q45 138 35 138" stroke="#43674F" strokeWidth="6" strokeLinecap="round" />
      <path d="M80 125 Q75 138 85 138" stroke="#43674F" strokeWidth="6" strokeLinecap="round" />
      <path d="M15 85 Q0 95 15 105" stroke="#7DA085" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M105 85 Q120 95 105 105" stroke="#7DA085" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Happy face */}
      <g>
        <path d="M38 72 Q45 62 52 72" stroke="#1F3323" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M68 72 Q75 62 82 72" stroke="#1F3323" strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="38" cy="78" rx="6" ry="3" fill="#A8D8B6" opacity="0.8" />
        <ellipse cx="82" cy="78" rx="6" ry="3" fill="#A8D8B6" opacity="0.8" />
        <path d="M50 85 Q60 100 70 85 Z" fill="#1F3323" />
      </g>
    </svg>
  );
}

export function KomiOnboardingTour({ onComplete }) {
  const { profile } = useAuthStore();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [komiPos, setKomiPos] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const overlayRef = useRef(null);

  const userName = profile?.display_name || t('onboarding.fallback_name', 'Teman');

  const allTourSteps = useMemo(() => [
    {
      id: "welcome",
      target: null,
      position: "center",
      title: t('onboarding.step1.title', { name: userName || t('onboarding.fallback_name') }),
      message: t('onboarding.step1.desc'),
      buttonText: t('onboarding.step1.btn')
    },
    {
      id: "mood-input",
      target: "[data-tour-id='mood-input']",
      position: "right",
      title: t('onboarding.step2.title'),
      message: t('onboarding.step2.desc'),
      buttonText: t('onboarding.step2.btn')
    },
    {
      id: "mood-summary",
      target: "[data-tour-id='mood-summary']",
      position: "left",
      title: t('onboarding.step3.title'),
      message: t('onboarding.step3.desc'),
      buttonText: t('onboarding.step3.btn')
    },
    {
      id: "assessment-history",
      target: "[data-tour-id='assessment-history']",
      position: "right",
      title: t('onboarding.step4.title'),
      message: t('onboarding.step4.desc'),
      buttonText: t('onboarding.step4.btn')
    },
    {
      id: "activity-suggestion",
      target: "[data-tour-id='activity-suggestion']",
      position: "left",
      title: t('onboarding.step5.title'),
      message: t('onboarding.step5.desc'),
      buttonText: t('onboarding.step5.btn')
    },
    {
      id: "nav-reflection",
      target: "[data-tour-id='nav-reflection']",
      position: "right-sidebar",
      title: t('onboarding.step6.title'),
      message: t('onboarding.step6.desc'),
      buttonText: t('onboarding.step6.btn')
    },
    {
      id: "nav-diagnose",
      target: "[data-tour-id='nav-diagnose']",
      position: "right-sidebar",
      title: t('onboarding.step7.title'),
      message: t('onboarding.step7.desc'),
      buttonText: t('onboarding.step7.btn')
    },
    {
      id: "nav-chat",
      target: "[data-tour-id='nav-chat']",
      position: "right-sidebar",
      title: t('onboarding.step8.title'),
      message: t('onboarding.step8.desc'),
      buttonText: t('onboarding.step8.btn')
    },
    {
      id: "nav-sharing",
      target: "[data-tour-id='nav-sharing']",
      position: "right-sidebar",
      title: t('onboarding.step9.title'),
      message: t('onboarding.step9.desc'),
      buttonText: t('onboarding.step9.btn')
    },
    {
      id: "nav-help",
      target: "[data-tour-id='nav-help']",
      position: "right-sidebar",
      title: t('onboarding.step10.title'),
      message: t('onboarding.step10.desc'),
      buttonText: t('onboarding.step10.btn')
    },
    {
      id: "closing",
      target: null,
      position: "center",
      title: t('onboarding.step11.title', { name: userName || t('onboarding.fallback_name') }),
      message: t('onboarding.step11.desc'),
      buttonText: t('onboarding.step11.btn')
    }
  ], [userName, t]);

  const tourSteps = useMemo(() => {
    // Pada mobile (layar di bawah 1024px), sidebar disembunyikan.
    // Jika kita mencoba menyorot menu sidebar, targetnya akan 0x0 atau off-screen.
    if (window.innerWidth >= 1024) {
      return allTourSteps;
    }

    // Filter out semua langkah yang menyorot sidebar
    const mobileSteps = allTourSteps.filter(step => step.position !== "right-sidebar");
    
    // Tambahkan 1 langkah rangkuman menu untuk pengguna mobile sebelum penutupan
    mobileSteps.splice(mobileSteps.length - 1, 0, {
      id: "mobile-menu",
      target: null,
      position: "center",
      title: t('onboarding.mobile.title'),
      message: t('onboarding.mobile.desc'),
      buttonText: t('onboarding.mobile.btn')
    });

    return mobileSteps;
  }, [allTourSteps]);

  const step = tourSteps[currentStep];

  // Calculate target element position
  const updateTargetRect = useCallback(() => {
    if (!step.target) {
      setTargetRect({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: 0,
        height: 0,
        borderRadius: '50%',
        isActive: false
      });
      setKomiPos({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 60
      });
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const compStyle = window.getComputedStyle(el);
      const padding = parseInt(el.getAttribute('data-tour-padding') || '0', 10);
      
      let tLeft = rect.left - padding;
      let tWidth = rect.width + (padding * 2);
      
      // Prevent horizontal overflow mask on mobile
      if (tLeft < 0) tLeft = 8;
      if (tLeft + tWidth > window.innerWidth) tWidth = window.innerWidth - tLeft - 8;

      setTargetRect({
        top: rect.top - padding,
        left: tLeft,
        width: tWidth,
        height: rect.height + (padding * 2),
        borderRadius: compStyle.borderRadius && compStyle.borderRadius !== '0px' ? compStyle.borderRadius : '16px',
        isActive: true
      });

      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        setKomiPos({
          x: Math.max(50, Math.min(rect.left + rect.width / 2, window.innerWidth - 50)),
          y: Math.max(80, rect.top - 60)
        });
      } else {
        if (step.position === "right") {
          setKomiPos({
            x: rect.right + 40,
            y: rect.top + rect.height / 2 - 60
          });
        } else if (step.position === "right-sidebar") {
          setKomiPos({
            x: rect.right + 30,
            y: rect.top + rect.height / 2 - 60
          });
        } else if (step.position === "left") {
          setKomiPos({
            x: rect.left - 440, // Space for bubble + Komi
            y: rect.top + rect.height / 2 - 60
          });
        }
      }
    }
  }, [step]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      updateTargetRect();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Real-time tracking for scroll and resize
  useEffect(() => {
    const handleUpdate = () => updateTargetRect();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true); // true for capture phase to catch all scroll events
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [updateTargetRect]);

  // Initial scroll into view and update rect on step change
  useEffect(() => {
    if (isReady) {
      if (step.target) {
        const el = document.querySelector(step.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      // Force update the rect whenever the step changes,
      // as smooth scrolling will handle continuous updates via the scroll listener.
      updateTargetRect();
    }
  }, [currentStep, isReady, step, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isReady) return null;

  const isCenter = step.position === "center";
  const isMobile = window.innerWidth < 768;

  const getBubbleStyle = () => {
    if (isCenter || isMobile) {
      let topVal = isMobile ? 'auto' : `${komiPos.y + 90}px`;
      let bottomVal = isMobile ? '24px' : 'auto';

      if (isMobile && targetRect && !isCenter) {
        const spaceAbove = targetRect.top;
        const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
        const bubbleHeight = 240; // Estimasi tinggi maksimum kotak pesan + jarak

        if (spaceBelow >= spaceAbove) {
          // Taruh di bawah elemen
          if (spaceBelow < bubbleHeight) {
            // Jika tidak muat, paksa mentok bawah layar
            topVal = 'auto';
            bottomVal = '24px';
          } else {
            // Tempel presisi di bawah elemen
            topVal = `${targetRect.top + targetRect.height + 16}px`;
            bottomVal = 'auto';
          }
        } else {
          // Taruh di atas elemen
          if (spaceAbove < bubbleHeight + 60) {
            // Jika tidak muat, paksa mentok atas layar (sisakan 80px untuk Komi di atas bubble)
            topVal = '80px';
            bottomVal = 'auto';
          } else {
            // Tempel presisi di atas elemen
            topVal = 'auto';
            bottomVal = `${window.innerHeight - targetRect.top + 16}px`;
          }
        }
      }

      return {
        position: 'fixed',
        left: '50%',
        bottom: bottomVal,
        top: topVal,
        maxWidth: '380px',
        width: 'calc(100vw - 32px)',
      };
    }

    return {
      position: 'fixed',
      left: Math.min(komiPos.x + 70, window.innerWidth - 360),
      top: Math.max(komiPos.y - 30, 20),
      maxWidth: '340px',
      width: '340px',
    };
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Dark overlay with perfect rounded spotlight hole using box-shadow */}
        <div className="fixed inset-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
          {targetRect && (
            <motion.div
              animate={{
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
                borderRadius: targetRect.borderRadius,
                borderColor: targetRect.isActive ? "rgba(168, 216, 182, 1)" : "rgba(168, 216, 182, 0)",
                borderWidth: targetRect.isActive ? 2 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute"
              style={{
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(93, 139, 102, 0.4)"
              }}
            />
          )}
        </div>

        {/* Komi Character (Animated/Flying) - Only for Desktop or Center Step */}
        {(!isMobile || isCenter) && (
          <motion.div
            animate={{
              x: isCenter ? komiPos.x - 60 : komiPos.x - 50,
              y: isCenter ? komiPos.y - 75 : komiPos.y - 40,
            }}
            transition={{ type: "spring", stiffness: 80, damping: 18, mass: 1.2 }}
            className="fixed z-[10002]"
            style={{ top: 0, left: 0, pointerEvents: 'none' }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <MiniKomi size={isCenter ? 120 : 80} />
            </motion.div>
          </motion.div>
        )}

        {/* Speech Bubble / Info Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.9, x: (isCenter || isMobile) ? "-50%" : 0 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: (isCenter || isMobile) ? "-50%" : 0 }}
          exit={{ opacity: 0, y: -10, scale: 0.9, x: (isCenter || isMobile) ? "-50%" : 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
          className="z-[10003] relative"
          style={{ ...getBubbleStyle(), pointerEvents: 'auto' }}
        >
          {/* Komi Riding on Bubble (Mobile Only) */}
          {isMobile && !isCenter && (
            <div className="absolute -top-[65px] left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <MiniKomi size={75} />
              </motion.div>
            </div>
          )}

          <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] shadow-2xl border border-gray-100 dark:border-transparent overflow-hidden relative transition-colors duration-300">
            {/* Progress bar (Absolute to guarantee perfect clipping by parent) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-komorebi-dark-bg transition-colors duration-300">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#5D8B66] to-[#A8D8B6]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="p-6 pt-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#5D8B66] bg-[#5D8B66]/10 px-3 py-1 rounded-full">
                  {currentStep + 1} / {tourSteps.length}
                </span>
                {currentStep < tourSteps.length - 1 && (
                  <button
                    onClick={handleSkip}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> {t('onboarding.skip')}
                  </button>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-sans transition-colors duration-300">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5 font-sans transition-colors duration-300">{step.message}</p>

              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white rounded-xl text-sm font-bold transition-all duration-200 font-sans"
              >
                {step.buttonText}
                {currentStep < tourSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Thought cloud tail */}
          {!isCenter && !isMobile && (
            <>
              <div className="absolute -left-4 top-12 w-5 h-5 bg-white dark:bg-komorebi-dark-card rounded-full border border-gray-100 dark:border-transparent shadow-sm transition-colors duration-300"></div>
              <div className="absolute -left-8 top-6 w-3 h-3 bg-white dark:bg-komorebi-dark-card rounded-full border border-gray-100 dark:border-transparent shadow-sm transition-colors duration-300"></div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
