import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';

export function ActivityHistoryWidget() {
  const { user } = useAuthStore();
  const [hoveredCell, setHoveredCell] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const colorMap = {
    0: 'bg-[#F2F4F2]',
    1: 'bg-[#C9DBCF]',
    2: 'bg-[#8AAFA0]',
    3: 'bg-[#678D73]',
    4: 'bg-[#486E53]',
    5: 'bg-[#274230]',
  };

  const moodLabels = { 1: "Bad", 2: "Not Bad", 3: "Neutral", 4: "Good", 5: "Very Good" };
  const stressLabels = { 1: "Very High", 2: "High", 3: "Moderate", 4: "Low", 5: "Very Low" };

  // Generate calendar grid for the current month
  const generateCalendarGrid = () => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    let week = [];
    
    // Empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
      week.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }
    
    // Fill remaining cells
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }
    
    return grid;
  };

  const fetchCalendarData = useCallback(async () => {
    if (!user) return;

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    // Fetch mood entries for the month
    const { data: moods } = await supabase
      .from('mood_entries')
      .select('entry_date, mood_score, mood')
      .eq('user_id', user.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate);

    // Fetch journal entries for the month
    const { data: journals } = await supabase
      .from('journal_entries')
      .select('entry_date, stress_score, stress_level')
      .eq('user_id', user.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate);

    const dataMap = {};
    
    if (moods) {
      moods.forEach(m => {
        const day = parseInt(m.entry_date.split('-')[2]);
        dataMap[day] = { ...dataMap[day], moodScore: m.mood_score, mood: m.mood };
      });
    }
    
    if (journals) {
      journals.forEach(j => {
        const day = parseInt(j.entry_date.split('-')[2]);
        dataMap[day] = { ...dataMap[day], stressScore: j.stress_score, stressLevel: j.stress_level, hasJournal: true };
      });
    }

    setCalendarData(dataMap);
  }, [user, year, month]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Listen for updates
  useEffect(() => {
    const handler = () => fetchCalendarData();
    window.addEventListener('mood-updated', handler);
    window.addEventListener('journal-updated', handler);
    return () => {
      window.removeEventListener('mood-updated', handler);
      window.removeEventListener('journal-updated', handler);
    };
  }, [fetchCalendarData]);

  const grid = generateCalendarGrid();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full relative z-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[20px] font-sans font-semibold text-black">Calender Activity History</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="relative">
              <button 
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center gap-2 text-[13px] font-medium px-4 py-1.5 rounded-full border border-[#B5CCBD] bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {monthName} {year}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            <AnimatePresence>
              {showMonthPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-[200px] overflow-y-auto min-w-[140px]"
                >
                  {months.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => { setCurrentDate(new Date(year, idx, 1)); setShowMonthPicker(false); }}
                      className={`w-full text-left px-4 py-1.5 text-[13px] font-medium transition-colors ${
                        idx === month ? "bg-[#7DA085]/10 text-[#5D8B66]" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {m} {year}
                    </button>
                  ))}
                  <hr className="my-1 border-gray-100" />
                  <div className="flex justify-center gap-2 px-3 py-1">
                    <button onClick={() => { setCurrentDate(new Date(year - 1, month, 1)); }} className="text-[12px] text-gray-400 hover:text-gray-600">← {year - 1}</button>
                    <button onClick={() => { setCurrentDate(new Date(year + 1, month, 1)); }} className="text-[12px] text-gray-400 hover:text-gray-600">{year + 1} →</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center mt-2">
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-7 gap-2 sm:gap-2.5">
              {row.map((day, cIdx) => {
                if (day === null) return <div key={cIdx} className="aspect-[4/3]" />;
                
                const dayData = calendarData[day];
                const intensity = dayData?.moodScore || (dayData?.hasJournal ? 3 : 0);
                const today = new Date();
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                return (
                  <div 
                    key={cIdx}
                    onMouseEnter={() => setHoveredCell({ rIdx, cIdx, day })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-full aspect-[4/3] rounded-[10px] transition-all cursor-pointer relative ${colorMap[intensity]} ${isToday ? 'ring-2 ring-[#7DA085] ring-offset-1' : ''}`}
                  >
                    <AnimatePresence>
                      {hoveredCell?.rIdx === rIdx && hoveredCell?.cIdx === cIdx && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-gray-900 text-white text-[11px] font-medium p-2.5 rounded-lg text-center z-50 pointer-events-none shadow-lg"
                        >
                          <p className="mb-1 font-semibold">{monthName} {day}, {year}</p>
                          {dayData ? (
                            <>
                              <p className="text-gray-300">Mood: {dayData.mood || moodLabels[dayData.moodScore] || "—"}</p>
                              <p className="text-gray-300">Stress: {dayData.stressLevel || stressLabels[dayData.stressScore] || "—"}</p>
                              {dayData.hasJournal && <p className="text-green-300 mt-0.5">📝 Journal logged</p>}
                            </>
                          ) : (
                            <p className="text-gray-400">No data</p>
                          )}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[12px] font-medium text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-[#F2F4F2]" />
          <div className="w-3.5 h-3.5 rounded-sm bg-[#C9DBCF]" />
          <div className="w-3.5 h-3.5 rounded-sm bg-[#8AAFA0]" />
          <div className="w-3.5 h-3.5 rounded-sm bg-[#678D73]" />
          <div className="w-3.5 h-3.5 rounded-sm bg-[#486E53]" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
