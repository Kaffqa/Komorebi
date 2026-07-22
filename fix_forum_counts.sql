-- ═══════════════════════════════════════════
-- FORUM COUNTS FIX
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1. Pastikan kolom likes_count dan replies_count ada dan set default 0
ALTER TABLE public.forum_posts 
ALTER COLUMN likes_count SET DEFAULT 0,
ALTER COLUMN replies_count SET DEFAULT 0;

UPDATE public.forum_posts 
SET likes_count = 0 WHERE likes_count IS NULL;

UPDATE public.forum_posts 
SET replies_count = 0 WHERE replies_count IS NULL;

-- 2. Fungsi untuk menambah like (Diperbarui dengan COALESCE)
CREATE OR REPLACE FUNCTION public.increment_post_likes(p_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.forum_posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_id;
$$;

-- 3. Fungsi untuk mengurangi like (Diperbarui dengan COALESCE)
CREATE OR REPLACE FUNCTION public.decrement_post_likes(p_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.forum_posts
  SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
  WHERE id = p_id;
$$;

-- 4. Fungsi untuk menambah jumlah reply/komentar (Diperbarui dengan COALESCE)
CREATE OR REPLACE FUNCTION public.increment_post_replies(p_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.forum_posts
  SET replies_count = COALESCE(replies_count, 0) + 1
  WHERE id = p_id;
$$;
