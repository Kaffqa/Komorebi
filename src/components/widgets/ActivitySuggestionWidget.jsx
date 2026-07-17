import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";

export function ActivitySuggestionWidget() {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState([]);

  const calmingActivities = [
    { id: 1, title: "Guided Meditation", desc: "Take 10 minutes to focus on your breathing and release tension.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=150&q=80" },
    { id: 2, title: "Slow Jogging", desc: "A gentle, low-pressure run to clear your mind and naturally release tension.", image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=150&q=80" },
    { id: 3, title: "Listening To Podcast", desc: "Let an engaging story or a comforting voice gently shift your focus.", image: "https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?auto=format&fit=crop&w=150&q=80" }
  ];

  const productiveActivities = [
    { id: 4, title: "Learn a New Skill", desc: "Use your high energy to pick up a new hobby or watch a tutorial.", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=150&q=80" },
    { id: 5, title: "Organize Workspace", desc: "Declutter your environment to keep your mind sharp and motivated.", image: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?auto=format&fit=crop&w=150&q=80" },
    { id: 6, title: "Reading A Book", desc: "Dive deep into a topic you've been wanting to explore.", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=150&q=80" }
  ];

  const balancedActivities = [
    { id: 7, title: "Light Stretching", desc: "Keep your body moving gently to maintain your equilibrium.", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=150&q=80" },
    { id: 8, title: "Call a Friend", desc: "Catch up with someone you care about.", image: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=150&q=80" },
    { id: 9, title: "Journaling", desc: "Reflect on your day and write down a few thoughts.", image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=150&q=80" }
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
      if (score <= 2) setActivities(calmingActivities);
      else if (score === 3) setActivities(balancedActivities);
      else setActivities(productiveActivities);
    } else {
      setActivities(balancedActivities);
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

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[20px] font-sans font-semibold text-black">Suggested For You</h3>
        <button className="text-[13px] font-medium px-4 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 transition-colors">
          See More
        </button>
      </div>
      
      <div className="space-y-3 overflow-y-auto pr-1">
        {activities.map((activity) => (
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
    </div>
  );
}
