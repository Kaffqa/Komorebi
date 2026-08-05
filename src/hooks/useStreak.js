import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { getLocalDateString } from '../utils/date';

export function useStreak() {
  const { user } = useAuthStore();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function calculateStreak() {
      if (!user) {
        setStreak(0);
        return;
      }

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('entry_date')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(365);

      if (error || !entries || entries.length === 0) {
        setStreak(0); // Default to 0 for new users
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
        setStreak(0);
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

      setStreak(currentStreak);
    }

    calculateStreak();

    // Also listen for journal updates globally
    const handler = () => calculateStreak();
    window.addEventListener('journal-updated', handler);
    return () => window.removeEventListener('journal-updated', handler);
  }, [user]);

  return streak;
}
