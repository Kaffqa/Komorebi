import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";

export function AssessmentHistoryWidget() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState("Loading your latest assessment history...");

  useEffect(() => {
    async function fetchAssessment() {
      if (!user) return;
      const { data, error } = await supabase
        .from("assessment_results")
        .select("total_score, max_score, severity_level, created_at, assessments ( name )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching assessment:", error);
        setSummary("Failed to load assessment history.");
        return;
      }

      if (data && data.length > 0) {
        const latest = data[0];
        const dateStr = new Date(latest.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        const assessmentName = latest.assessments?.name || "assessment";
        setSummary(`In your last ${assessmentName} on ${dateStr}, you scored ${latest.total_score} out of ${latest.max_score}. Your result indicated a severity level of "${latest.severity_level}".`);
      } else {
        setSummary("You haven't taken any assessments yet. Try completing one to gain insights!");
      }
    }
    fetchAssessment();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[20px] font-sans font-semibold text-black">Assessment History</h3>
        <button className="text-[13px] font-medium px-4 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 transition-colors">
          See More
        </button>
      </div>
      <p className="text-[14px] text-gray-400 mb-6 font-sans">
        Review your past health screenings and system insights.
      </p>

      <div className="flex-1 flex flex-col border border-gray-200 rounded-[20px] p-6">
        <p className="text-[15px] leading-[1.6] text-black font-medium font-sans mb-6 overflow-y-auto max-h-[120px] pr-2">
          {summary}
        </p>
        <div className="mt-auto">
          <button className="w-full bg-[#7DA085] hover:bg-[#688A70] text-white py-3.5 rounded-full font-medium transition-colors shadow-sm text-[15px]">
            See Full Recap
          </button>
        </div>
      </div>
    </motion.div>
  );
}
