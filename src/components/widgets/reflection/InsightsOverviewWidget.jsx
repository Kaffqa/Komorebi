import { useState, useEffect, useCallback } from 'react';
import { Smile, CalendarCheck, TrendingUp, BookText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';
import { useTranslation } from 'react-i18next';

export function InsightsOverviewWidget() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [insights, setInsights] = useState([
    { label: t('journaling.insights.average_mood'), value: "—", icon: Smile },
    { label: t('journaling.insights.log_consistency'), value: "—", icon: CalendarCheck },
    { label: t('journaling.insights.mood_progress'), value: "—", icon: TrendingUp },
    { label: t('journaling.insights.journal_completion'), value: "—", icon: BookText },
  ]);

  const fetchInsights = useCallback(async () => {
    if (!user) return;

    const days = 7; // Statically Weekly
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - days);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    // Previous period for comparison
    const prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - days);
    const prevPeriodStartStr = prevPeriodStart.toISOString().split('T')[0];

    // Fetch current period mood entries
    const { data: currentMoods } = await supabase
      .from('mood_entries')
      .select('mood_score, entry_date')
      .eq('user_id', user.id)
      .gte('entry_date', periodStartStr);

    // Fetch previous period mood entries
    const { data: prevMoods } = await supabase
      .from('mood_entries')
      .select('mood_score')
      .eq('user_id', user.id)
      .gte('entry_date', prevPeriodStartStr)
      .lt('entry_date', periodStartStr);

    // Fetch current period journal entries
    const { data: currentJournals } = await supabase
      .from('journal_entries')
      .select('entry_date')
      .eq('user_id', user.id)
      .gte('entry_date', periodStartStr);

    // Calculate Average Mood
    let avgMood = "—";
    if (currentMoods && currentMoods.length > 0) {
      const sum = currentMoods.reduce((acc, m) => acc + m.mood_score, 0);
      const avg = sum / currentMoods.length;
      avgMood = Math.round((avg / 5) * 100) + "%";
    }

    // Calculate Log Consistency (days with mood entry / total days in period)
    let logConsistency = "—";
    if (currentMoods) {
      const uniqueDays = new Set(currentMoods.map(m => m.entry_date));
      logConsistency = Math.round((uniqueDays.size / days) * 100) + "%";
    }

    // Calculate Mood Progress (current avg vs previous avg)
    let moodProgress = "—";
    if (currentMoods && currentMoods.length > 0 && prevMoods && prevMoods.length > 0) {
      const currentAvg = currentMoods.reduce((acc, m) => acc + m.mood_score, 0) / currentMoods.length;
      const prevAvg = prevMoods.reduce((acc, m) => acc + m.mood_score, 0) / prevMoods.length;
      const progressPercent = Math.round(((currentAvg - prevAvg) / prevAvg) * 100);
      moodProgress = (progressPercent >= 0 ? "+" : "") + progressPercent + "%";
    } else if (currentMoods && currentMoods.length > 0) {
      moodProgress = t('journaling.insights.new');
    }

    // Calculate Journaling Completion
    let journalCompletion = "—";
    if (currentJournals) {
      const uniqueJournalDays = new Set(currentJournals.map(j => j.entry_date));
      journalCompletion = Math.round((uniqueJournalDays.size / days) * 100) + "%";
    }

    setInsights([
      { label: t('journaling.insights.average_mood'), value: avgMood, icon: Smile },
      { label: t('journaling.insights.log_consistency'), value: logConsistency, icon: CalendarCheck },
      { label: t('journaling.insights.mood_progress'), value: moodProgress, icon: TrendingUp },
      { label: t('journaling.insights.journal_completion'), value: journalCompletion, icon: BookText },
    ]);
  }, [user, t]);

  useEffect(() => {
    fetchInsights();

    // Listen for updates from other widgets
    const handler = () => fetchInsights();
    window.addEventListener('mood-updated', handler);
    window.addEventListener('journal-updated', handler);
    return () => {
      window.removeEventListener('mood-updated', handler);
      window.removeEventListener('journal-updated', handler);
    };
  }, [user, fetchInsights]);

  return (
    <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-7 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-komorebi-dark-border flex flex-col h-fit transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[20px] font-sans font-medium text-black dark:text-white tracking-tight transition-colors duration-300">{t('journaling.insights.title')}</h3>
          <div className="flex items-center justify-center text-[13px] font-medium text-gray-700 dark:text-gray-300 border border-[#B5CCBD] dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg px-4 py-1.5 rounded-full cursor-default transition-colors">
            {t('journaling.insights.weekly')}
          </div>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between border border-gray-200/80 dark:border-[#32473D] rounded-xl p-3 bg-white dark:bg-komorebi-dark-bg hover:border-gray-300 dark:hover:border-[#5D8B66]/50 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] border border-[#5D8B66]/40 bg-transparent flex items-center justify-center text-[#5D8B66] dark:text-[#7DA085]">
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <span className="font-sans font-medium text-[15px] text-gray-900 dark:text-white">{item.label}</span>
            </div>
            <span className="font-sans font-medium text-[17px] text-[#5D8B66] dark:text-[#7DA085]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
