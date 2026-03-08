
-- Add user_type column with default 'beta' so all existing users stay as beta
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'beta';

-- Add validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_profile_user_type()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_type NOT IN ('beta', 'public', 'admin') THEN
    RAISE EXCEPTION 'Invalid user_type: %. Must be beta, public, or admin.', NEW.user_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_user_type ON public.profiles;
CREATE TRIGGER trg_validate_profile_user_type
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_user_type();
