-- Jalankan script ini di SQL Editor Supabase Anda untuk menambahkan aturan akses (Policies) ke bucket forum_images

-- 1. Mengizinkan semua orang (publik) untuk melihat gambar di forum_images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'forum_images' );

-- 2. Mengizinkan user yang sudah login (authenticated) untuk mengupload gambar
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'forum_images' AND auth.role() = 'authenticated' );

-- 3. Mengizinkan user untuk mengupdate gambar mereka sendiri
CREATE POLICY "Users can update their own images" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'forum_images' AND auth.uid() = owner );

-- 4. Mengizinkan user untuk menghapus gambar mereka sendiri
CREATE POLICY "Users can delete their own images" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'forum_images' AND auth.uid() = owner );
