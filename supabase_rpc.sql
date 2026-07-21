-- Jalankan script ini di SQL Editor Supabase Anda untuk menambahkan fungsi increment atomik

-- 1. Fungsi untuk menambah like
CREATE OR REPLACE FUNCTION increment_post_likes(p_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE forum_posts
  SET likes_count = likes_count + 1
  WHERE id = p_id;
$$;

-- 2. Fungsi untuk mengurangi like
CREATE OR REPLACE FUNCTION decrement_post_likes(p_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE forum_posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = p_id;
$$;

-- 3. Fungsi untuk menambah jumlah reply/komentar
CREATE OR REPLACE FUNCTION increment_post_replies(p_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE forum_posts
  SET replies_count = replies_count + 1
  WHERE id = p_id;
$$;
