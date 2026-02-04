-- Storage bucket and RLS Policies for audio-files bucket
-- Run this in Supabase SQL Editor to set up audio storage for voice narration

-- Step 1: Create the audio-files bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,  -- Public bucket so audio can be played in emails
  10485760,  -- 10MB limit per file
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']::text[];

-- Step 2: Allow public read access (for email audio playback)
CREATE POLICY "Public read access for audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

-- Step 3: Allow authenticated users to upload (via service role)
CREATE POLICY "Service role can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files');

-- Step 4: Allow service role to update/delete
CREATE POLICY "Service role can update audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio-files');

CREATE POLICY "Service role can delete audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-files');

-- Done! Audio files will be stored in: audio-files/voice-narration/
-- Public URL format: https://[project].supabase.co/storage/v1/object/public/audio-files/voice-narration/[filename].mp3
