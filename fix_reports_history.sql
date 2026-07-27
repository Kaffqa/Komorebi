-- Jalankan script ini di SQL Editor Supabase Anda untuk memperbaiki riwayat laporan yang hilang

-- 1. Hapus constraint (aturan) foreign key yang lama
ALTER TABLE public.forum_reports 
  DROP CONSTRAINT IF EXISTS forum_reports_post_id_fkey;

-- 2. Ubah kolom post_id agar mengizinkan nilai kosong (NULL) jika postingan dihapus
ALTER TABLE public.forum_reports 
  ALTER COLUMN post_id DROP NOT NULL;

-- 3. Tambahkan kembali constraint baru dengan aturan ON DELETE SET NULL
-- (Artinya: Jika postingan dihapus, laporannya tidak ikut terhapus, melainkan ID postingannya saja yang dikosongkan)
ALTER TABLE public.forum_reports
  ADD CONSTRAINT forum_reports_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES public.forum_posts(id) 
  ON DELETE SET NULL;
