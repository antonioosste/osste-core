-- Fix get_user_account_plan to check user_billing first (source of truth), then story_groups
CREATE OR REPLACE FUNCTION public.get_user_account_plan(p_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    -- 1. Check user_billing (source of truth for purchases)
    (SELECT plan FROM user_billing
     WHERE user_id = p_user_id
     ORDER BY created_at DESC
     LIMIT 1),
    -- 2. Fall back to story_groups highest plan
    (SELECT CASE
      WHEN EXISTS (SELECT 1 FROM story_groups WHERE user_id = p_user_id AND plan = 'legacy') THEN 'legacy'
      WHEN EXISTS (SELECT 1 FROM story_groups WHERE user_id = p_user_id AND plan = 'digital') THEN 'digital'
      ELSE NULL
    END),
    -- 3. Default to free
    'free'
  );
$function$;

-- Fix get_user_recording_limit_seconds to check user_billing first
CREATE OR REPLACE FUNCTION public.get_user_recording_limit_seconds(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM user_billing
      WHERE user_id = p_user_id AND plan IN ('legacy', 'digital')
    ) THEN 3600  -- 60 minutes
    WHEN EXISTS (
      SELECT 1 FROM story_groups
      WHERE user_id = p_user_id AND plan IN ('legacy', 'digital')
    ) THEN 3600  -- 60 minutes
    ELSE 1200  -- 20 minutes
  END;
$function$;