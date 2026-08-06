import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, MessageSquare, Loader2, Check, BookOpen } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import { supabase } from "../../services/supabase";
import {
  getSeverityLabel,
  getSeverityEmoji,
  SEVERITY_DESCRIPTIONS,
  SUBSCALE_INFO,
} from "../../data/diagnoseQuestions";
import { Skeleton } from "../../components/ui/Skeleton";
import { MindTree } from "../../components/widgets/MindTree";
import { useTranslation } from "react-i18next";

export default function DiagnoseResultPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from("assessment_results")
        .select("*, assessments(name)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setResult(data);
      }
      setLoading(false);
    }
    fetchResult();
  }, [user, id]);

  // Derive values safely
  const subscales = result?.answers?.subscales || {};
  const severity = result?.severity_level || "Normal";
  const healthPct = result?.percentage || 0;

  const generatedJournalContent = `📋 Hasil Mind Check-In\n` +
    `Tingkat: ${getSeverityLabel(severity)} ${getSeverityEmoji(severity)}\n` +
    `Akurasi: ${healthPct}%\n\n` +
    `Detail:\n` +
    `• ${SUBSCALE_INFO.depression.name}: ${subscales.depression?.percentage || 0}% (${subscales.depression?.level || "Normal"})\n` +
    `• ${SUBSCALE_INFO.anxiety.name}: ${subscales.anxiety?.percentage || 0}% (${subscales.anxiety?.level || "Normal"})\n` +
    `• ${SUBSCALE_INFO.stress.name}: ${subscales.stress?.percentage || 0}% (${subscales.stress?.level || "Normal"})\n\n` +
    `#MindCheckIn #${getSeverityLabel(severity).replace(/\s+/g, '')}`;

  useEffect(() => {
    async function checkAlreadySaved() {
      if (!user || !result) return;
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('journal_entries')
        .select('content')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (existing && existing.content.includes(generatedJournalContent)) {
        setHasSaved(true);
      }
    }
    checkAlreadySaved();
  }, [result, user, generatedJournalContent]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
        <Skeleton className="w-40 h-4 mb-4" />
        <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-10 shadow-sm border border-gray-100 dark:border-komorebi-dark-border">
          <div className="mb-8">
            <Skeleton className="w-64 h-8 mb-4" />
            <Skeleton className="w-full max-w-2xl h-4" />
            <Skeleton className="w-3/4 max-w-xl h-4 mt-2" />
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 border border-gray-100 dark:border-komorebi-dark-border rounded-[20px] p-6 lg:p-8">
              <Skeleton className="w-48 h-6 mb-8" />
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-3">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-10 h-4" />
                    </div>
                    <Skeleton className="w-full h-3 mb-3 rounded-full" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-4/5 h-3 mt-2" />
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-[320px] flex flex-col items-center justify-center">
              <Skeleton className="w-[220px] h-[220px] rounded-full mb-6" />
              <Skeleton className="w-48 h-3 mb-2" />
              <Skeleton className="w-40 h-3 mb-8" />
              <div className="flex gap-3 w-full">
                <Skeleton className="flex-1 h-12 rounded-full" />
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center py-20">
        <p className="text-gray-400 text-[15px] font-sans">{t('diagnoseResult.not_found')}</p>
        <button
          onClick={() => navigate("/expert")}
          className="mt-4 text-[#5D8B66] text-[14px] font-medium hover:underline"
        >
          {t('diagnoseResult.back')}
        </button>
      </div>
    );
  }
  // Extract subscale data from answers JSONB
  // (already extracted above)

  // Build subscale breakdown for UI
  const breakdownItems = [
    {
      key: "depression",
      name: SUBSCALE_INFO.depression.name,
      percentage: subscales.depression?.percentage || 0,
      level: subscales.depression?.level || "Normal",
      description: SUBSCALE_INFO.depression.descriptions[subscales.depression?.level || "Normal"],
    },
    {
      key: "anxiety",
      name: SUBSCALE_INFO.anxiety.name,
      percentage: subscales.anxiety?.percentage || 0,
      level: subscales.anxiety?.level || "Normal",
      description: SUBSCALE_INFO.anxiety.descriptions[subscales.anxiety?.level || "Normal"],
    },
    {
      key: "stress",
      name: SUBSCALE_INFO.stress.name,
      percentage: subscales.stress?.percentage || 0,
      level: subscales.stress?.level || "Normal",
      description: SUBSCALE_INFO.stress.descriptions[subscales.stress?.level || "Normal"],
    },
  ];

  // Donut chart logic removed in favor of MindTree

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate("/expert")}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-[13px] font-medium transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('diagnoseResult.back')}
      </button>

      <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-10 shadow-sm border border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[24px] lg:text-[28px] font-medium text-black dark:text-white font-sans transition-colors duration-300">
            {getSeverityLabel(severity)}{" "}
            <span className="text-[28px]">{getSeverityEmoji(severity)}</span>
          </h1>
          <p className="text-[14px] lg:text-[15px] text-gray-500 dark:text-gray-400 font-sans leading-relaxed mt-2 max-w-2xl transition-colors duration-300">
            {SEVERITY_DESCRIPTIONS[severity] || SEVERITY_DESCRIPTIONS["Mild"]}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Breakdown */}
          <div className="flex-1">
            <div className="border border-gray-100 dark:border-komorebi-dark-border rounded-[20px] p-6 lg:p-8 transition-colors duration-300">
              <h2 className="text-[18px] font-bold text-black dark:text-white font-sans mb-6 transition-colors duration-300">
                {t('diagnoseResult.understanding')}
              </h2>

              <div className="space-y-6">
                {breakdownItems.map((item, idx) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-semibold text-black dark:text-white font-sans transition-colors duration-300">
                        {item.name}
                      </span>
                      <span className="text-[14px] font-bold text-black dark:text-white font-sans transition-colors duration-300">
                        {item.percentage}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative w-full h-3 bg-[#E5EBE7] dark:bg-komorebi-dark-bg rounded-full overflow-hidden mb-2 transition-colors duration-300">
                      <motion.div
                        className="absolute left-0 top-0 h-full bg-[#5D8B66] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 font-sans leading-relaxed transition-colors duration-300">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Donut Chart & Actions */}
          <div className="lg:w-[320px] flex flex-col items-center justify-center">
            {/* Donut Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative w-full max-w-[280px] mb-6"
            >
              <MindTree 
                depressionLevel={subscales.depression?.level || "Normal"} 
                anxietyLevel={subscales.anxiety?.level || "Normal"} 
                stressLevel={subscales.stress?.level || "Normal"} 
              />
              
              {/* Floating Wellness Badge (Overlapping Bottom Left) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="absolute bottom-2 left-2 bg-white dark:bg-komorebi-dark-bg border border-gray-100 dark:border-gray-700 shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-full px-3 py-1.5 flex items-center gap-1.5 z-30"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${healthPct >= 50 ? 'bg-[#5D8B66]' : 'bg-[#C9854F]'}`} />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">
                  {t('diagnoseResult.wellness', { pct: healthPct })}
                </span>
              </motion.div>
            </motion.div>

            {/* Disclaimer */}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-light font-sans leading-relaxed mb-6 max-w-[260px] transition-colors duration-300">
              {t('diagnoseResult.disclaimer')}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => {
                  const summaryText = t('diagnoseResult.chat_payload', { level: getSeverityLabel(severity), pct: healthPct, dep: subscales.depression?.level || "Normal", anx: subscales.anxiety?.level || "Normal", str: subscales.stress?.level || "Normal" });
                  
                  navigate("/chat", { state: { diagnosisSummary: summaryText } });
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white py-3 rounded-full text-[14px] font-light transition-all duration-300"
              >
                <MessageSquare className="w-4 h-4" />
                {t('diagnoseResult.chat_btn')}
              </button>
              <button
                onClick={() => {
                  const shareTitle = t('diagnoseResult.share_title', { level: getSeverityLabel(severity) });
                  const shareContent = t('diagnoseResult.share_content', { level: getSeverityLabel(severity), pct: healthPct, dep: subscales.depression?.level || "Normal", anx: subscales.anxiety?.level || "Normal", str: subscales.stress?.level || "Normal" });

                  navigate("/forum/new", {
                    state: {
                      draftTitle: shareTitle,
                      draftContent: shareContent,
                      draftTags: ["Self Improvement"],
                    }
                  });
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg hover:bg-[#7DA085]/10 dark:hover:bg-white/10 hover:border-[#7DA085]/30 dark:hover:border-[#5D8B66] transition-colors group"
                title={t('diagnoseResult.share_tooltip_share')}
              >
                <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-[#5D8B66] dark:group-hover:text-[#7DA085]" />
              </button>
              <button
                onClick={async () => {
                  if (isSaving) return;
                  setIsSaving(true);
                  try {
                    const today = new Date().toISOString().split('T')[0];

                    // Check if today's journal entry exists
                    const { data: existing } = await supabase
                      .from('journal_entries')
                      .select('id, content')
                      .eq('user_id', user.id)
                      .eq('entry_date', today)
                      .maybeSingle();

                    if (existing) {
                      // Prevent duplicate appending if somehow clicked
                      if (existing.content.includes(generatedJournalContent)) {
                        setHasSaved(true);
                        setIsSaving(false);
                        return;
                      }

                      // Append to existing journal
                      const updatedContent = existing.content + '\n\n---\n\n' + generatedJournalContent;
                      const { error } = await supabase
                        .from('journal_entries')
                        .update({ content: updatedContent })
                        .eq('id', existing.id);
                      if (error) throw error;
                    } else {
                      // Create new journal entry
                      const { error } = await supabase
                        .from('journal_entries')
                        .insert({
                          user_id: user.id,
                          content: generatedJournalContent,
                          mood: 'Neutral',
                          mood_score: 3,
                          stress_level: 'Moderate',
                          stress_score: 3,
                          entry_date: today,
                        });
                      if (error) throw error;
                    }
                    setHasSaved(true);
                    addToast(t('diagnoseResult.toast_success'), "success");
                  } catch (error) {
                    console.error("Error saving to journal:", error);
                    addToast(t('diagnoseResult.toast_err', { msg: error.message || '' }), "error");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || hasSaved}
                className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors group ${
                  hasSaved
                    ? "border-[#5D8B66]/30 bg-[#5D8B66]/10 cursor-default"
                    : "border-gray-200 dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg hover:bg-[#7DA085]/10 dark:hover:bg-white/10 hover:border-[#7DA085]/30 dark:hover:border-[#5D8B66] disabled:opacity-50"
                }`}
                title={hasSaved ? t('diagnoseResult.share_tooltip_saved') : t('diagnoseResult.share_tooltip_save')}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : hasSaved ? (
                  <Check className="w-4 h-4 text-[#5D8B66] dark:text-[#7DA085]" />
                ) : (
                  <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-[#5D8B66] dark:group-hover:text-[#7DA085]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
