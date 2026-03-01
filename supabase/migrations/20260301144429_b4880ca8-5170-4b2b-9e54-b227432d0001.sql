
-- ============================================================
-- user_billing: Centralized billing state per user
-- ============================================================
CREATE TABLE public.user_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  billing_provider TEXT NOT NULL DEFAULT 'none', -- 'none' | 'stripe' | 'manual'
  stripe_customer_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free', -- 'free' | 'digital' | 'legacy'
  subscription_status TEXT NOT NULL DEFAULT 'inactive', -- 'active' | 'inactive' | 'active_manual'
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for Stripe customer lookups
CREATE INDEX idx_user_billing_stripe_customer ON public.user_billing (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

-- Users can read their own billing record
CREATE POLICY "Users can view own billing"
  ON public.user_billing FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all billing records
CREATE POLICY "Admins can manage all billing"
  ON public.user_billing FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role can do anything (for edge functions)
-- Note: service_role bypasses RLS by default, so no explicit policy needed

-- Auto-update updated_at
CREATE TRIGGER update_user_billing_updated_at
  BEFORE UPDATE ON public.user_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed billing rows for existing users based on current state
-- Users with any paid story_group get billing_provider='stripe' (assumption: they paid via Stripe)
-- Users with profiles.plan set but no paid story_groups get billing_provider='manual'
INSERT INTO public.user_billing (user_id, billing_provider, plan_type, subscription_status, activated_at)
SELECT
  p.id,
  CASE
    WHEN EXISTS (SELECT 1 FROM story_groups sg WHERE sg.user_id = p.id AND sg.plan IN ('digital', 'legacy'))
      THEN COALESCE(
        CASE WHEN p.plan IN ('digital', 'legacy') THEN 'stripe' ELSE 'none' END,
        'stripe'
      )
    WHEN p.plan IN ('digital', 'legacy') THEN 'manual'
    ELSE 'none'
  END,
  COALESCE(
    (SELECT CASE
      WHEN EXISTS (SELECT 1 FROM story_groups sg2 WHERE sg2.user_id = p.id AND sg2.plan = 'legacy') THEN 'legacy'
      WHEN EXISTS (SELECT 1 FROM story_groups sg3 WHERE sg3.user_id = p.id AND sg3.plan = 'digital') THEN 'digital'
      ELSE 'free'
    END),
    'free'
  ),
  CASE
    WHEN EXISTS (SELECT 1 FROM story_groups sg WHERE sg.user_id = p.id AND sg.plan IN ('digital', 'legacy'))
      THEN 'active'
    WHEN p.plan IN ('digital', 'legacy') THEN 'active_manual'
    ELSE 'inactive'
  END,
  CASE
    WHEN EXISTS (SELECT 1 FROM story_groups sg WHERE sg.user_id = p.id AND sg.plan IN ('digital', 'legacy'))
      THEN now()
    WHEN p.plan IN ('digital', 'legacy') THEN now()
    ELSE NULL
  END
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;
