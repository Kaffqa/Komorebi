-- Jalankan script ini di SQL Editor Supabase Anda untuk membuat tabel pelaporan (forum_reports)

-- 1. Buat tabel forum_reports
CREATE TABLE IF NOT EXISTS public.forum_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan RLS (Row Level Security)
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;

-- 3. Policy: User bisa membuat laporan
CREATE POLICY "Users can create reports" 
ON public.forum_reports
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- 4. Policy: Admin bisa membaca dan mengedit semua laporan
CREATE POLICY "Admins can view all reports" 
ON public.forum_reports
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update reports" 
ON public.forum_reports
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Policy: Admin bisa MENGHAPUS postingan forum
DROP POLICY IF EXISTS "Admins can delete forum posts" ON public.forum_posts;
CREATE POLICY "Admins can delete forum posts" 
ON public.forum_posts
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. Policy: Admin bisa MENGHAPUS komentar forum
DROP POLICY IF EXISTS "Admins can delete forum comments" ON public.forum_comments;
CREATE POLICY "Admins can delete forum comments" 
ON public.forum_comments
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
