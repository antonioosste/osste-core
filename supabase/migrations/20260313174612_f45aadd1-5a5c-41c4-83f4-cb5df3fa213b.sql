-- Fix: get_user_account_plan should NOT fall back to story_groups table
-- This prevents book deletion from affecting the user's plan status
CREATE OR REPLACE FUNCTION public.get_user_account_plan(p_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
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
    'free'
  );
$function$;