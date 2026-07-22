-- ═══════════════════════════════════════════
-- STORAGE BUCKET: specialist_avatars
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Create the storage bucket and make it public
INSERT INTO storage.buckets (id, name, public)
VALUES ('specialist_avatars', 'specialist_avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Mengizinkan semua orang melihat foto spesialis (Public Access)
CREATE POLICY "Public Access Specialist Avatars" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'specialist_avatars' );

-- 2. Mengizinkan HANYA Admin untuk mengupload gambar
CREATE POLICY "Admins can upload specialist avatars" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'specialist_avatars' AND 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Mengizinkan HANYA Admin untuk mengupdate gambar
CREATE POLICY "Admins can update specialist avatars" 
ON storage.objects FOR UPDATE 
USING ( 
  bucket_id = 'specialist_avatars' AND 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Mengizinkan HANYA Admin untuk menghapus gambar
CREATE POLICY "Admins can delete specialist avatars" 
ON storage.objects FOR DELETE 
USING ( 
  bucket_id = 'specialist_avatars' AND 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
