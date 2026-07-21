import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Brain } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import {
  QUESTIONS,
  ANSWER_OPTIONS,
  calculateDASS21Scores,
  getSeverityLabel,
} from "../../data/diagnoseQuestions";

export default function MindCheckFlow() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [submitting, setSubmitting] = useState(false);
  const [assessmentId, setAssessmentId] = useState(null);
  const [started, setStarted] = useState(false);

  // Fetch DASS-21 assessment ID
  useEffect(() => {
    async function fetchAssessment() {
      const { data } = await supabase
        .from("assessments")
        .select("id")
        .eq("name", "DASS-21")
        .single();
      if (data) setAssessmentId(data.id);
    }
    fetchAssessment();
  }, []);

  const totalQuestions = QUESTIONS.length;
  const progress = ((currentStep + 1) / totalQuestions) * 100;
  const currentQuestion = QUESTIONS[currentStep];
  const currentAnswer = answers[currentQuestion?.id];

  const handleAnswer = (score) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: score,
    }));
  };

  const goNext = () => {
    if (currentAnswer === undefined) return;
    if (currentStep < totalQuestions - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !assessmentId) return;
    setSubmitting(true);

    try {
      // Build answers array
      const answersArray = QUESTIONS.map((q) => ({
        question_id: q.id,
        score: answers[q.id] || 0,
      }));

      // Calculate scores
      const result = calculateDASS21Scores(answersArray);

      // Save to Supabase
      const { data, error } = await supabase
        .from("assessment_results")
        .insert({
          user_id: user.id,
          assessment_id: assessmentId,
          answers: {
            responses: answersArray,
            subscales: result.subscales,
          },
          total_score: result.totalScore,
          max_score: result.maxScore,
          severity_level: result.overallSeverity,
          percentage: result.healthPercentage,
          theme_color: "green",
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving assessment:", error);
        setSubmitting(false);
        return;
      }

      // Navigate to result page
      navigate(`/expert/result/${data.id}`, { replace: true });
    } catch (err) {
      console.error("Error submitting assessment:", err);
      setSubmitting(false);
    }
  };

  const isLastQuestion = currentStep === totalQuestions - 1;
  const allAnswered = Object.keys(answers).length === totalQuestions;

  // Intro screen
  if (!started) {
    return (
      <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 lg:p-12 flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Icon */}
            <div className="w-20 h-20 bg-[#5D8B66]/10 rounded-full flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-[#5D8B66]" />
            </div>

            <h1 className="text-[28px] lg:text-[32px] font-bold text-black font-sans mb-3">
              Mind Check-In
            </h1>
            <p className="text-[15px] text-gray-500 font-sans leading-relaxed mb-8 max-w-md">
              Anda akan menjawab <strong>21 pertanyaan</strong> singkat untuk
              mengukur tingkat kesehatan mental Anda saat ini. Jawab
              dengan jujur berdasarkan pengalaman Anda dalam{" "}
              <strong>1 minggu terakhir</strong>.
            </p>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
              <div className="bg-[#F7FAF8] rounded-[16px] p-4">
                <p className="text-[24px] font-bold text-[#5D8B66]">21</p>
                <p className="text-[12px] text-gray-500 font-sans mt-1">
                  Pertanyaan
                </p>
              </div>
              <div className="bg-[#F7FAF8] rounded-[16px] p-4">
                <p className="text-[24px] font-bold text-[#5D8B66]">5-10</p>
                <p className="text-[12px] text-gray-500 font-sans mt-1">
                  Menit
                </p>
              </div>
              <div className="bg-[#F7FAF8] rounded-[16px] p-4">
                <p className="text-[24px] font-bold text-[#5D8B66]">DASS-21</p>
                <p className="text-[12px] text-gray-500 font-sans mt-1">
                  Standar Internasional
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 mb-8 w-full">
              <p className="text-[13px] text-amber-700 font-sans leading-relaxed">
                ⚠️ Hasil ini bersifat informatif dan <strong>bukan</strong>{" "}
                diagnosis medis. Jika gejala Anda berlanjut, silakan konsultasi
                dengan profesional kesehatan mental.
              </p>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="bg-[#5D8B66] hover:bg-[#4A7A55] text-white px-10 py-3.5 rounded-full text-[15px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Mulai Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-100">
          <motion.div
            className="absolute left-0 top-0 h-full bg-[#5D8B66] rounded-r-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="p-6 lg:p-10">
          {/* Top bar */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => {
                if (currentStep === 0) {
                  setStarted(false);
                } else {
                  goBack();
                }
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-[13px] font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-[13px] text-gray-400 font-sans font-medium">
              {currentStep + 1} / {totalQuestions}
            </span>
          </div>

          {/* Question Area */}
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 60 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Subscale badge */}
                <div className="flex justify-center mb-4">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                      currentQuestion.subscale === "depression"
                        ? "bg-blue-50 text-blue-600"
                        : currentQuestion.subscale === "anxiety"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {currentQuestion.subscale === "depression"
                      ? "Depresi"
                      : currentQuestion.subscale === "anxiety"
                      ? "Kecemasan"
                      : "Stres"}
                  </span>
                </div>

                {/* Question text */}
                <h2 className="text-[20px] lg:text-[24px] font-bold text-black font-sans text-center mb-8 leading-snug">
                  {currentQuestion.text}
                </h2>

                {/* Answer Options */}
                <div className="space-y-3">
                  {ANSWER_OPTIONS.map((option) => {
                    const isSelected = currentAnswer === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`w-full text-left p-4 rounded-[16px] border-2 transition-all duration-200 group ${
                          isSelected
                            ? "border-[#5D8B66] bg-[#5D8B66]/5 shadow-sm"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? "border-[#5D8B66] bg-[#5D8B66]"
                                : "border-gray-300 group-hover:border-gray-400"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p
                              className={`text-[15px] font-semibold font-sans ${
                                isSelected ? "text-[#5D8B66]" : "text-black"
                              }`}
                            >
                              {option.label}
                            </p>
                            <p className="text-[12px] text-gray-400 font-sans mt-0.5">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-10">
              <button
                onClick={goBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all ${
                  currentStep === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {isLastQuestion && allAnswered ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#5D8B66] hover:bg-[#4A7A55] text-white px-8 py-3 rounded-full text-[14px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Submit
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={currentAnswer === undefined}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-200 ${
                    currentAnswer === undefined
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#5D8B66] hover:bg-[#4A7A55] text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
