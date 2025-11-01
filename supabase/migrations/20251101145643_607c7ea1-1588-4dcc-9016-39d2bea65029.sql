-- Allow authenticated users to sign/get their own TTS files under the 'recordings' bucket
-- TTS objects are saved at: tts/{user_id}/{file}.mp3
-- The first folder is 'tts', the second folder is the user_id

-- Drop the policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own TTS files in recordings" ON storage.objects;

-- Create SELECT policy for TTS objects
CREATE POLICY "Users can view their own TTS files in recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'recordings'
  AND (storage.foldername(name))[1] = 'tts'
  AND auth.uid()::text = (storage.foldername(name))[2]
);