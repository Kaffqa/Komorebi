import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Download, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../services/supabase';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { extractFavoriteActivities } from '../../../services/gemini';
import CardShareTemplate from '../../../assets/Card-share.svg';
import useToastStore from '../../../stores/useToastStore';
import { getLocalDateString } from '../../../utils/date';

export function WeeklyRecapWidget() {
  const { t } = useTranslation();
  const { profile, user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [recapData, setRecapData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState(null);

  const captureRef = useRef(null);

  const userName = profile?.display_name || t('onboarding.fallback_name', 'Teman');
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=5F916F&color=fff&size=400`;

  // Define colors for each day to strictly match the design
  const dayColors = {
    0: "#E63946", // Mon (Red)
    1: "#2B2163", // Tue (Dark Blue/Purple)
    2: "#2A9D8F", // Wed (Green)
    3: "#A5A03A", // Thu (Yellow/Olive)
    4: "#6D2C4D", // Fri (Dark Magenta)
    5: "#0077B6", // Sat (Blue)
    6: "#E76F51", // Sun (Orange)
  };

  const getMoodSentence = (moodScore) => {
    switch (Math.round(moodScore)) {
      case 5: return "had a fantastic day!";
      case 4: return "mood was good";
      case 3: return "had an okay day";
      case 2: return "isn't good";
      case 1: return "had a bad day";
      default: return "took a break";
    }
  };

  const loadData = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      const now = new Date();
      // Get index of today (0 = Mon, 6 = Sun)
      const currentDayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
      
      // Calculate this week's Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() - currentDayIdx);
      const mondayStr = getLocalDateString(monday);
      
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('entry_date, mood_score')
        .eq('user_id', user.id)
        .gte('entry_date', mondayStr)
        .order('entry_date', { ascending: true });

      const dayMap = {};
      if (moodEntries) {
        moodEntries.forEach(entry => {
          // entry_date is YYYY-MM-DD, parsing it directly in JS might use UTC depending on browser.
          // Better to split and create local date to avoid timezone shift
          const [y, m, d] = entry.entry_date.split('-');
          const entryDate = new Date(y, m - 1, d);
          let dayIdx = entryDate.getDay() - 1;
          if (dayIdx === -1) dayIdx = 6; // Sunday
          dayMap[dayIdx] = entry.mood_score;
        });
      }

      const formattedMoods = [];
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      for (let i = 0; i < 7; i++) {
        const isFuture = i > currentDayIdx;
        let descText = "";
        
        if (isFuture) {
          descText = "is still a mystery ✨";
        } else if (dayMap[i]) {
          descText = getMoodSentence(dayMap[i]);
        } else {
          descText = "took a break";
        }

        formattedMoods.push({
          day: days[i],
          desc: `${userName} ${descText}`,
          color: isFuture ? "#A0AAB2" : dayColors[i],
          isFuture
        });
      }

      const { data: conv } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let chatText = "";
      if (conv) {
        const { data: chatLogs } = await supabase
          .from('chat_messages')
          .select('content, sender')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (chatLogs && chatLogs.length > 0) {
          chatText = chatLogs.reverse().map(c => `${c.sender}: ${c.content}`).join("\n");
        }
      }

      const favActions = await extractFavoriteActivities(chatText);

      setRecapData({
        moods: formattedMoods,
        favActions: favActions.slice(0, 3)
      });

      setShowPreview(true);

      setTimeout(() => {
        captureCard();
      }, 1000);

    } catch (err) {
      console.error(err);
      addToast(t('common.error_occurred', 'Terjadi kesalahan.'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const captureCard = async () => {
    if (!captureRef.current) return;
    try {
      // Small delay to ensure all images (SVG background, avatar) are fully rendered
      await new Promise(res => setTimeout(res, 500));

      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        // Removed explicit windowWidth/Height as it can cause cropping when element is off-screen
      });
      
      canvas.toBlob((blob) => {
        setGeneratedBlob(blob);
        setGeneratedUrl(URL.createObjectURL(blob));
      }, 'image/png');
    } catch (err) {
      console.error("html2canvas error:", err);
    }
  };

  const handleShare = async () => {
    if (!generatedBlob) return;
    
    const file = new File([generatedBlob], "komorebi_weekly_recap.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Weekly Recap - Komorebi',
          text: 'Here is my weekly mental health recap from Komorebi! 🌱',
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      addToast("Perangkat tidak mendukung direct share. Silakan klik Save.", "warning");
    }
  };

  const handleSave = () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `komorebi_weekly_recap.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-4 lg:p-5 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[20px] font-sans font-semibold text-black dark:text-white mb-6">
            {t('journaling.weekly_recap.title')}
          </h3>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 py-5 bg-[#F5F8F6] dark:bg-[#1E2A22] rounded-2xl border border-dashed border-[#5F916F]/30 text-center">
          <div className="w-12 h-12 bg-[#5F916F]/10 text-[#5F916F] rounded-full flex items-center justify-center mb-2">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h4 className="font-sans font-semibold text-[17px] text-gray-800 dark:text-gray-100 mb-2">
            {generatedUrl ? t('journaling.weekly_recap.modal_title') : t('journaling.weekly_recap.subtitle')}
          </h4>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 font-sans max-w-[280px] mx-auto">
            {generatedUrl ? t('journaling.weekly_recap.modal_desc') : t('journaling.weekly_recap.description')}
          </p>
          <button
            onClick={() => {
              if (generatedUrl) setShowPreview(true);
              else loadData();
            }}
            disabled={isGenerating}
            className={`px-6 py-3 text-white font-sans font-medium rounded-full flex items-center justify-center gap-2 transition-all duration-300 ${
              isGenerating
                ? "bg-gray-300 cursor-not-allowed shadow-sm"
                : "bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px]"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('journaling.weekly_recap.generating')}
              </>
            ) : generatedUrl ? (
              t('journaling.weekly_recap.view_button')
            ) : (
              t('journaling.weekly_recap.generate_button')
            )}
          </button>
        </div>
      </div>

      {/* Modal Popup */}
      {/* Modal Popup */}
      {showPreview && generatedUrl && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-sans font-semibold mb-6 text-gray-800 dark:text-gray-100">Your Weekly Recap</h3>
            
            <div className="w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 mb-6 bg-gray-50 flex items-center justify-center aspect-[780/1260] relative">
              <img src={generatedUrl} alt="Recap Preview" className="w-full h-full object-contain" />
            </div>

            <div className="flex w-full gap-3">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white font-sans font-medium rounded-full transition-all"
              >
                <Share2 className="w-4 h-4" />
                {t('journaling.weekly_recap.share')}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-2 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-300 dark:border-gray-600 shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),inset_0_-2px_3px_rgba(0,0,0,0.05),0_4px_6px_rgba(0,0,0,0.05)] hover:brightness-105 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:translate-y-[1px] text-gray-700 dark:text-gray-200 font-sans font-medium rounded-full transition-all"
              >
                <Download className="w-4 h-4" />
                {t('journaling.weekly_recap.save')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* OFF-SCREEN RENDERER (Strictly 780x1260 px) */}
      {recapData && (
        <div 
          className="absolute pointer-events-none" 
          style={{ top: '-9999px', left: '-9999px' }}
        >
          <div 
            ref={captureRef}
            className="relative bg-[#EFEFE5] overflow-hidden"
            style={{ width: '780px', height: '1260px' }}
          >
            {/* SVG Background */}
            <img src={CardShareTemplate} className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" alt="bg" />

            {/* Profile Picture Box (Matched 1:1 to inner frame area) */}
            <div 
              className="absolute z-10 overflow-hidden bg-[#5F916F]"
              style={{ 
                top: '190px', 
                left: '190px', 
                width: '400px', 
                height: '400px',
                border: '6px solid #3A4335',
                borderRadius: '50%' // Circular frame
              }}
            >
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/9.x/notionists/png?seed=${profile?.username || userName}`} 
                crossOrigin="anonymous" 
                className="w-full h-full object-cover" 
                alt="avatar" 
              />
            </div>

            {/* User Name */}
            <div 
              className="absolute z-10 w-full text-center"
              style={{ top: '595px', left: '0' }}
            >
              <h1 className="text-[#203323] m-0 leading-none tracking-tight" style={{ fontSize: '46px', fontFamily: '"Sen", sans-serif', fontWeight: 700 }}>
                {userName}
              </h1>
            </div>

            {/* Left Column: The Moods */}
            <div className="absolute z-10" style={{ top: '665px', left: '65px' }}>
              <h2 className="text-[#5E7764] mb-3" style={{ fontSize: '26px', fontFamily: '"Sen", sans-serif', fontWeight: 500, letterSpacing: '0.02em' }}>
                The moods
              </h2>
              <div className="flex flex-col" style={{ gap: '14px' }}>
                {recapData.moods.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="font-bold w-[75px]" style={{ fontSize: '30px', color: m.color, fontFamily: '"Sen", sans-serif', fontWeight: 700 }}>
                      {m.day}
                    </span>
                    <span 
                      className="text-[#203323] font-bold max-w-[280px]" 
                      style={{ 
                        fontSize: '20px', 
                        fontFamily: '"Sen", sans-serif', 
                        fontWeight: 600,
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Fav Actions */}
            <div className="absolute z-10" style={{ top: '665px', left: '500px' }}>
              <h2 className="text-[#5E7764] mb-4" style={{ fontSize: '26px', fontFamily: '"Sen", sans-serif', fontWeight: 500, letterSpacing: '0.02em' }}>
                Fav actions
              </h2>
              <div className="flex flex-col" style={{ gap: '16px' }}>
                {recapData.favActions.map((action, idx) => (
                  <div key={idx} className="text-[#203323] font-bold tracking-tight max-w-[250px]" style={{ fontSize: '24px', fontFamily: '"Sen", sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {action}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
