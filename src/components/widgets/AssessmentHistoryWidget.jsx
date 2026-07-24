import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslation } from "react-i18next";

export function AssessmentHistoryWidget() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState("Loading your latest assessment history...");
  const [latestId, setLatestId] = useState(null);

  useEffect(() => {
    async function fetchAssessment() {
      if (!user) return;
      const { data, error } = await supabase
        .from("assessment_results")
        .select("id, total_score, max_score, severity_level, created_at, assessments ( name )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching assessment:", error);
        setSummary(t('dashboard.assessment_history.failed'));
        return;
      }

      if (data && data.length > 0) {
        const latest = data[0];
        setLatestId(latest.id);
        const dateStr = new Date(latest.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        const assessmentName = latest.assessments?.name || "assessment";
        setSummary(t('dashboard.assessment_history.summary', { name: assessmentName, date: dateStr, score: latest.total_score, max: latest.max_score, severity: latest.severity_level }));
      } else {
        setSummary(t('dashboard.assessment_history.empty'));
      }
    }
    fetchAssessment();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col h-full transition-colors duration-300"
      data-tour-id="assessment-history"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[20px] font-sans font-semibold text-black dark:text-white transition-colors duration-300">{t('dashboard.assessment_history.title')}</h3>
        <button 
          onClick={() => navigate("/expert")}
          className="flex items-center justify-center text-[13px] font-medium px-4 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg text-black dark:text-white hover:bg-gray-50 dark:hover:bg-black/20 transition-colors"
        >
          {t('dashboard.assessment_history.see_more')}
        </button>
      </div>
      <p className="text-[14px] text-gray-400 dark:text-komorebi-dark-muted mb-6 font-sans transition-colors duration-300">
        {t('dashboard.assessment_history.subtitle')}
      </p>

      <div className="flex-1 flex flex-col border border-gray-200 dark:border-[#32473D] bg-white dark:bg-black/20 rounded-[20px] p-6 transition-colors duration-300">
        <p className="text-[15px] leading-[1.6] text-black dark:text-gray-200 font-medium font-sans mb-6 overflow-y-auto max-h-[120px] pr-2 transition-colors duration-300">
          {summary}
        </p>
        <div className="mt-auto">
          <button 
            onClick={() => {
              if (latestId) navigate(`/expert/result/${latestId}`);
              else navigate("/expert");
            }}
            className="w-full bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white py-3.5 rounded-full font-body font-light transition-all duration-300 text-[15px]"
          >
            {t('dashboard.assessment_history.see_full')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
