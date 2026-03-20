-- Add RLS policy to story_images table that enforces photo upload permission
-- This prevents free users from inserting image records even via API bypass
CREATE POLICY "Users can only insert images if plan allows photo uploads"
ON public.story_images
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_user_perform(auth.uid(), 'upload_photos')
);