import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronDown, BookOpen } from 'lucide-react';
import { Check, Loader2, MessageSquare, ChevronRight, Tags } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';
import { dispatchJournalUpdate } from '../../../hooks/useMoodEvent';
import { getLocalDateString } from '../../../utils/date';

const TAG_SUGGESTIONS = ["Anxiety", "Work", "Family", "Health", "Social", "Self-Care", "Stress", "Gratitude", "Sleep", "Exercise"];

export function DailyJournalWidget() {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAllJournals, setShowAllJournals] = useState(false);
  const [pastJournals, setPastJournals] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [existingEntryId, setExistingEntryId] = useState(null);
  const tagInputRef = useRef(null);

  // Load today's journal if it exists
  useEffect(() => {
    async function loadTodayJournal() {
      if (!user) return;
      const today = getLocalDateString();
      const { data } = await supabase
        .from('journal_entries')
        .select('id, content, mood, stress_level')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (data) {
        setExistingEntryId(data.id);
        
        let loadedContent = data.content || "";
        // Extract tags from content if stored with hashtags
        const hashTags = loadedContent.match(/#\w+/g);
        if (hashTags) {
          setTags(hashTags.map(t => t.replace('#', '')));
          // Remove the tags from the text area content
          loadedContent = loadedContent.replace(/#\w+/g, '').trim();
        }
        setContent(loadedContent);
      }
    }
    loadTodayJournal();
  }, [user]);

  const handleTagInput = (value) => {
    setTagInput(value);
    if (value.trim()) {
      const filtered = TAG_SUGGESTIONS.filter(
        s => s.toLowerCase().includes(value.toLowerCase()) && !tags.includes(s)
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(TAG_SUGGESTIONS.filter(s => !tags.includes(s)));
    }
  };

  const addTag = (tag) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
    setTagInput("");
    setShowTagInput(false);
    setFilteredSuggestions([]);
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setIsSaving(true);

    const today = getLocalDateString();
    // Append tags as hashtags at the end of content for storage
    const tagsStr = tags.length > 0 ? `\n\n${tags.map(t => `#${t}`).join(' ')}` : '';
    const fullContent = content.trim() + tagsStr;

    try {
      // Get current mood and stress from their respective tables
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood, mood_score')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      const moodLabel = moodData?.mood || "Neutral";
      const moodScoreVal = moodData?.mood_score || 3;
      const stressLevel = "Moderate"; // Default
      const stressScore = 3; // Default

      if (existingEntryId) {
        const { error } = await supabase
          .from('journal_entries')
          .update({ content: fullContent, mood: moodLabel, mood_score: moodScoreVal })
          .eq('id', existingEntryId);
        if (error) throw error;
      } else {
        const { data: newEntry, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            content: fullContent,
            mood: moodLabel,
            mood_score: moodScoreVal,
            stress_level: stressLevel,
            stress_score: stressScore,
            entry_date: today,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (newEntry) setExistingEntryId(newEntry.id);
      }

      setIsSaved(true);
      dispatchJournalUpdate();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving journal:", error);
      alert("Failed to save journal: " + (error.message || "Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const loadPastJournals = async () => {
    if (!user) return;
    setLoadingJournals(true);
    setShowAllJournals(true);

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, content, mood, mood_score, stress_level, entry_date, created_at')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(30);

    if (!error && data) {
      setPastJournals(data);
    }
    setLoadingJournals(false);
  };

  const moodEmoji = { "Bad": "😢", "Not Bad": "😔", "Neutral": "😐", "Good": "😊", "Very Good": "😁" };

  return (
    <>
      <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-[20px] font-sans font-semibold text-black">Daily Journal</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={isSaving || isSaved || !content.trim()}
              className={`px-6 py-2 rounded-full text-[13px] font-medium transition-colors text-white ${
                isSaved ? "bg-green-500" : "bg-[#7DA085] hover:bg-[#688A70] disabled:bg-gray-300"
              }`}
            >
              {isSaving ? "Saving..." : isSaved ? "Saved!" : "Save"}
            </button>
            <button 
              onClick={loadPastJournals}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-full text-[13px] font-medium transition-colors"
            >
              See All Journal
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full h-[180px] sm:h-[220px] resize-none border border-gray-200 rounded-[20px] p-5 font-sans text-[15px] outline-none focus:ring-2 focus:ring-[#7DA085]/30 focus:border-[#7DA085] placeholder:text-gray-300 text-gray-700 mb-4"
        />

        {/* Tags display */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 bg-[#7DA085]/10 text-[#5D8B66] px-4 py-2 rounded-xl text-[13px] font-medium">
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          
          <div className="relative">
            {showTagInput ? (
              <div className="relative">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => handleTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      addTag(tagInput.trim());
                    }
                    if (e.key === 'Escape') setShowTagInput(false);
                  }}
                  onBlur={() => setTimeout(() => setShowTagInput(false), 200)}
                  autoFocus
                  placeholder="Type a tag..."
                  className="w-32 px-4 py-2 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-1 focus:ring-[#7DA085]"
                />
                {filteredSuggestions.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 min-w-[150px]">
                    {filteredSuggestions.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addTag(s)}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        #{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => {
                  setShowTagInput(true);
                  setFilteredSuggestions(TAG_SUGGESTIONS.filter(s => !tags.includes(s)));
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Tag
              </button>
            )}
          </div>
        </div>
      </div>

      {/* See All Journal Modal */}
      <AnimatePresence>
        {showAllJournals && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowAllJournals(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] p-6 lg:p-8 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[22px] font-sans font-semibold text-black">All Journals</h3>
                <button onClick={() => setShowAllJournals(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {loadingJournals ? (
                  <p className="text-center text-gray-400 py-10">Loading journals...</p>
                ) : pastJournals.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No journal entries yet.</p>
                  </div>
                ) : (
                  pastJournals.map((journal) => (
                    <div key={journal.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] font-medium text-gray-500">
                          {new Date(journal.entry_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{moodEmoji[journal.mood] || "😐"}</span>
                          <span className="text-[12px] font-medium text-[#5D8B66] bg-[#7DA085]/10 px-2 py-0.5 rounded-lg">{journal.mood}</span>
                        </div>
                      </div>
                      <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">{journal.content}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
