/**
 * DASS-21 (Depression Anxiety Stress Scale - 21 Items)
 * Instrumen psikometrik terstandar internasional untuk mengukur
 * 3 dimensi kesehatan mental: Depresi, Kecemasan, dan Stres.
 *
 * Setiap pertanyaan memiliki skor 0–3, dikalikan 2 untuk skor DASS penuh.
 */

export const DASS21_ASSESSMENT_ID = null; // Will be set dynamically from DB

export const ANSWER_OPTIONS = [
  { value: 0, label: "Tidak pernah", description: "Tidak sesuai dengan saya sama sekali" },
  { value: 1, label: "Kadang-kadang", description: "Sesuai dengan saya sampai tingkat tertentu" },
  { value: 2, label: "Sering", description: "Sesuai dengan saya sampai tingkat yang cukup besar" },
  { value: 3, label: "Sangat sering", description: "Sangat sesuai dengan saya" },
];

export const QUESTIONS = [
  // Stress items: Q1, Q6, Q8, Q11, Q12, Q14, Q18
  { id: 1,  text: "Saya merasa sulit untuk bersantai atau menenangkan diri.",                    subscale: "stress" },
  // Anxiety items: Q2, Q4, Q7, Q9, Q15, Q19, Q20
  { id: 2,  text: "Saya menyadari mulut saya terasa kering.",                                     subscale: "anxiety" },
  // Depression items: Q3, Q5, Q10, Q13, Q16, Q17, Q21
  { id: 3,  text: "Saya merasa tidak bisa merasakan perasaan positif sama sekali.",               subscale: "depression" },
  { id: 4,  text: "Saya mengalami kesulitan bernapas (misalnya napas cepat, sesak tanpa aktivitas fisik).", subscale: "anxiety" },
  { id: 5,  text: "Saya merasa sulit untuk memulai sesuatu atau mengambil inisiatif.",            subscale: "depression" },
  { id: 6,  text: "Saya cenderung bereaksi berlebihan terhadap situasi tertentu.",                subscale: "stress" },
  { id: 7,  text: "Saya mengalami gemetar (misalnya pada tangan).",                               subscale: "anxiety" },
  { id: 8,  text: "Saya merasa menggunakan banyak energi untuk merasa cemas.",                    subscale: "stress" },
  { id: 9,  text: "Saya khawatir terhadap situasi di mana saya mungkin panik dan mempermalukan diri sendiri.", subscale: "anxiety" },
  { id: 10, text: "Saya merasa tidak ada hal yang bisa dinantikan atau diharapkan.",              subscale: "depression" },
  { id: 11, text: "Saya merasa mudah gelisah dan terganggu.",                                     subscale: "stress" },
  { id: 12, text: "Saya merasa sulit untuk bersantai.",                                            subscale: "stress" },
  { id: 13, text: "Saya merasa sedih dan tertekan.",                                               subscale: "depression" },
  { id: 14, text: "Saya merasa tidak sabar ketika mengalami penundaan (misalnya antrean, kemacetan).", subscale: "stress" },
  { id: 15, text: "Saya merasa hampir pingsan.",                                                   subscale: "anxiety" },
  { id: 16, text: "Saya merasa kehilangan minat terhadap segala hal.",                             subscale: "depression" },
  { id: 17, text: "Saya merasa tidak berharga sebagai seorang manusia.",                           subscale: "depression" },
  { id: 18, text: "Saya merasa mudah tersinggung.",                                                subscale: "stress" },
  { id: 19, text: "Saya menyadari detak jantung saya meskipun tidak melakukan aktivitas fisik.",  subscale: "anxiety" },
  { id: 20, text: "Saya merasa takut tanpa alasan yang jelas.",                                    subscale: "anxiety" },
  { id: 21, text: "Saya merasa hidup ini tidak berarti.",                                          subscale: "depression" },
];

/**
 * DASS-21 Severity Levels (setelah skor dikalikan 2)
 */
export const SEVERITY_THRESHOLDS = {
  depression: [
    { max: 9,  level: "Normal",            emoji: "😊", color: "#486E53" },
    { max: 13, level: "Mild",              emoji: "🤔", color: "#678D73" },
    { max: 20, level: "Moderate",          emoji: "😟", color: "#8AAFA0" },
    { max: 27, level: "Severe",            emoji: "😰", color: "#C9854F" },
    { max: 42, level: "Extremely Severe",  emoji: "🆘", color: "#B85C5C" },
  ],
  anxiety: [
    { max: 7,  level: "Normal",            emoji: "😊", color: "#486E53" },
    { max: 9,  level: "Mild",              emoji: "🤔", color: "#678D73" },
    { max: 14, level: "Moderate",          emoji: "😟", color: "#8AAFA0" },
    { max: 19, level: "Severe",            emoji: "😰", color: "#C9854F" },
    { max: 42, level: "Extremely Severe",  emoji: "🆘", color: "#B85C5C" },
  ],
  stress: [
    { max: 14, level: "Normal",            emoji: "😊", color: "#486E53" },
    { max: 18, level: "Mild",              emoji: "🤔", color: "#678D73" },
    { max: 25, level: "Moderate",          emoji: "😟", color: "#8AAFA0" },
    { max: 33, level: "Severe",            emoji: "😰", color: "#C9854F" },
    { max: 42, level: "Extremely Severe",  emoji: "🆘", color: "#B85C5C" },
  ],
};

/**
 * Overall severity descriptions in Indonesian
 */
export const SEVERITY_DESCRIPTIONS = {
  "Normal": "Kondisi mental Anda dalam keadaan baik. Tetap jaga keseimbangan hidup dan kesehatan mental Anda.",
  "Mild": "Anda mulai merasakan tekanan ringan secara emosional. Pastikan untuk cukup istirahat dan luangkan waktu untuk diri sendiri.",
  "Moderate": "Anda mengalami tekanan emosional yang cukup signifikan. Pertimbangkan untuk berbicara dengan seseorang yang Anda percaya atau profesional.",
  "Severe": "Anda mengalami tingkat tekanan yang tinggi. Sangat disarankan untuk berkonsultasi dengan profesional kesehatan mental.",
  "Extremely Severe": "Anda mengalami tingkat tekanan yang sangat tinggi. Segera cari bantuan profesional kesehatan mental.",
};

/**
 * Subscale descriptions for the result breakdown
 */
export const SUBSCALE_INFO = {
  depression: {
    name: "Emotional Exhaustion",
    descriptions: {
      "Normal": "Tingkat emosi Anda stabil dan dalam kondisi yang sehat.",
      "Mild": "Anda mungkin mulai merasa sedikit lelah secara emosional.",
      "Moderate": "Anda merasa cukup terkuras secara emosional dalam aktivitas sehari-hari.",
      "Severe": "Anda merasa sangat lelah secara emosional dan sulit untuk memulai aktivitas.",
      "Extremely Severe": "Kelelahan emosional yang sangat berat mempengaruhi fungsi harian Anda.",
    }
  },
  anxiety: {
    name: "Emotional Distance",
    descriptions: {
      "Normal": "Anda terhubung dengan baik terhadap lingkungan dan perasaan Anda.",
      "Mild": "Anda mulai merasa sedikit jauh dari lingkungan sekitar.",
      "Moderate": "Anda mulai merasa sinis atau menarik diri dari lingkungan.",
      "Severe": "Anda merasa sangat jauh dan terputus dari lingkungan sekitar.",
      "Extremely Severe": "Perasaan terputus yang sangat intens dari lingkungan dan orang-orang di sekitar Anda.",
    }
  },
  stress: {
    name: "Decline in Performance",
    descriptions: {
      "Normal": "Performa dan fokus Anda berada dalam kondisi yang baik.",
      "Mild": "Fokus Anda mulai sedikit menurun, tetapi masih bisa dikelola.",
      "Moderate": "Fokus mulai menurun, tetapi masih bisa berfungsi.",
      "Severe": "Penurunan performa yang signifikan dalam aktivitas sehari-hari.",
      "Extremely Severe": "Performa menurun drastis dan sangat sulit untuk berkonsentrasi.",
    }
  }
};

/**
 * Calculate DASS-21 scores from answers
 * @param {Array} answers - Array of { question_id, score } objects
 * @returns {Object} Calculated scores and severity levels
 */
export function calculateDASS21Scores(answers) {
  const subscaleQuestions = {
    depression: [3, 5, 10, 13, 16, 17, 21],
    anxiety:    [2, 4, 7, 9, 15, 19, 20],
    stress:     [1, 6, 8, 11, 12, 14, 18],
  };

  const subscales = {};
  let totalRaw = 0;

  for (const [subscale, questionIds] of Object.entries(subscaleQuestions)) {
    const rawScore = questionIds.reduce((sum, qId) => {
      const answer = answers.find(a => a.question_id === qId);
      return sum + (answer ? answer.score : 0);
    }, 0);

    const scaledScore = rawScore * 2; // DASS-21 multiplier
    totalRaw += rawScore;

    const thresholds = SEVERITY_THRESHOLDS[subscale];
    const severity = thresholds.find(t => scaledScore <= t.max) || thresholds[thresholds.length - 1];

    subscales[subscale] = {
      rawScore,
      scaledScore,
      level: severity.level,
      emoji: severity.emoji,
      color: severity.color,
      percentage: Math.round((scaledScore / 42) * 100),
    };
  }

  // Overall severity: take the worst severity level across all subscales
  const severityOrder = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"];
  const worstIndex = Math.max(
    severityOrder.indexOf(subscales.depression.level),
    severityOrder.indexOf(subscales.anxiety.level),
    severityOrder.indexOf(subscales.stress.level),
  );
  const overallSeverity = severityOrder[worstIndex];

  // Total score (scaled) and max
  const totalScore = subscales.depression.scaledScore + subscales.anxiety.scaledScore + subscales.stress.scaledScore;
  const maxScore = 126; // 42 * 3

  // "Accuracy" percentage — inverse of severity (higher = healthier)
  const healthPercentage = Math.round(((maxScore - totalScore) / maxScore) * 100);

  return {
    subscales,
    overallSeverity,
    overallEmoji: SEVERITY_THRESHOLDS.depression.find(t => t.level === overallSeverity)?.emoji || "🤔",
    overallDescription: SEVERITY_DESCRIPTIONS[overallSeverity],
    totalScore,
    maxScore,
    healthPercentage,
  };
}

/**
 * Map severity to a simpler label for cards
 */
export function getSeverityLabel(severity) {
  const map = {
    "Normal": "Healthy",
    "Mild": "Mild Burnout",
    "Moderate": "Moderate Burnout",
    "Severe": "Severe Burnout",
    "Extremely Severe": "Critical Burnout",
  };
  return map[severity] || severity;
}

/**
 * Map severity to emoji
 */
export function getSeverityEmoji(severity) {
  const map = {
    "Normal": "😊",
    "Mild": "🤔",
    "Moderate": "😟",
    "Severe": "😰",
    "Extremely Severe": "🆘",
  };
  return map[severity] || "🤔";
}
