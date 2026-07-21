-- ═══════════════════════════════════════════
-- SEED: Insert DASS-21 Assessment
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════

INSERT INTO public.assessments (name, description, questions, scoring_rules)
VALUES (
  'DASS-21',
  'Depression Anxiety Stress Scale - 21 Items. Instrumen psikometrik terstandar internasional untuk mengukur tingkat depresi, kecemasan, dan stres.',
  '[
    {"id": 1,  "text": "Saya merasa sulit untuk bersantai atau menenangkan diri.", "subscale": "stress"},
    {"id": 2,  "text": "Saya menyadari mulut saya terasa kering.", "subscale": "anxiety"},
    {"id": 3,  "text": "Saya merasa tidak bisa merasakan perasaan positif sama sekali.", "subscale": "depression"},
    {"id": 4,  "text": "Saya mengalami kesulitan bernapas (misalnya napas cepat, sesak tanpa aktivitas fisik).", "subscale": "anxiety"},
    {"id": 5,  "text": "Saya merasa sulit untuk memulai sesuatu atau mengambil inisiatif.", "subscale": "depression"},
    {"id": 6,  "text": "Saya cenderung bereaksi berlebihan terhadap situasi tertentu.", "subscale": "stress"},
    {"id": 7,  "text": "Saya mengalami gemetar (misalnya pada tangan).", "subscale": "anxiety"},
    {"id": 8,  "text": "Saya merasa menggunakan banyak energi untuk merasa cemas.", "subscale": "stress"},
    {"id": 9,  "text": "Saya khawatir terhadap situasi di mana saya mungkin panik dan mempermalukan diri sendiri.", "subscale": "anxiety"},
    {"id": 10, "text": "Saya merasa tidak ada hal yang bisa dinantikan atau diharapkan.", "subscale": "depression"},
    {"id": 11, "text": "Saya merasa mudah gelisah dan terganggu.", "subscale": "stress"},
    {"id": 12, "text": "Saya merasa sulit untuk bersantai.", "subscale": "stress"},
    {"id": 13, "text": "Saya merasa sedih dan tertekan.", "subscale": "depression"},
    {"id": 14, "text": "Saya merasa tidak sabar ketika mengalami penundaan (misalnya antrean, kemacetan).", "subscale": "stress"},
    {"id": 15, "text": "Saya merasa hampir pingsan.", "subscale": "anxiety"},
    {"id": 16, "text": "Saya merasa kehilangan minat terhadap segala hal.", "subscale": "depression"},
    {"id": 17, "text": "Saya merasa tidak berharga sebagai seorang manusia.", "subscale": "depression"},
    {"id": 18, "text": "Saya merasa mudah tersinggung.", "subscale": "stress"},
    {"id": 19, "text": "Saya menyadari detak jantung saya meskipun tidak melakukan aktivitas fisik.", "subscale": "anxiety"},
    {"id": 20, "text": "Saya merasa takut tanpa alasan yang jelas.", "subscale": "anxiety"},
    {"id": 21, "text": "Saya merasa hidup ini tidak berarti.", "subscale": "depression"}
  ]'::jsonb,
  '{
    "multiplier": 2,
    "subscales": {
      "depression": {
        "questions": [3, 5, 10, 13, 16, 17, 21],
        "thresholds": [
          {"max": 9, "level": "Normal"},
          {"max": 13, "level": "Mild"},
          {"max": 20, "level": "Moderate"},
          {"max": 27, "level": "Severe"},
          {"max": 42, "level": "Extremely Severe"}
        ]
      },
      "anxiety": {
        "questions": [2, 4, 7, 9, 15, 19, 20],
        "thresholds": [
          {"max": 7, "level": "Normal"},
          {"max": 9, "level": "Mild"},
          {"max": 14, "level": "Moderate"},
          {"max": 19, "level": "Severe"},
          {"max": 42, "level": "Extremely Severe"}
        ]
      },
      "stress": {
        "questions": [1, 6, 8, 11, 12, 14, 18],
        "thresholds": [
          {"max": 14, "level": "Normal"},
          {"max": 18, "level": "Mild"},
          {"max": 25, "level": "Moderate"},
          {"max": 33, "level": "Severe"},
          {"max": 42, "level": "Extremely Severe"}
        ]
      }
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;
