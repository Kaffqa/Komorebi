import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";

export function MoodSummaryWidget() {
  const { user } = useAuthStore();
  const [view, setView] = useState("Weekly");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const emptyData = [
    { label: "Neutral", percentage: 0, color: "#678D73" },
    { label: "Not Bad", percentage: 0, color: "#8AAFA0" },
    { label: "Bad", percentage: 0, color: "#C9DBCF" },
    { label: "Very Good", percentage: 0, color: "#274230" },
    { label: "Good", percentage: 0, color: "#486E53" },
  ];
  
  const [data, setData] = useState(emptyData);
  const [hasData, setHasData] = useState(false);

  const fetchMoodData = useCallback(async () => {
    if (!user) return;
    
    const days = view === "Weekly" ? 7 : 30;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const { data: entries, error } = await supabase
      .from("mood_entries")
      .select("mood_score")
      .eq("user_id", user.id)
      .gte("entry_date", dateLimit.toISOString().split('T')[0]);

    if (error) {
      console.error("Error fetching mood summary:", error);
      return;
    }

    if (!entries || entries.length === 0) {
      setData(emptyData);
      setHasData(false);
      return;
    }

    setHasData(true);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entries.forEach(entry => {
      counts[entry.mood_score] = (counts[entry.mood_score] || 0) + 1;
    });

    const total = entries.length;
    
    setData([
      { label: "Neutral", percentage: Math.round((counts[3] / total) * 100), color: "#678D73" },
      { label: "Not Bad", percentage: Math.round((counts[2] / total) * 100), color: "#8AAFA0" },
      { label: "Bad", percentage: Math.round((counts[1] / total) * 100), color: "#C9DBCF" },
      { label: "Very Good", percentage: Math.round((counts[5] / total) * 100), color: "#274230" },
      { label: "Good", percentage: Math.round((counts[4] / total) * 100), color: "#486E53" },
    ]);
  }, [user, view]);

  useEffect(() => {
    fetchMoodData();
  }, [fetchMoodData]);

  // Listen for mood updates from MoodInputWidget
  useEffect(() => {
    const handler = () => fetchMoodData();
    window.addEventListener('mood-updated', handler);
    return () => window.removeEventListener('mood-updated', handler);
  }, [fetchMoodData]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const legendData = [
    { label: "Bad", color: "#C9DBCF" },
    { label: "Not Bad", color: "#8AAFA0" },
    { label: "Neutral", color: "#678D73" },
    { label: "Good", color: "#486E53" },
    { label: "Very Good", color: "#274230" },
  ];

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[20px] font-sans font-semibold text-black">Mood History</h3>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-[13px] font-medium px-4 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 transition-colors"
          >
            {view}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[120px]"
              >
                <button onClick={() => {setView("Weekly"); setShowDropdown(false);}} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] font-medium transition-colors text-gray-700">Weekly</button>
                <button onClick={() => {setView("Monthly"); setShowDropdown(false);}} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] font-medium transition-colors text-gray-700">Monthly</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center relative min-h-[250px] w-full max-w-[320px] mx-auto">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <p className="text-gray-400 text-[14px] font-sans text-center">No mood data yet.<br/>Start logging your mood!</p>
          </div>
        )}
        {/* Floating Labels */}
        {hasData && (
          <>
            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-4 left-0 bg-[#486E53] text-white text-[13px] font-bold px-3.5 py-1.5 rounded-[12px] rotate-[-12deg] z-10 shadow-sm">
              {data.find(d => d.label === "Good")?.percentage}%
            </motion.div>
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }} className="absolute top-4 right-4 bg-[#678D73] text-white text-[13px] font-bold px-3.5 py-1.5 rounded-[12px] rotate-[15deg] z-10 shadow-sm">
              {data.find(d => d.label === "Neutral")?.percentage}%
            </motion.div>
            <motion.div animate={{ y: [4, -4, 4] }} transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 1.5 }} className="absolute top-[45%] -right-2 bg-[#8AAFA0] text-white text-[13px] font-bold px-3.5 py-1.5 rounded-[12px] rotate-[-5deg] z-10 shadow-sm">
              {data.find(d => d.label === "Not Bad")?.percentage}%
            </motion.div>
            <motion.div animate={{ y: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 0.8 }} className="absolute bottom-8 right-6 bg-[#C9DBCF] text-white text-[13px] font-bold px-3.5 py-1.5 rounded-[12px] rotate-[8deg] z-10 shadow-sm">
              {data.find(d => d.label === "Bad")?.percentage}%
            </motion.div>
            <motion.div animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }} className="absolute bottom-2 left-10 bg-[#274230] text-white text-[13px] font-bold px-3.5 py-1.5 rounded-[12px] rotate-[10deg] z-10 shadow-sm">
              {data.find(d => d.label === "Very Good")?.percentage}%
            </motion.div>
          </>
        )}

        {/* SVG Donut Chart */}
        <div className="w-[220px] h-[220px] relative">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 drop-shadow-sm">
            {data.map((item) => {
              const gap = 12;
              const strokeWidth = 32;
              const targetLength = (item.percentage / 100) * circumference;
              const dashArrayLength = Math.max(0, targetLength - gap - strokeWidth);
              const strokeDasharray = `${dashArrayLength} ${circumference}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += targetLength;

              return (
                <circle
                  key={item.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out origin-center"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex justify-center items-center flex-wrap gap-x-5 gap-y-3 px-2">
        {legendData.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></span>
            <span className="text-[13px] font-sans font-medium text-black">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
