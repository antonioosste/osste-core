
-- Create function to calculate total recorded minutes for a user across ALL books
CREATE OR REPLACE FUNCTION public.get_user_total_recorded_seconds(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(r.duration_seconds), 0)::numeric
  FROM recordings r
  JOIN sessions s ON r.session_id = s.id
  WHERE s.user_id = p_user_id;
$$;

-- Create function to determine a user's highest plan tier across all books
CREATE OR REPLACE FUNCTION public.get_user_account_plan(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM story_groups WHERE user_id = p_user_id AND plan = 'legacy') THEN 'legacy'
    WHEN EXISTS (SELECT 1 FROM story_groups WHERE user_id = p_user_id AND plan = 'digital') THEN 'digital'
    ELSE 'free'
  END;
$$;

-- Create function to get account-level recording limit based on highest plan
CREATE OR REPLACE FUNCTION public.get_user_recording_limit_seconds(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM story_groups WHERE user_id = p_user_id AND plan IN ('legacy', 'digital')) THEN 3600  -- 60 minutes
    ELSE 1200  -- 20 minutes
  END;
$$;
