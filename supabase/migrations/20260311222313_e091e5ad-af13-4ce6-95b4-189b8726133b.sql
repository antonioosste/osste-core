
-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Update handle_new_user trigger to save phone and referral_source
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  wl_status text;
BEGIN
  SELECT status INTO wl_status
  FROM public.waitlist_signups
  WHERE lower(email) = lower(new.email)
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO public.profiles (id, email, name, phone, approved, beta_access_until)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    CASE WHEN wl_status = 'approved' THEN true ELSE false END,
    null
  )
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email,
        phone = COALESCE(excluded.phone, profiles.phone),
        approved = CASE
          WHEN (SELECT approved FROM public.profiles WHERE id = new.id) = true THEN true
          WHEN wl_status = 'approved' THEN true
          ELSE false
        END;

  INSERT INTO public.entitlements (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$function$;
