import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { getSeverityLabel, getSeverityEmoji } from "../../data/diagnoseQuestions";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { Skeleton } from "../../components/ui/Skeleton";

export default function DiagnosePage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("assessment_results")
      .select("*, assessments(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const formatDate = (dateStr) => {
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-GB';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getShortDescription = (severity) => {
    const descriptions = {
      Normal: t('diagnose.severity_desc.normal'),
      Mild: t('diagnose.severity_desc.mild'),
      Moderate: t('diagnose.severity_desc.moderate'),
      Severe: t('diagnose.severity_desc.severe'),
      "Extremely Severe": t('diagnose.severity_desc.extremely_severe'),
    };
    return descriptions[severity] || descriptions["Mild"];
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[24px] lg:text-[28px] font-sans font-bold text-black dark:text-white transition-colors duration-300">
              {t('diagnose.title')}
            </h1>
            <p className="text-[14px] lg:text-[15px] text-gray-500 dark:text-gray-300 mt-1 max-w-lg font-sans leading-relaxed transition-colors duration-300">
              {t('diagnose.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate("/expert/check")}
            className="flex items-center justify-center gap-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white px-6 py-3 rounded-full text-[14px] font-light transition-all duration-300 shrink-0"
          >
            {t('diagnose.begin_button')}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-komorebi-dark-card rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col min-h-[180px]">
              <Skeleton className="w-24 h-3 mb-4" />
              <Skeleton className="w-32 h-5 mb-3" />
              <div className="space-y-2 mb-6">
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-4/5 h-3" />
              </div>
              <Skeleton className="w-28 h-3 mt-auto" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-12 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col items-center justify-center text-center transition-colors duration-300">
          <div className="w-16 h-16 bg-[#5D8B66]/10 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-[#5D8B66]" />
          </div>
          <h3 className="text-[18px] font-semibold text-black dark:text-white mb-2 font-sans transition-colors duration-300">
            {t('diagnose.no_results.title')}
          </h3>
          <p className="text-[14px] text-gray-400 dark:text-gray-500 max-w-md font-sans leading-relaxed">
            {t('diagnose.no_results.desc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result, idx) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/expert/result/${result.id}`)}
              className="bg-white dark:bg-komorebi-dark-card rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-komorebi-dark-border cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-komorebi-dark-hover transition-all duration-300 group flex flex-col"
            >
              <p className="text-[12px] text-gray-400 font-sans mb-3">
                {formatDate(result.created_at)}
              </p>
              <h3 className="text-[16px] font-bold text-black dark:text-white font-sans mb-2 transition-colors duration-300">
                {getSeverityLabel(result.severity_level)}{" "}
                <span className="text-[18px]">
                  {getSeverityEmoji(result.severity_level)}
                </span>
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-300 font-sans leading-relaxed mb-4 flex-1 transition-colors duration-300">
                {getShortDescription(result.severity_level)}
              </p>
              <button
                className="text-[12px] text-gray-400 font-sans font-medium group-hover:text-[#5D8B66] transition-colors flex items-center gap-1 self-start"
              >
                {t('diagnose.check_full_result')}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
