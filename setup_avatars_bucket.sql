-- ═══════════════════════════════════════════
-- STORAGE BUCKET: avatars
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Create the storage bucket and make it public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Mengizinkan semua orang melihat foto avatar (Public Access)
CREATE POLICY "Public Access User Avatars" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 2. Mengizinkan user yang sedang login (authenticated) untuk mengupload avatar
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 3. Mengizinkan user mengupdate avatar mereka
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING ( 
  bucket_id = 'avatars' AND 
  auth.uid() = owner
);

-- 4. Mengizinkan user menghapus avatar mereka
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING ( 
  bucket_id = 'avatars' AND 
  auth.uid() = owner
);
