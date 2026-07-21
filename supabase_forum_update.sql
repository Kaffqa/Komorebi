-- Jalankan script ini di SQL Editor Supabase Anda untuk menambahkan kolom yang kurang pada tabel forum_posts

ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Jangan lupa untuk membuat Storage Bucket bernama "forum_images" dan set ke Public
