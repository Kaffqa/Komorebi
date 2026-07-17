import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';
import { getLocalDateString } from '../../../utils/date';

export function JournalingStreakWidget() {
  const { user } = useAuthStore();
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    async function calculateStreak() {
      if (!user) return;

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('entry_date')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(365);

      if (error || !entries || entries.length === 0) {
        setStreak(1); // Default to 1 for new users as a starting motivation
        return;
      }

      // Calculate consecutive days streak from today going backwards
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Build a Set of entry dates for O(1) lookup
      const entryDates = new Set(entries.map(e => e.entry_date));

      // Check if today or yesterday has an entry (streak can still be active if today hasn't been filled yet)
      const todayStr = getLocalDateString(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      let checkDate;
      if (entryDates.has(todayStr)) {
        checkDate = new Date(today);
      } else if (entryDates.has(yesterdayStr)) {
        checkDate = new Date(yesterday);
      } else {
        setStreak(1);
        return;
      }

      // Count consecutive days backwards
      while (true) {
        const dateStr = getLocalDateString(checkDate);
        if (entryDates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      setStreak(Math.max(1, currentStreak));
    }

    calculateStreak();

    // Also listen for journal updates
    const handler = () => calculateStreak();
    window.addEventListener('journal-updated', handler);
    return () => window.removeEventListener('journal-updated', handler);
  }, [user]);

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[48px] font-sans font-semibold text-black leading-none tracking-tight">{streak}</span>
        <span className="text-[40px] leading-none">🔥</span>
      </div>
      <p className="text-[15px] font-sans text-gray-400 font-medium">Journaling Streak</p>
    </div>
  );
}
