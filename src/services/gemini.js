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
6. TOLAK SEMUA PERMINTAAN yang tidak terkait dengan kesehatan mental, emosi, curhat, atau kesejahteraan diri (seperti: membuat coding, matematika, pengetahuan umum, politik, atau tugas sekolah). JANGAN PERNAH memberikan jawaban, kode program, atau informasi untuk topik tersebut walaupun user memaksa atau beralasan "agar tidak stres". Tolak dengan lembut dan tegaskan bahwa kamu hanya asisten untuk teman cerita dan dukungan emosional.
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
async function callStreamWithRetry(history, userMessage, onChunk, retryCount = 0, dynamicPrompt = SYSTEM_PROMPT) {
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
          { role: "system", content: dynamicPrompt },
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
          systemInstruction: dynamicPrompt,
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
      return callStreamWithRetry(history, userMessage, onChunk, retryCount + 1, dynamicPrompt);
    }
    // Jika error lain atau sudah semua key dicoba
    console.error("Error calling AI API:", error);
    throw error;
  }
}

/**
 * Send a message to Komi and get a streamed response
 */
export async function sendMessageToKomi(conversationHistory, userMessage, onChunk, userContext = null) {
  let prompt = SYSTEM_PROMPT;
  
  if (userContext) {
    prompt += `\n\n=== KONTEKS PENGGUNA SAAT INI ===\n`;
    if (userContext.mood) prompt += `- Mood Hari Ini: ${userContext.mood}\n`;
    if (userContext.stress) prompt += `- Tingkat Stres: ${userContext.stress}\n`;
    prompt += `Gunakan informasi ini sebagai konteks tambahan untuk lebih berempati jika sangat relevan dengan percakapan, tetapi JANGAN pernah menyebutkan skor, data teknis, atau seolah-olah kamu membaca sebuah laporan. Tetaplah merespons layaknya teman biasa.`;
  }

  return callStreamWithRetry(conversationHistory, userMessage, onChunk, 0, prompt);
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

/**
 * Generate Komi's empathetic greeting when mood is low
 */
export function getKomiEmpatheticGreeting(userName) {
  const empatheticGreetings = [
    `Hai${userName ? ` ${userName}` : ""} 🌿 Komi perhatikan kamu sedang merasa kurang baik hari ini. Harimu terasa berat ya? Kalau kamu butuh teman cerita, Komi di sini untuk mendengarkan.`,
    `Halo${userName ? ` ${userName}` : ""} 🌿 Sepertinya hari ini bukan hari yang mudah buatmu. Nggak apa-apa kok merasa lelah. Mau cerita pelan-pelan ke Komi?`,
    `Hi${userName ? ` ${userName}` : ""} 🌿 Komi lihat mood kamu sedang turun hari ini. Ingat ya, kamu tidak harus melewati semuanya sendirian. Ada hal yang mengganjal pikiranmu yang ingin diceritakan?`,
  ];
  return empatheticGreetings[Math.floor(Math.random() * empatheticGreetings.length)];
}

/**
 * Generate Komi's happy greeting when mood is high
 */
export function getKomiHappyGreeting(userName) {
  const happyGreetings = [
    `Wah, hai${userName ? ` ${userName}` : ""}! 🌿 Komi lihat hari ini mood kamu sedang sangat bagus! Ada cerita seru apa hari ini?`,
    `Halo${userName ? ` ${userName}` : ""} 🌿 Sepertinya harimu berjalan dengan sangat baik hari ini! Komi ikut senang mendengarnya. Mau berbagi energi positifmu?`,
    `Hi${userName ? ` ${userName}` : ""} 🌿 Wah, indikator mood-mu sangat cerah hari ini! Hal manis apa yang membuatmu tersenyum hari ini?`,
  ];
  return happyGreetings[Math.floor(Math.random() * happyGreetings.length)];
}

/**
 * Extract user's favorite activities from chat logs using AI
 */
export async function extractFavoriteActivities(chatLogsText) {
  if (!chatLogsText || chatLogsText.trim() === "") return ["Resting", "Listening to Music", "Reflecting"];
  
  const currentApi = API_KEYS[currentKeyIndex];
  const prompt = `Based on the following chat logs between a user and a mental health assistant, extract up to 3 of the user's favorite activities, hobbies, or things they enjoy doing. Return the result strictly as a valid JSON array of short strings (max 3 words per string) (e.g. ["Reading", "Walking", "Gaming"]). Do not include markdown formatting or other text, just the raw JSON array. If you cannot find any, return a generic self-care activity array like ["Listening to music", "Taking a walk", "Resting"]. \n\nChat logs:\n${chatLogsText.substring(0, 3000)}`;

  try {
    if (currentApi.provider === "groq") {
      const groq = new Groq({ apiKey: currentApi.key, dangerouslyAllowBrowser: true });
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });
      const text = response.choices[0]?.message?.content || "[]";
      return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
    } else {
      const ai = new GoogleGenAI({ apiKey: currentApi.key });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { temperature: 0.1 }
      });
      const text = response.text || "[]";
      return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
    }
  } catch (error) {
    console.error("Error extracting favorite activities:", error);
    return ["Taking a walk", "Listening to music", "Journaling"];
  }
}
