
-- 1. Add approved + beta_access_until to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_access_until timestamptz;

-- 2. Add status to waitlist_signups
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 3. Create entitlements table
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes_limit integer NOT NULL DEFAULT 60,
  minutes_used numeric NOT NULL DEFAULT 0,
  tokens_limit integer NOT NULL DEFAULT 100000,
  max_books integer NOT NULL DEFAULT 1,
  can_record boolean NOT NULL DEFAULT true,
  can_generate_book boolean NOT NULL DEFAULT false,
  can_download_pdf boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view their own entitlements
CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all entitlements
CREATE POLICY "Admins can manage entitlements"
  ON public.entitlements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Allow admins to update waitlist_signups
CREATE POLICY "Admins can update waitlist signups"
  ON public.waitlist_signups FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Allow admins to update all profiles (for approved flag)
-- Already have "Admins can manage all profiles" policy

-- 6. Auto-create entitlements row when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, plan)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    'free'
  );
  INSERT INTO public.entitlements (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- 7. Trigger for updated_at on entitlements
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
