import React, { useState, useEffect, useRef } from 'react';
import { MoodStressSlider } from './MoodStressSlider';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';
import { dispatchMoodUpdate } from '../../../hooks/useMoodEvent';

export function CurrentMoodWidget() {
  const { user } = useAuthStore();
  const [moodScore, setMoodScore] = useState(4);
  const debounceRef = useRef(null);
  const moodEmojis = ["😢", "😔", "😐", "😊", "😁"];
  const moodLabels = ["Bad", "Not Bad", "Neutral", "Good", "Very Good"];

  // Load today's mood from mood_entries (synced with Dashboard)
  useEffect(() => {
    async function loadMood() {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('mood_entries')
        .select('mood_score')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (data && data.mood_score) {
        setMoodScore(data.mood_score);
      }
    }
    loadMood();

    // Also listen for mood updates from Dashboard
    const handler = () => loadMood();
    window.addEventListener('mood-updated', handler);
    return () => window.removeEventListener('mood-updated', handler);
  }, [user]);

  const handleMoodChange = (newValue) => {
    setMoodScore(newValue);
    
    // Debounced auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existing } = await supabase
        .from('mood_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('mood_entries')
          .update({ mood: moodLabels[newValue - 1], mood_score: newValue })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('mood_entries')
          .insert({
            user_id: user.id,
            mood: moodLabels[newValue - 1],
            mood_score: newValue,
            entry_date: today,
          });
      }
      dispatchMoodUpdate();
    }, 500);
  };

  return (
    <MoodStressSlider 
      title="Current Mood" 
      value={moodScore}
      onValueChange={handleMoodChange}
    />
  );
}
