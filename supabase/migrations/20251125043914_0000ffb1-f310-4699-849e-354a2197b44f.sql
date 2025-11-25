-- Add transcript fields to chapters table
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS raw_transcript TEXT,
ADD COLUMN IF NOT EXISTS polished_text TEXT;

-- Add chapter_order field if not exists (using order_index)
-- order_index already exists, so we'll use that

-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.chapters.raw_transcript IS 'Raw transcription text from audio recording';
COMMENT ON COLUMN public.chapters.polished_text IS 'AI-polished version of the transcript for the final book';