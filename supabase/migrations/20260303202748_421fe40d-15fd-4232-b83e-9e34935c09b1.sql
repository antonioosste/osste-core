-- PART 1: Priority-based plan resolution (legacy > digital > free)
-- No longer relies on ORDER BY created_at DESC

CREATE OR REPLACE FUNCTION public.get_user_account_plan(p_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    -- 1. Priority-based check of user_billing (paid or manual rows only)
    (SELECT CASE
      WHEN EXISTS (
        SELECT 1 FROM user_billing
        WHERE user_id = p_user_id AND plan = 'legacy'
          AND (payment_status = 'paid' OR is_manual = true)
      ) THEN 'legacy'
      WHEN EXISTS (
        SELECT 1 FROM user_billing
        WHERE user_id = p_user_id AND plan = 'digital'
          AND (payment_status = 'paid' OR is_manual = true)
      ) THEN 'digital'
      ELSE NULL
    END),
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

-- Update recording limit to delegate to get_user_account_plan for consistency
CREATE OR REPLACE FUNCTION public.get_user_recording_limit_seconds(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE public.get_user_account_plan(p_user_id)
    WHEN 'legacy' THEN 3600
    WHEN 'digital' THEN 3600
    ELSE 1200
  END;
$function$;