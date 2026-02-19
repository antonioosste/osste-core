
-- Fix handle_new_user() to use waitlist_signups instead of legacy waitlist table
-- and remove reference to legacy 'role' column
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  wl_status text;
begin
  -- Check waitlist approval by email in the active waitlist_signups table
  select status into wl_status
  from public.waitlist_signups
  where lower(email) = lower(new.email)
  order by created_at desc
  limit 1;

  -- Create/update profile row (profiles.id = auth.users.id)
  insert into public.profiles (id, email, name, approved, beta_access_until)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    case when wl_status = 'approved' then true else false end,
    null
  )
  on conflict (id) do update
    set email = excluded.email,
        -- If already approved, keep it; otherwise check waitlist
        approved = case 
          when (select approved from public.profiles where id = new.id) = true then true
          when wl_status = 'approved' then true
          else false
        end;

  -- Ensure entitlements row exists
  insert into public.entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;
