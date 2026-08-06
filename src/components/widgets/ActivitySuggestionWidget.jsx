import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, ChevronDown, Play } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslation } from "react-i18next";

export function ActivitySuggestionWidget() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [moodLevel, setMoodLevel] = useState("balanced"); // to show reason
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activityData = t('activities', { returnObjects: true }) || {};

  const calmingActivities = [
    { id: 1, title: activityData.guided_meditation?.title || "Guided Meditation", desc: activityData.guided_meditation?.desc || "Take 10 minutes to focus on your breathing and release tension.", image: "https://images.unsplash.com/vector-1785690304093-66d9be696abf?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 2, title: activityData.slow_jogging?.title || "Slow Jogging", desc: activityData.slow_jogging?.desc || "A gentle, low-pressure run to clear your mind and naturally release tension.", image: "https://images.unsplash.com/vector-1785734405408-482623ce3576?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 3, title: activityData.podcast?.title || "Listening To Podcast", desc: activityData.podcast?.desc || "Let an engaging story or a comforting voice gently shift your focus.", image: "https://images.unsplash.com/vector-1785734427887-01744fe64696?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 10, title: activityData.deep_breathing?.title || "Deep Breathing", desc: activityData.deep_breathing?.desc || "Practice 4-7-8 breathing technique to quickly lower your stress levels.", image: "https://images.unsplash.com/vector-1785734481291-b9f8be7500a5?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 11, title: activityData.warm_bath?.title || "Warm Bath", desc: activityData.warm_bath?.desc || "A simple way to physically relax your muscles and let go of the day's worries.", image: "https://images.unsplash.com/vector-1785734548377-200e6b421411?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 12, title: activityData.ambient_music?.title || "Ambient Music", desc: activityData.ambient_music?.desc || "Put on some lo-fi or nature sounds to calm your nervous system.", image: "https://images.unsplash.com/vector-1785734604452-83972c53fc25?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
  ];

  const productiveActivities = [
    { id: 4, title: activityData.learn_skill?.title || "Learn a New Skill", desc: activityData.learn_skill?.desc || "Use your high energy to pick up a new hobby or watch a tutorial.", image: "https://images.unsplash.com/vector-1785734757801-bee28e18bb36?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 5, title: activityData.organize_workspace?.title || "Organize Workspace", desc: activityData.organize_workspace?.desc || "Declutter your environment to keep your mind sharp and motivated.", image: "https://images.unsplash.com/vector-1785734898202-c858e75ed664?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 6, title: activityData.reading?.title || "Reading A Book", desc: activityData.reading?.desc || "Dive deep into a topic you've been wanting to explore.", image: "https://images.unsplash.com/vector-1785734911585-510dee0a4d40?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 13, title: activityData.plan_week?.title || "Plan Your Week", desc: activityData.plan_week?.desc || "Write down your top priorities and schedule them to maintain focus and momentum.", image: "https://images.unsplash.com/vector-1785734903614-5656448aa630?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 14, title: activityData.creative_project?.title || "Creative Project", desc: activityData.creative_project?.desc || "Use your energy to draw, write, or build something you've been putting off.", image: "https://images.unsplash.com/vector-1785734917550-c084eab0a332?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 15, title: activityData.tackle_challenge?.title || "Tackle a Challenge", desc: activityData.tackle_challenge?.desc || "Use your peak energy to complete the hardest task on your to-do list.", image: "https://images.unsplash.com/vector-1785734935413-289696d4df74?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
  ];

  const balancedActivities = [
    { id: 7, title: activityData.light_stretching?.title || "Light Stretching", desc: activityData.light_stretching?.desc || "Keep your body moving gently to maintain your equilibrium.", image: "https://images.unsplash.com/vector-1785734635762-2ba4b5285041?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 8, title: activityData.call_friend?.title || "Call a Friend", desc: activityData.call_friend?.desc || "Catch up with someone you care about.", image: "https://images.unsplash.com/vector-1785734647996-edba79e1cf3d?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 9, title: activityData.journaling?.title || "Journaling", desc: activityData.journaling?.desc || "Reflect on your day and write down a few thoughts.", image: "https://images.unsplash.com/vector-1785734692939-292035056aed?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 16, title: activityData.nature_walk?.title || "Nature Walk", desc: activityData.nature_walk?.desc || "Spend 15 minutes walking outside to refresh your mind and get some fresh air.", image: "https://images.unsplash.com/vector-1785734705149-161149da282d?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 17, title: activityData.mindful_break?.title || "Mindful Break", desc: activityData.mindful_break?.desc || "Step away from your screen and fully focus on enjoying your favorite beverage.", image: "https://images.unsplash.com/vector-1785734730061-d6e44591553a?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { id: 18, title: activityData.digital_detox?.title || "Digital Detox", desc: activityData.digital_detox?.desc || "Disconnect from social media for an hour to center yourself.", image: "https://images.unsplash.com/vector-1785734752702-2704f246eefb?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
  ];

  const fetchAndSuggest = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mood_entries")
      .select("mood_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const score = data[0].mood_score;
      if (score <= 2) {
        setActivities(calmingActivities);
        setMoodLevel("calming");
      }
      else if (score === 3) {
        setActivities(balancedActivities);
        setMoodLevel("balanced");
      }
      else {
        setActivities(productiveActivities);
        setMoodLevel("productive");
      }
    } else {
      setActivities(balancedActivities);
      setMoodLevel("balanced");
    }
  }, [user]);

  useEffect(() => {
    fetchAndSuggest();
  }, [fetchAndSuggest]);

  // Listen for mood updates
  useEffect(() => {
    const handler = () => fetchAndSuggest();
    window.addEventListener('mood-updated', handler);
    return () => window.removeEventListener('mood-updated', handler);
  }, [fetchAndSuggest]);

  const handleStartActivity = (activity) => {
    if (activity.title === "Journaling") {
      navigate("/journaling");
    } else {
      navigate("/chat", {
        state: {
          activitySuggestion: t('activities.chat_prompt', { title: activity.title, desc: activity.desc })
        }
      });
    }
  };

  return (
    <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-komorebi-dark-border h-full flex flex-col transition-colors duration-300" data-tour-id="activity-suggestion">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[20px] font-sans font-semibold text-black dark:text-white transition-colors duration-300">{t('dashboard.activity_suggestion.title')}</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center text-[13px] font-medium px-4 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg text-black dark:text-white hover:bg-gray-50 dark:hover:bg-black/20 transition-colors"
        >
          {t('dashboard.activity_suggestion.see_more')}
        </button>
      </div>
      
      <div className="relative flex-1">
        <div className="max-h-[285px] space-y-3 overflow-y-auto pr-1 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              onClick={() => handleStartActivity(activity)}
              className="flex items-center p-3 rounded-[16px] border border-gray-100 dark:border-transparent hover:border-[#B5CCBD] dark:hover:border-[#43674F] hover:bg-gray-50 dark:hover:bg-[#2A3F33] transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="w-[60px] h-[60px] rounded-[12px] overflow-hidden flex-shrink-0">
                <img src={activity.image} alt={activity.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="ml-4 flex-1 transition-all duration-300">
                <h4 className="font-semibold text-black dark:text-gray-200 text-[14px] font-sans leading-tight mb-1 transition-colors duration-300 group-hover:text-[#5D8B66] dark:group-hover:text-[#7DA085]">{activity.title}</h4>
                <p className="text-[12px] text-gray-400 dark:text-komorebi-dark-muted font-sans leading-[1.4] line-clamp-2 transition-colors duration-300">{activity.desc}</p>
              </div>
              
              {/* Quick Action Play Button (Appears on Hover) */}
              <div className="ml-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.1)] text-white">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[12px] font-light tracking-wide">{t('common.start', 'Start')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-komorebi-dark-card to-transparent pointer-events-none flex items-end justify-center pb-1 z-10">
          <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full p-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-1 animate-bounce border border-gray-100 dark:border-gray-700">
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-komorebi-dark-card rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 max-h-[85vh] flex flex-col transition-colors duration-300"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-komorebi-dark-border flex items-start justify-between bg-gray-50/50 dark:bg-black/20 transition-colors duration-300">
                <div>
                  <h2 className="text-2xl font-medium font-sans text-gray-900 dark:text-white mb-2 flex items-center gap-2 transition-colors duration-300">
                    <Activity className="w-6 h-6 text-[#7DA085]" />
                    {t('dashboard.activity_suggestion.modal_title')}
                  </h2>
                  <p className="text-sm font-light text-gray-500 dark:text-komorebi-dark-muted max-w-lg transition-colors duration-300">
                    {moodLevel === "calming" && t('dashboard.activity_suggestion.reason_calming')}
                    {moodLevel === "productive" && t('dashboard.activity_suggestion.reason_productive')}
                    {moodLevel === "balanced" && t('dashboard.activity_suggestion.reason_balanced')}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {[...calmingActivities, ...balancedActivities, ...productiveActivities].map((activity) => (
                  <div key={activity.id} className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl bg-white dark:bg-komorebi-dark-bg border border-gray-100 dark:border-transparent hover:shadow-md transition-shadow">
                    <div className="w-full sm:w-[120px] h-[160px] sm:h-[120px] rounded-xl overflow-hidden flex-shrink-0">
                      <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200 font-sans mb-2 transition-colors duration-300">{activity.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-sans leading-relaxed transition-colors duration-300">{activity.desc}</p>
                      
                      <button 
                        onClick={() => handleStartActivity(activity)}
                        className="mt-4 self-start px-6 py-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white font-medium text-sm rounded-full transition-all duration-300"
                      >
                        {t('dashboard.activity_suggestion.start_activity')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
