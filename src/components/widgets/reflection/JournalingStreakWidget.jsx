import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStreak } from '../../../hooks/useStreak';

export function JournalingStreakWidget() {
  const { t } = useTranslation();
  const streak = useStreak();

  return (
    <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col items-center justify-center h-full transition-colors duration-300">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[48px] font-sans font-semibold text-black dark:text-white leading-none tracking-tight transition-colors duration-300">{streak}</span>
        <span className="text-[40px] leading-none">🔥</span>
      </div>
      <p className="text-[15px] font-sans text-gray-400 dark:text-komorebi-dark-muted font-medium transition-colors duration-300">{t('journaling.streak.title')}</p>
    </div>
  );
}
