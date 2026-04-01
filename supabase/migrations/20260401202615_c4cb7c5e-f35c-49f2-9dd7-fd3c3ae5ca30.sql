
-- Fix search_path on functions that are missing it
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_user_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type NOT IN ('beta', 'public', 'admin') THEN
    RAISE EXCEPTION 'Invalid user_type: %. Must be beta, public, or admin.', NEW.user_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_session_owner(p_session_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.sessions WHERE id = p_session_id LIMIT 1;
$$;
