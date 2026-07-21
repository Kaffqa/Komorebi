import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Download, MessageSquare, Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import {
  getSeverityLabel,
  getSeverityEmoji,
  SEVERITY_DESCRIPTIONS,
  SUBSCALE_INFO,
  calculateDASS21Scores,
} from "../../data/diagnoseQuestions";

export default function DiagnoseResultPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#5D8B66] animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center py-20">
        <p className="text-gray-400 text-[15px] font-sans">Result not found.</p>
        <button
          onClick={() => navigate("/expert")}
          className="mt-4 text-[#5D8B66] text-[14px] font-medium hover:underline"
        >
          Back to Diagnose
        </button>
      </div>
    );
  }

  // Extract subscale data from answers JSONB
  const subscales = result.answers?.subscales || {};
  const severity = result.severity_level;
  const healthPct = result.percentage || 0;

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

  // Donut chart parameters
  const donutRadius = 80;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutFilled = (healthPct / 100) * donutCircumference;

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate("/expert")}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-[13px] font-medium transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Mind Check-In
      </button>

      <div className="bg-white rounded-[24px] p-6 lg:p-10 shadow-sm border border-gray-100">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[24px] lg:text-[28px] font-bold text-black font-sans">
            {getSeverityLabel(severity)}{" "}
            <span className="text-[28px]">{getSeverityEmoji(severity)}</span>
          </h1>
          <p className="text-[14px] lg:text-[15px] text-gray-500 font-sans leading-relaxed mt-2 max-w-2xl">
            {SEVERITY_DESCRIPTIONS[severity] || SEVERITY_DESCRIPTIONS["Mild"]}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Breakdown */}
          <div className="flex-1">
            <div className="border border-gray-100 rounded-[20px] p-6 lg:p-8">
              <h2 className="text-[18px] font-bold text-black font-sans mb-6">
                Understanding Your Health
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
                      <span className="text-[14px] font-semibold text-black font-sans">
                        {item.name}
                      </span>
                      <span className="text-[14px] font-bold text-black font-sans">
                        {item.percentage}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative w-full h-3 bg-[#E5EBE7] rounded-full overflow-hidden mb-2">
                      <motion.div
                        className="absolute left-0 top-0 h-full bg-[#5D8B66] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-[13px] text-gray-500 font-sans leading-relaxed">
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
              className="relative w-[220px] h-[220px] mb-6"
            >
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r={donutRadius}
                  fill="none"
                  stroke="#E5EBE7"
                  strokeWidth={24}
                />
                {/* Filled circle */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r={donutRadius}
                  fill="none"
                  stroke="#5D8B66"
                  strokeWidth={24}
                  strokeLinecap="round"
                  strokeDasharray={donutCircumference}
                  initial={{ strokeDashoffset: donutCircumference }}
                  animate={{ strokeDashoffset: donutCircumference - donutFilled }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-[36px] font-bold text-[#5D8B66] font-sans leading-none"
                >
                  {healthPct}%
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-[13px] text-gray-400 font-sans mt-1"
                >
                  Accuracy
                </motion.span>
              </div>
            </motion.div>

            {/* Disclaimer */}
            <p className="text-[11px] text-gray-400 text-center font-sans leading-relaxed mb-6 max-w-[260px]">
              These results are for informational purposes only. Please consult
              a professional if your symptoms persist.
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => {
                  const summaryText = `[DIAGNOSIS_SUMMARY]
Hasil Mind Check-In terbaru:
Tingkat: ${getSeverityLabel(severity)}
Akurasi: ${healthPct}%
Detail:
- Depresi: ${subscales.depression?.level || "Normal"}
- Kecemasan: ${subscales.anxiety?.level || "Normal"}
- Stres: ${subscales.stress?.level || "Normal"}

Bisakah kita bahas hasil ini?`;
                  
                  navigate("/chat", { state: { diagnosisSummary: summaryText } });
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#5D8B66] hover:bg-[#4A7A55] text-white py-3 rounded-full text-[14px] font-semibold transition-all duration-200 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Chat With Komi
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
