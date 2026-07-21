import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { getSeverityLabel, getSeverityEmoji } from "../../data/diagnoseQuestions";

export default function DiagnosePage() {
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
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getShortDescription = (severity) => {
    const descriptions = {
      Normal: "You're in a healthy mental state. Keep maintaining your well-being and self-care routines.",
      Mild: "You're feeling emotionally drained. Make sure to get plenty of rest. This is a safe space for you to take a short break.",
      Moderate: "You're experiencing moderate emotional distress. Consider reaching out to someone you trust.",
      Severe: "You're going through significant emotional challenges. We strongly recommend consulting a professional.",
      "Extremely Severe": "You're experiencing very high levels of distress. Please seek professional help immediately.",
    };
    return descriptions[severity] || descriptions["Mild"];
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[24px] lg:text-[28px] font-sans font-bold text-black">
              Mind Check-In
            </h1>
            <p className="text-[14px] lg:text-[15px] text-gray-500 mt-1 max-w-lg font-sans leading-relaxed">
              A supportive, expert-guided assessment to help you understand your
              current feelings and detect early signs of mental health distress.
            </p>
          </div>
          <button
            onClick={() => navigate("/expert/check")}
            className="flex items-center gap-2 bg-[#5D8B66] hover:bg-[#4A7A55] text-white px-6 py-3 rounded-full text-[14px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md shrink-0"
          >
            Begin Mind Check
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#5D8B66] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#5D8B66]/10 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-[#5D8B66]" />
          </div>
          <h3 className="text-[18px] font-semibold text-black mb-2 font-sans">
            No assessments yet
          </h3>
          <p className="text-[14px] text-gray-400 max-w-md font-sans leading-relaxed">
            Start your first Mind Check-In to gain valuable insights about your
            mental well-being. It only takes a few minutes.
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
              className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 group flex flex-col"
            >
              <p className="text-[12px] text-gray-400 font-sans mb-3">
                {formatDate(result.created_at)}
              </p>
              <h3 className="text-[16px] font-bold text-black font-sans mb-2">
                {getSeverityLabel(result.severity_level)}{" "}
                <span className="text-[18px]">
                  {getSeverityEmoji(result.severity_level)}
                </span>
              </h3>
              <p className="text-[13px] text-gray-500 font-sans leading-relaxed mb-4 flex-1">
                {getShortDescription(result.severity_level)}
              </p>
              <button
                className="text-[12px] text-gray-400 font-sans font-medium group-hover:text-[#5D8B66] transition-colors flex items-center gap-1 self-start"
              >
                [Check for the full result]
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
