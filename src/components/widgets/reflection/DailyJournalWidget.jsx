import { useState, useEffect, useRef } from 'react';
import { Plus, X, BookOpen, Lightbulb, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';
import { dispatchJournalUpdate } from '../../../hooks/useMoodEvent';
import { getLocalDateString } from '../../../utils/date';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../ui/Skeleton';
import useToastStore from '../../../stores/useToastStore';

export function DailyJournalWidget() {
  const { t } = useTranslation();
  const CBT_PROMPTS = t('journaling.daily_journal.prompts', { returnObjects: true });
  const TAG_SUGGESTIONS = t('journaling.daily_journal.tags', { returnObjects: true });
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
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
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [existingEntryId, setExistingEntryId] = useState(null);
  const [activePrompt, setActivePrompt] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
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
          const parsedTags = hashTags.map(t => t.replace('#', ''));
          setTags([...new Set(parsedTags)]); // Remove duplicate tags
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
      addToast(t('journaling.daily_journal.save_error') + " " + (error.message || ""), 'error');
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

  const handleShufflePrompt = () => {
    let newPrompt;
    do {
      newPrompt = CBT_PROMPTS[Math.floor(Math.random() * CBT_PROMPTS.length)];
    } while (newPrompt === activePrompt && CBT_PROMPTS.length > 1);
    setActivePrompt(newPrompt);
  };

  return (
    <>
      <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col w-full transition-colors duration-300">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between ${isMinimized ? '' : 'mb-6'} gap-4 transition-all duration-300`}>
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <h3 className="text-[20px] font-sans font-medium text-black dark:text-white transition-colors duration-300">{t('journaling.daily_journal.title')}</h3>
            <button 
              onClick={() => setIsMinimized(!isMinimized)} 
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#32473D] rounded-xl transition-colors text-gray-500 dark:text-gray-400 sm:hidden"
            >
              {isMinimized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {!isMinimized ? (
              <motion.div 
                key="buttons-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3"
              >
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || isSaved || !content.trim()}
                    className={`w-[140px] flex justify-center items-center py-2 border rounded-full text-[13px] font-light transition-all duration-300 text-white ${
                      isSaved 
                        ? "bg-green-500 border-transparent shadow-sm" 
                        : !content.trim() || isSaving 
                          ? "bg-gray-300 border-transparent cursor-not-allowed shadow-sm" 
                          : "bg-gradient-to-b from-[#5F916F] to-[#94B59F] border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px]"
                    }`}
                  >
                    {isSaving ? t('journaling.daily_journal.saving') : isSaved ? t('journaling.daily_journal.saved') : t('journaling.daily_journal.save')}
                  </button>
                  <button 
                    onClick={loadPastJournals}
                    className="w-[140px] flex justify-center items-center border border-[#B5CCBD] dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg text-black dark:text-white hover:bg-gray-50 dark:hover:bg-black/20 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                  >
                    {t('journaling.daily_journal.see_all')}
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsMinimized(!isMinimized)} 
                  className="hidden sm:flex p-1.5 hover:bg-gray-100 dark:hover:bg-[#32473D] rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="buttons-minimized"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:flex"
              >
                <button 
                  onClick={() => setIsMinimized(false)} 
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#32473D] rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Guided CBT Prompts Area */}
        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.div
              key="journal-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden flex flex-col"
            >
              <AnimatePresence>
          {activePrompt && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#7DA085]/10 border border-[#7DA085]/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-white dark:bg-[#32473D] p-2 rounded-xl shrink-0">
                    <Lightbulb className="w-5 h-5 text-[#5D8B66] dark:text-[#7DA085]" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-sans font-semibold text-[#5D8B66] dark:text-[#7DA085] uppercase tracking-wider mb-1">{t('journaling.daily_journal.guided_prompt')}</h4>
                    <p className="text-[14px] font-sans text-gray-700 dark:text-gray-200 font-medium leading-relaxed">{activePrompt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button onClick={handleShufflePrompt} className="p-2 hover:bg-[#7DA085]/20 text-[#5D8B66] rounded-xl transition-colors" title={t('journaling.daily_journal.change_prompt', 'Change Prompt')}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActivePrompt(null)} className="p-2 hover:bg-[#7DA085]/20 text-[#5D8B66] rounded-xl transition-colors" title={t('common.close', 'Close')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('journaling.daily_journal.placeholder')}
            className="w-full h-[180px] sm:h-[220px] resize-none border border-gray-200 dark:border-[#32473D] rounded-[20px] p-5 font-sans text-[15px] outline-none focus:ring-2 focus:ring-[#7DA085]/30 focus:border-[#7DA085] placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-700 dark:text-white bg-transparent mb-4 transition-colors duration-300"
          />
          {!activePrompt && (
            <button 
              onClick={handleShufflePrompt}
              className="absolute bottom-8 right-4 flex items-center gap-2 bg-white/80 dark:bg-[#1c2620]/80 backdrop-blur-md border border-gray-200 dark:border-[#32473D] hover:border-[#7DA085] hover:text-[#5D8B66] text-gray-500 dark:text-gray-400 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 shadow-sm hover:shadow"
            >
              <Lightbulb className="w-4 h-4" />
              {t('journaling.daily_journal.help_me_write')}
            </button>
          )}
        </div>

        {/* Tags display */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="inline-flex items-center gap-1.5 bg-[#7DA085]/10 text-[#5D8B66] px-4 py-2 rounded-xl text-[13px] font-medium">
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
                  placeholder={t('journaling.daily_journal.tag_placeholder')}
                  className="w-32 px-4 py-2 rounded-xl border border-gray-200 dark:border-[#32473D] text-[13px] outline-none focus:ring-1 focus:ring-[#7DA085] bg-transparent dark:text-white transition-colors"
                />
                {filteredSuggestions.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 bg-white dark:bg-komorebi-dark-bg border border-gray-100 dark:border-komorebi-dark-border rounded-xl shadow-lg py-1 z-50 min-w-[150px] transition-colors">
                    {filteredSuggestions.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addTag(s)}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-black/20 text-gray-600 dark:text-gray-300 transition-colors"
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
                className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-[#32473D] hover:bg-gray-50 dark:hover:bg-black/20 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('journaling.daily_journal.add_tag')}
              </button>
            )}
          </div>
        </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl transition-colors duration-300"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[22px] font-sans font-semibold text-black dark:text-white transition-colors duration-300">{t('journaling.daily_journal.modal_title')}</h3>
                <button onClick={() => setShowAllJournals(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {loadingJournals ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-100 dark:border-[#32473D] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <Skeleton className="w-32 h-4" />
                          <Skeleton className="w-20 h-6 rounded-lg" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="w-full h-3" />
                          <Skeleton className="w-full h-3" />
                          <Skeleton className="w-4/5 h-3" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : pastJournals.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">{t('journaling.daily_journal.empty')}</p>
                  </div>
                ) : (
                  pastJournals.map((journal) => (
                    <div 
                      key={journal.id} 
                      onClick={() => setSelectedJournal(journal)}
                      className="border border-gray-100 dark:border-[#32473D] rounded-2xl p-5 hover:border-gray-200 dark:hover:border-[#5D8B66]/50 hover:bg-gray-50 dark:hover:bg-black/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                          {new Date(journal.entry_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{moodEmoji[journal.mood] || "😐"}</span>
                          <span className="text-[12px] font-medium text-[#5D8B66] bg-[#7DA085]/10 px-2 py-0.5 rounded-lg">{journal.mood}</span>
                        </div>
                      </div>
                      <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap line-clamp-4">{journal.content}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Journal Modal */}
      <AnimatePresence>
        {selectedJournal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4"
            onClick={() => setSelectedJournal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl transition-colors duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-[20px] font-sans font-semibold text-black dark:text-white transition-colors duration-300">
                    {new Date(selectedJournal.entry_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg">{moodEmoji[selectedJournal.mood] || "😐"}</span>
                    <span className="text-[13px] font-medium text-[#5D8B66] bg-[#7DA085]/10 px-3 py-1 rounded-lg">{selectedJournal.mood}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedJournal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap transition-colors duration-300">
                  {selectedJournal.content}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
