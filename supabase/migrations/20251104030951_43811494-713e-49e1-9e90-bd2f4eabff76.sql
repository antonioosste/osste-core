-- Create session_media table for storing media files
CREATE TABLE IF NOT EXISTS public.session_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  chapter_id UUID,
  prompt TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their media"
  ON public.session_media
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their media"
  ON public.session_media
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policy for managing all media
CREATE POLICY "Admins can manage all media"
  ON public.session_media
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));