
-- ============================================================
-- PHASE 1: Create user_billing table (transactional records)
-- ============================================================
CREATE TABLE public.user_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  stripe_price_id text,
  plan text NOT NULL CHECK (plan IN ('digital', 'legacy')),
  payment_status text DEFAULT 'completed',
  amount_paid integer,
  currency text DEFAULT 'usd',
  is_manual boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_billing_user_id ON public.user_billing(user_id);
CREATE INDEX idx_user_billing_stripe_customer_id ON public.user_billing(stripe_customer_id);

ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing"
  ON public.user_billing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage billing"
  ON public.user_billing FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PHASE 2: Fix handle_new_user() — REMOVE billing insert
-- ============================================================
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

  INSERT INTO public.profiles (id, email, name, approved, beta_access_until)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    CASE WHEN wl_status = 'approved' THEN true ELSE false END,
    null
  )
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email,
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

-- ============================================================
-- PHASE 3: Seed existing paid users as MANUAL (no fake Stripe IDs)
-- ============================================================
INSERT INTO public.user_billing (user_id, provider, plan, is_manual, payment_status)
SELECT DISTINCT sg.user_id, 'manual', sg.plan, true, 'completed'
FROM public.story_groups sg
WHERE sg.plan IN ('digital', 'legacy')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_billing ub
    WHERE ub.user_id = sg.user_id AND ub.plan = sg.plan
  );

-- Fix invalid plan values in profiles
UPDATE public.profiles
SET plan = 'free'
WHERE plan NOT IN ('free', 'digital', 'legacy') OR plan IS NULL;
