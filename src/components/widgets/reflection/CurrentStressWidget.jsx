import React, { useState, useEffect, useRef } from 'react';
import { Laugh, Smile, Meh, Annoyed, Frown } from 'lucide-react';
import { MoodStressSlider } from './MoodStressSlider';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';

export function CurrentStressWidget() {
  const { user } = useAuthStore();
  const [stressScore, setStressScore] = useState(3);
  const debounceRef = useRef(null);
  const stressIcons = [
    <Laugh key="1" className="w-[22px] h-[22px] text-emerald-500" />,
    <Smile key="2" className="w-[22px] h-[22px] text-lime-500" />,
    <Meh key="3" className="w-[22px] h-[22px] text-yellow-500" />,
    <Annoyed key="4" className="w-[22px] h-[22px] text-orange-500" />,
    <Frown key="5" className="w-[22px] h-[22px] text-rose-500" />
  ];
  const stressLabelsForSlider = ["Very Low", "Low", "Neutral", "High", "Very High"];

  // Load today's stress from journal_entries
  useEffect(() => {
    async function loadStress() {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('journal_entries')
        .select('stress_score')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (data && data.stress_score) {
        setStressScore(data.stress_score);
      }
    }
    loadStress();
  }, [user]);

  const handleStressChange = (newValue) => {
    setStressScore(newValue);
    
    // Debounced auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const stressLabelsForDB = ["Very Low", "Low", "Moderate", "High", "Very High"];
      
      const { data: existing } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('journal_entries')
          .update({ stress_score: newValue, stress_level: stressLabelsForDB[newValue - 1] })
          .eq('id', existing.id);
      }
      // If no journal entry exists yet, we don't create one just for stress
      // The journal entry will be created when the user writes their journal
    }, 500);
  };

  return (
    <MoodStressSlider 
      title="Current Stress" 
      value={stressScore}
      onValueChange={handleStressChange}
      icons={stressIcons}
      labels={stressLabelsForSlider}
    />
  );
}
