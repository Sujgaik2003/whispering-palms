-- Storage RLS Policies for palm-images bucket
-- Run this in Supabase SQL Editor after creating the bucket

-- Policy 1: Users can upload their own files
CREATE POLICY "Users can upload own palm images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'palm-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can read their own files
CREATE POLICY "Users can read own palm images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'palm-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete own palm images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'palm-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can update their own files (optional, for replacing images)
CREATE POLICY "Users can update own palm images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'palm-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
