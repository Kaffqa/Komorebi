import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { JournalingStreakWidget } from "../../components/widgets/reflection/JournalingStreakWidget";
import { CurrentStressWidget } from "../../components/widgets/reflection/CurrentStressWidget";
import { CurrentMoodWidget } from "../../components/widgets/reflection/CurrentMoodWidget";
import { DailyJournalWidget } from "../../components/widgets/reflection/DailyJournalWidget";
import { ActivityHistoryWidget } from "../../components/widgets/reflection/ActivityHistoryWidget";
import { InsightsOverviewWidget } from "../../components/widgets/reflection/InsightsOverviewWidget";
import { WeeklyRecapWidget } from "../../components/widgets/reflection/WeeklyRecapWidget";

export default function JournalingPage() {
  const [showIndicator, setShowIndicator] = useState(true);
  const scrollRef = useRef(null);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Hide indicator if we are at the bottom (or within 20px of it) or if it's not scrollable
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
    setShowIndicator(!isAtBottom && scrollHeight > clientHeight);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* ROW 1: Streak, Stress, Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-1">
          <JournalingStreakWidget />
        </div>
        <div className="lg:col-span-2">
          <CurrentStressWidget />
        </div>
        <div className="lg:col-span-2">
          <CurrentMoodWidget />
        </div>
      </div>

      {/* ROW 2: Daily Journal */}
      <div className="grid grid-cols-1 gap-6">
        <DailyJournalWidget />
      </div>

      {/* ROW 3: Activity History & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ActivityHistoryWidget />
        </div>
        <div className="lg:col-span-2 relative min-h-[500px] lg:min-h-0">
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="lg:absolute inset-0 overflow-y-auto flex flex-col gap-6 pr-1 scrollbar-hide relative z-0"
          >
            <InsightsOverviewWidget />
            <WeeklyRecapWidget />
          </div>
          
          {/* Scroll Indicator */}
          <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fcfcfc] dark:from-komorebi-dark-bg to-transparent pointer-events-none flex items-end justify-center pb-2 z-10 lg:flex hidden transition-opacity duration-300 ${showIndicator ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] animate-bounce border border-gray-100 dark:border-gray-700">
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
