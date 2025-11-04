-- Create storage bucket for session media
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-media', 'session-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for session-media bucket
CREATE POLICY "Users can view their own session media"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'session-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own session media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'session-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own session media"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'session-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage all session media"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'session-media'
    AND has_role(auth.uid(), 'admin'::app_role)
  );