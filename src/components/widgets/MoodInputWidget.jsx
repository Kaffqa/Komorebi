import { useState, useEffect, useCallback } from "react";
import { Frown, Annoyed, Meh, Smile, Laugh } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { dispatchMoodUpdate } from "../../hooks/useMoodEvent";

export function MoodInputWidget() {
  const { user } = useAuthStore();
  const [moodScore, setMoodScore] = useState(4);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const moodIcons = [
    <Frown key="1" className="w-[22px] h-[22px] text-rose-500" />,
    <Annoyed key="2" className="w-[22px] h-[22px] text-orange-500" />,
    <Meh key="3" className="w-[22px] h-[22px] text-yellow-500" />,
    <Smile key="4" className="w-[22px] h-[22px] text-lime-500" />,
    <Laugh key="5" className="w-[22px] h-[22px] text-emerald-500" />
  ];
  const labels = ["Bad", "Not Bad", "Neutral", "Good", "Very Good"];

  // Load today's mood if it exists
  useEffect(() => {
    async function loadTodayMood() {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('mood_entries')
        .select('mood_score, note')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (data) {
        setMoodScore(data.mood_score);
        if (data.note) setNotes(data.note);
      }
    }
    loadTodayMood();
  }, [user]);

  const handleSend = async () => {
    if (!user) return;
    setIsLoading(true);
    setIsSuccess(false);
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if entry exists for today
      const { data: existing } = await supabase
        .from('mood_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing entry
        ({ error } = await supabase
          .from('mood_entries')
          .update({
            mood: labels[moodScore - 1],
            mood_score: moodScore,
            note: notes,
          })
          .eq('id', existing.id));
      } else {
        // Insert new entry
        ({ error } = await supabase
          .from('mood_entries')
          .insert({
            user_id: user.id,
            mood: labels[moodScore - 1],
            mood_score: moodScore,
            note: notes,
            entry_date: today,
          }));
      }

      if (error) throw error;
      
      setIsSuccess(true);
      setNotes("");
      dispatchMoodUpdate(); // Notify other widgets
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving mood:", error);
      alert("Failed to save mood: " + (error.message || "Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-[20px] font-sans font-semibold text-black mb-1">How Are You Feeling Today?</h3>
      <p className="text-[14px] text-gray-400 font-sans mb-12">
        Sharing your mood gives us a clearer picture of your well being so we can tailor your care
      </p>

      {/* Custom Slider */}
      <div className="mb-14 px-4 relative w-full">
        <div className="relative w-full h-3 bg-[#E5EBE7] rounded-full">
          {/* Inner container for active area to prevent label overflow while maintaining equal spacing */}
          <div className="absolute inset-y-0 left-[10%] right-[10%]">
            {/* Invisible native slider for drag interaction */}
            <input 
              type="range"
              min="1"
              max="5"
              step="1"
              value={moodScore}
              onChange={(e) => setMoodScore(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
            />

            <div 
              className="absolute top-1/2 -translate-y-1/2 -ml-[18px] w-9 h-9 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center transition-all duration-300 ease-out z-10 pointer-events-none"
              style={{ left: `${((moodScore - 1) / 4) * 100}%` }}
            >
              {moodIcons[moodScore - 1]}
            </div>
            
            <div className="absolute top-full mt-4 w-full h-6">
               {labels.map((label, idx) => (
                  <button 
                    key={label} 
                    onClick={() => setMoodScore(idx + 1)}
                    className={`absolute -translate-x-1/2 whitespace-nowrap text-[13px] font-sans font-medium transition-colors z-30 ${moodScore === idx + 1 ? "text-[#5D8B66]" : "text-[#5D8B66]/70 hover:text-[#5D8B66]"}`}
                    style={{ left: `${(idx / 4) * 100}%` }}
                  >
                    {label}
                  </button>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="flex-1 mb-6 flex flex-col">
        <textarea 
          placeholder="What's on your mind today?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full flex-1 min-h-[140px] resize-none border border-gray-200 rounded-[20px] p-5 font-sans text-[15px] outline-none focus:ring-2 focus:ring-[#7DA085]/30 focus:border-[#7DA085] placeholder:text-gray-300 text-gray-700"
        />
      </div>

      <button 
        onClick={handleSend}
        disabled={isLoading || isSuccess}
        className={`w-full py-3.5 rounded-full font-medium transition-colors shadow-sm text-[15px] text-white ${
          isSuccess 
            ? "bg-green-500 hover:bg-green-600" 
            : "bg-[#7DA085] hover:bg-[#688A70] disabled:bg-gray-300"
        }`}
      >
        {isLoading ? "Sending..." : isSuccess ? "Saved Successfully!" : "Send"}
      </button>
    </div>
  );
}
