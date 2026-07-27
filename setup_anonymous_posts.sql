-- Jalankan script ini di SQL Editor Supabase Anda untuk menambahkan fitur Anonymous Post

-- 1. Tambahkan kolom is_anonymous ke tabel forum_posts
ALTER TABLE public.forum_posts 
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Selesai! Tidak perlu mengubah RLS karena data pembuat asli (user_id) tetap disimpan dengan aman, 
-- fitur anonim ini murni berfungsi untuk menyembunyikan identitas di sisi front-end saja.
