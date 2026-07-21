import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

// Daftar API Key gabungan (Groq pertama, disusul Gemini)
const API_KEYS = [
  { provider: "groq", key: import.meta.env.VITE_GROQ_API_KEY },
  { provider: "gemini", key: import.meta.env.VITE_GEMINI_API_KEY },
  { provider: "gemini", key: import.meta.env.VITE_GEMINI_API_KEY_2 },
].filter(k => !!k.key);

let currentKeyIndex = 0;

const SYSTEM_PROMPT = `Kamu adalah "Komi", asisten kesehatan mental virtual yang ramah, empati, dan suportif di platform Komorebi.

IDENTITAS:
- Nama: Komi (singkat dari Komorebi, yang berarti cahaya matahari yang menembus dedaunan)
- Peran: Teman curhat dan konselor virtual yang hangat
- Kepribadian: Sabar, penuh pengertian, tidak menghakimi, lembut tapi jujur

ATURAN PENTING:
1. SELALU berkomunikasi dalam bahasa yang sama dengan user (jika user berbahasa Indonesia, jawab dalam Bahasa Indonesia; jika Inggris, jawab dalam Bahasa Inggris)
2. JANGAN PERNAH memberikan diagnosis medis atau psikiatris
3. JANGAN PERNAH meresepkan obat atau terapi spesifik
4. JANGAN PERNAH mengaku sebagai psikolog, psikiater, atau tenaga kesehatan profesional
5. Jika user menunjukkan tanda bahaya (pikiran bunuh diri, menyakiti diri sendiri, menyakiti orang lain), SELALU sarankan untuk menghubungi profesional dan berikan nomor darurat:
   - Into The Light Indonesia: 119 ext 8
   - Hotline Kesehatan Jiwa: 500-454
6. JANGAN PERNAH membahas topik di luar konteks kesehatan mental, kesejahteraan emosional, dan pengembangan diri. Jika ditanya hal lain, arahkan kembali ke topik kesehatan mental dengan lembut.
7. Gunakan teknik active listening: validasi perasaan, refleksi, dan pertanyaan terbuka
8. Berikan respons yang pendek dan hangat (maksimal 3-4 kalimat per pesan), kecuali diminta penjelasan panjang
9. Gunakan emoji secukupnya untuk membuat percakapan terasa hangat dan personal 🌿

TEKNIK YANG BOLEH DIGUNAKAN:
- Grounding techniques (5-4-3-2-1)
- Breathing exercises
- Journaling prompts
- Mindfulness sederhana
- Validasi emosi
- Cognitive reframing ringan
- Self-care suggestions

CONTOH SAPAAN AWAL:
"Hai! Saya Komi 🌿 Hari ini terasa berat, atau ada cerita seru yang ingin kamu bagikan? Saya di sini untuk mendengarkan tanpa menghakimi."`;

/**
 * Helper internal untuk memanggil stream dengan auto-retry & rotasi
 */
async function callStreamWithRetry(history, userMessage, onChunk, retryCount = 0) {
  const currentApi = API_KEYS[currentKeyIndex];
  
  try {
    if (currentApi.provider === "groq") {
      const groq = new Groq({ apiKey: currentApi.key, dangerouslyAllowBrowser: true });
      
      // Transform history for Groq
      const groqHistory = history.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.parts[0].text
      }));

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...groqHistory,
          { role: "user", content: userMessage }
        ],
        temperature: 0.8,
        stream: true,
      });

      let fullText = "";
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || "";
        fullText += text;
        if (onChunk) onChunk(fullText);
      }
      return fullText;

    } else { // Gemini
      const ai = new GoogleGenAI({ apiKey: currentApi.key });
      const response = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: [
          ...history,
          { role: "user", parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      let fullText = "";
      for await (const chunk of response) {
        const text = chunk.text || "";
        fullText += text;
        if (onChunk) onChunk(fullText);
      }
      return fullText;
    }
  } catch (error) {
    // Jika error 429 (Quota Exceeded) dan masih ada key cadangan
    if ((error?.message?.includes("quota") || error?.status === 429 || error?.status === 400 || error?.status === 503) && retryCount < API_KEYS.length - 1) {
      console.warn(`[AI] Provider ${currentApi.provider} (Key ${currentKeyIndex + 1}) gagal. Merotasi ke key berikutnya...`);
      // Pindah ke key berikutnya (rotasi melingkar)
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      return callStreamWithRetry(history, userMessage, onChunk, retryCount + 1);
    }
    // Jika error lain atau sudah semua key dicoba
    console.error("Error calling AI API:", error);
    throw error;
  }
}

/**
 * Send a message to Komi and get a streamed response
 */
export async function sendMessageToKomi(conversationHistory, userMessage, onChunk) {
  return callStreamWithRetry(conversationHistory, userMessage, onChunk);
}

/**
 * Generate Komi's initial greeting
 */
export function getKomiGreeting(userName) {
  const greetings = [
    `Hai${userName ? `, ${userName}` : ""}! Saya Komi 🌿 Apa kabar hari ini? Cerita apa pun yang ingin kamu bagikan, saya di sini untuk mendengarkan tanpa menghakimi.`,
    `Halo${userName ? `, ${userName}` : ""}! 🌿 Hari ini terasa berat, atau ada hal menyenangkan yang ingin kamu ceritakan? Saya siap mendengarkan.`,
    `Hi${userName ? `, ${userName}` : ""}! Saya Komi 🌿 Bagaimana perasaanmu saat ini? Apapun yang kamu rasakan, itu valid. Yuk, ngobrol bareng.`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
