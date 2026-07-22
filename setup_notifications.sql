-- ═══════════════════════════════════════════
-- REAL-TIME NOTIFICATIONS SETUP
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1. Buat Tabel Notifikasi
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'reply', 'reminder', 'system')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mengaktifkan Realtime untuk tabel notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Aturan Keamanan (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User hanya bisa melihat notifikasinya sendiri
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- User bisa update notifikasinya sendiri (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System (via trigger) and users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);


-- 3. Fungsi Auto-Cleanup 1 Hari (24 Jam)
-- Karena kita pakai Free Tier dan fitur CRON tidak selalu aktif, 
-- kita buat "Smart Trigger" yang otomatis menghapus notifikasi lama
-- setiap kali ada notifikasi baru yang dibuat.
CREATE OR REPLACE FUNCTION auto_cleanup_old_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Hapus semua notifikasi yang berumur lebih dari 1 hari
    DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '1 day';
    RETURN NEW;
END;
$$;

-- Pasang Smart Trigger ke tabel notifications
DROP TRIGGER IF EXISTS trigger_auto_cleanup_notifications ON public.notifications;
CREATE TRIGGER trigger_auto_cleanup_notifications
AFTER INSERT ON public.notifications
FOR EACH STATEMENT
EXECUTE FUNCTION auto_cleanup_old_notifications();


-- 4. Fungsi & Trigger untuk "Forum Replies"
CREATE OR REPLACE FUNCTION notify_on_forum_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner UUID;
    replier_name TEXT;
    post_title TEXT;
BEGIN
    -- Ambil ID pemilik post dan judul post
    SELECT user_id, title INTO post_owner, post_title 
    FROM public.forum_posts WHERE id = NEW.post_id;
    
    -- Ambil nama replier
    SELECT display_name INTO replier_name 
    FROM public.profiles WHERE id = NEW.user_id;

    -- Jangan kirim notif jika mengomentari post sendiri
    IF post_owner != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, sender_id, type, title, content)
        VALUES (
            post_owner, 
            NEW.user_id, 
            'reply', 
            'Ada balasan baru! 💬', 
            replier_name || ' mengomentari post Anda: "' || left(post_title, 20) || '..."'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_reply ON public.forum_replies;
CREATE TRIGGER trigger_notify_on_reply
AFTER INSERT ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION notify_on_forum_reply();


-- 5. Fungsi & Trigger untuk "Forum Likes"
CREATE OR REPLACE FUNCTION notify_on_forum_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner UUID;
    liker_name TEXT;
    post_title TEXT;
BEGIN
    -- Ambil ID pemilik post dan judul post
    SELECT user_id, title INTO post_owner, post_title 
    FROM public.forum_posts WHERE id = NEW.post_id;
    
    -- Ambil nama liker
    SELECT display_name INTO liker_name 
    FROM public.profiles WHERE id = NEW.user_id;

    -- Jangan kirim notif jika melike post sendiri
    IF post_owner != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, sender_id, type, title, content)
        VALUES (
            post_owner, 
            NEW.user_id, 
            'like', 
            'Postingan Anda disukai! ❤️', 
            liker_name || ' menyukai post Anda: "' || left(post_title, 20) || '..."'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON public.forum_likes;
CREATE TRIGGER trigger_notify_on_like
AFTER INSERT ON public.forum_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_forum_like();
