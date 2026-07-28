# 🍃 Komorebi (木漏れ日) 
**Your AI-Powered Mental Health Companion**

![Komorebi Banner](https://img.shields.io/badge/Status-Active_Development-5D8B66?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)

> **Komorebi** (Bahasa Jepang) menggambarkan keindahan cahaya matahari yang menyaring masuk melalui celah-celah dedaunan pohon. Seperti maknanya, aplikasi ini hadir sebagai secercah cahaya harapan di tengah rumitnya masalah kesehatan mental.

## 📖 Tentang Proyek Ini
**Komorebi** adalah sebuah platform kesehatan mental komprehensif yang dirancang untuk membantu pengguna melacak, memahami, dan memperbaiki kesejahteraan emosional mereka. Aplikasi ini menghadirkan pendekatan *Companion-First* melalui **Komi**—sebuah peliharaan virtual (avatar daun) bertenaga AI yang menemani perjalanan mental pengguna menggunakan pendekatan gamifikasi yang interaktif.

## ✨ Fitur Utama (Core Features)

1. 🌱 **Komi (AI Virtual Companion):** Peliharaan virtual interaktif di pojok layar yang bisa merespons sentuhan, berubah warna sesuai *mood* pengguna, dan memberikan notifikasi *guilt-trip* lucu (membeku) jika pengguna lupa menulis jurnal.
2. 📝 **Jurnal Refleksi & Mood Tracker:** Tempat aman untuk mencurahkan perasaan setiap hari. Dilengkapi dengan sistem *Streak* (runtutan) untuk membangun kebiasaan positif.
3. 🧠 **Diagnosa DASS-21:** Sistem pakar terintegrasi untuk mengukur tingkat Depresi, Kecemasan (Anxiety), dan Stres pengguna secara *real-time* dengan skala psikologi standar.
4. 💬 **Komi AI Chat:** Fitur *chatbot* di mana pengguna bisa bercerita langsung dengan Komi (ditenagai oleh AI) sebagai pertolongan pertama secara emosional.
5. 🤝 **Ruang Berbagi (Anonymous Forum):** Komunitas suportif yang memungkinkan pengguna saling berbagi cerita dan dukungan (bisa secara anonim untuk menjaga privasi absolut).
6. 🩺 **Bantuan Profesional:** Direktori terintegrasi untuk menemukan tenaga ahli (Psikolog/Psikiater) terdekat jika pengguna membutuhkan intervensi medis tingkat lanjut.

## 🛠️ Teknologi yang Digunakan (Tech Stack)

*   **Frontend:** React.js (Vite)
*   **Styling:** Tailwind CSS + Framer Motion (untuk animasi 3D & transisi UI yang mulus)
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Autentikasi:** Supabase Auth (Email OTP/Magic Link + Custom SMTP Registration)
*   **State Management:** Zustand
*   **Routing:** React Router DOM

## 👥 Tim Pengembang (The Team)
Proyek ini dibangun melalui kolaborasi lintas disiplin untuk memastikan keseimbangan antara fungsionalitas teknis yang kuat dan desain antarmuka yang ramah pengguna.

| Nama Anggota | Peran / Jobdesk | Fokus Utama |
| :--- | :--- | :--- |
| **Kaffqa Tegar G.P** | **Full Stack Developer** | Arsitektur sistem, Integrasi API (Supabase, AI), Logika Aplikasi (React/Zustand), dan *Deployment*. |
| **Desmonda Varel R.S** | **UI/UX Designer** | Riset pengalaman pengguna (UX), Wireframing, dan perancangan *User Flow* aplikasi kesehatan mental. |
| **Farros Abhista A.** | **UI/UX Designer** | Pembuatan *High-Fidelity Prototype*, sistem desain visual (UI), tipografi, dan *styling* estetika warna. |

## 🚀 Cara Menjalankan di Komputer Lokal (Local Setup)

Jika Anda ingin menjalankan proyek ini di komputer Anda sendiri:

1. **Clone Repositori ini:**
   ```bash
   git clone https://github.com/Kaffqa/Komorebi.git
   cd Komorebi
   ```

2. **Install Dependensi:**
   ```bash
   npm install
   ```

3. **Atur Environment Variables:**
   Buat file `.env` di *root directory* dan masukkan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser Anda.

## 💡 Filosofi Desain
UI/UX Komorebi dibangun dengan estetika *Zen* modern. Kami menggunakan palet warna *Earthy Green* (Hijau Daun) untuk memberikan efek psikologis yang menenangkan, dipadukan dengan desain *Glassmorphism* dan animasi mikro (*micro-interactions*) untuk menciptakan antarmuka yang terasa "hidup" dan tidak mengintimidasi (berbeda dengan aplikasi medis konvensional).

---
*Dibuat dengan ❤️ untuk meningkatkan kesadaran akan kesehatan mental di Indonesia.*
