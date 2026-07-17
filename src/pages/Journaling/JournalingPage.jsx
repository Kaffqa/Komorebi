import React from "react";
import { JournalingStreakWidget } from "../../components/widgets/reflection/JournalingStreakWidget";
import { CurrentStressWidget } from "../../components/widgets/reflection/CurrentStressWidget";
import { CurrentMoodWidget } from "../../components/widgets/reflection/CurrentMoodWidget";
import { DailyJournalWidget } from "../../components/widgets/reflection/DailyJournalWidget";
import { ActivityHistoryWidget } from "../../components/widgets/reflection/ActivityHistoryWidget";
import { InsightsOverviewWidget } from "../../components/widgets/reflection/InsightsOverviewWidget";

export default function JournalingPage() {
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
        <div className="lg:col-span-2">
          <InsightsOverviewWidget />
        </div>
      </div>
      
    </div>
  );
}
