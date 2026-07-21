import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";

export function ActivitySuggestionWidget() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [moodLevel, setMoodLevel] = useState("balanced"); // to show reason
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calmingActivities = [
    { id: 1, title: "Guided Meditation", desc: "Take 10 minutes to focus on your breathing and release tension.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=150&q=80" },
    { id: 2, title: "Slow Jogging", desc: "A gentle, low-pressure run to clear your mind and naturally release tension.", image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=150&q=80" },
    { id: 3, title: "Listening To Podcast", desc: "Let an engaging story or a comforting voice gently shift your focus.", image: "https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?auto=format&fit=crop&w=150&q=80" },
    { id: 10, title: "Deep Breathing", desc: "Practice 4-7-8 breathing technique to quickly lower your stress levels.", image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=150&q=80" },
    { id: 11, title: "Warm Bath", desc: "A simple way to physically relax your muscles and let go of the day's worries.", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=150&q=80" },
    { id: 12, title: "Ambient Music", desc: "Put on some lo-fi or nature sounds to calm your nervous system.", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80" }
  ];

  const productiveActivities = [
    { id: 4, title: "Learn a New Skill", desc: "Use your high energy to pick up a new hobby or watch a tutorial.", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=150&q=80" },
    { id: 5, title: "Organize Workspace", desc: "Declutter your environment to keep your mind sharp and motivated.", image: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?auto=format&fit=crop&w=150&q=80" },
    { id: 6, title: "Reading A Book", desc: "Dive deep into a topic you've been wanting to explore.", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=150&q=80" },
    { id: 13, title: "Plan Your Week", desc: "Write down your top priorities and schedule them to maintain focus and momentum.", image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=150&q=80" },
    { id: 14, title: "Creative Project", desc: "Use your energy to draw, write, or build something you've been putting off.", image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=150&q=80" },
    { id: 15, title: "Tackle a Challenge", desc: "Use your peak energy to complete the hardest task on your to-do list.", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=150&q=80" }
  ];

  const balancedActivities = [
    { id: 7, title: "Light Stretching", desc: "Keep your body moving gently to maintain your equilibrium.", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=150&q=80" },
    { id: 8, title: "Call a Friend", desc: "Catch up with someone you care about.", image: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=150&q=80" },
    { id: 9, title: "Journaling", desc: "Reflect on your day and write down a few thoughts.", image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=150&q=80" },
    { id: 16, title: "Nature Walk", desc: "Spend 15 minutes walking outside to refresh your mind and get some fresh air.", image: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=150&q=80" },
    { id: 17, title: "Mindful Break", desc: "Step away from your screen and fully focus on enjoying your favorite beverage.", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=150&q=80" },
    { id: 18, title: "Digital Detox", desc: "Disconnect from social media for an hour to center yourself.", image: "https://images.unsplash.com/photo-1510442650500-93217e634e4c?auto=format&fit=crop&w=150&q=80" }
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
          activitySuggestion: `[START_ACTIVITY]\nNama Aktivitas: ${activity.title}\nDeskripsi: ${activity.desc}\n\nHalo Komi, tolong bimbing dan temani saya melakukan aktivitas ini sekarang.`
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[20px] font-sans font-semibold text-black">Suggested For You</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-[13px] font-medium px-4 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 transition-colors"
        >
          See More
        </button>
      </div>
      
      <div className="space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {activities.slice(0, 3).map((activity) => (
          <div 
            key={activity.id} 
            className="flex items-center p-3 rounded-[16px] border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer group"
          >
            <div className="w-[60px] h-[60px] rounded-[12px] overflow-hidden flex-shrink-0">
              <img src={activity.image} alt={activity.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="ml-4 flex-1">
              <h4 className="font-semibold text-black text-[14px] font-sans leading-tight mb-1">{activity.title}</h4>
              <p className="text-[12px] text-gray-400 font-sans leading-[1.4] line-clamp-2">{activity.desc}</p>
            </div>
          </div>
        ))}
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
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 max-h-[85vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold font-sans text-gray-900 mb-2 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-[#7DA085]" />
                    Rekomendasi Aktivitas
                  </h2>
                  <p className="text-sm text-gray-500 max-w-lg">
                    {moodLevel === "calming" && "Berdasarkan riwayat emosi Anda yang sedang menurun, berikut adalah aktivitas menenangkan untuk memulihkan energi."}
                    {moodLevel === "productive" && "Anda sedang bersemangat! Berikut adalah aktivitas produktif untuk memaksimalkan potensi Anda hari ini."}
                    {moodLevel === "balanced" && "Kondisi Anda cukup seimbang. Berikut adalah rutinitas ringan untuk menjaga kestabilan pikiran Anda."}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-full sm:w-32 h-32 sm:h-auto rounded-xl overflow-hidden flex-shrink-0">
                      <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-lg font-bold text-gray-900 font-sans mb-2">{activity.title}</h4>
                      <p className="text-sm text-gray-600 font-sans leading-relaxed">{activity.desc}</p>
                      
                      <button 
                        onClick={() => handleStartActivity(activity)}
                        className="mt-4 self-start px-6 py-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white font-medium text-sm rounded-full transition-all duration-300"
                      >
                        Mulai Aktivitas
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
