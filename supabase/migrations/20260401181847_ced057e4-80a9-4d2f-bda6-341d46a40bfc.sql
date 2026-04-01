-- Fix 1: Storage RLS policies for story_images bucket
CREATE POLICY "Users can view their own story images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'story_images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own story images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'story_images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own story images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'story_images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'story_images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own story images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'story_images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 2: Storage RLS policies for books bucket
CREATE POLICY "Users can view their own books"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'books'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own books"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'books'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own books"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'books'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'books'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own books"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'books'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 3: Prevent profile privilege escalation via BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is admin, allow all changes
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- For non-admin users updating their own profile, prevent changes to sensitive fields
  IF NEW.id = auth.uid() THEN
    NEW.approved := OLD.approved;
    NEW.plan := OLD.plan;
    NEW.display_role := OLD.display_role;
    NEW.user_type := OLD.user_type;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_sensitive_fields();