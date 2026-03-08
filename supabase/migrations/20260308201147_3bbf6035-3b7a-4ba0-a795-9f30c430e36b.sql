
-- Beta invite codes table
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invite codes"
  ON public.invite_codes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Track which user redeemed which code
CREATE TABLE public.invite_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id uuid NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view redemptions"
  ON public.invite_code_redemptions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Anyone can insert redemptions"
  ON public.invite_code_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- System settings table for editable admin config
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only owners can modify settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Seed default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('beta_mode', '"enabled"', 'Whether beta mode is active (enabled/disabled)'),
  ('auto_approval', '"disabled"', 'Whether new users are auto-approved (enabled/disabled)'),
  ('free_recording_minutes', '20', 'Max recording minutes for free plan'),
  ('digital_recording_minutes', '60', 'Max recording minutes for digital plan'),
  ('legacy_recording_minutes', '120', 'Max recording minutes for legacy plan'),
  ('session_duration_limit', '0', 'Max session duration in minutes (0 = no limit)');

-- Add admin access policies for stories and story_groups for admin reads
CREATE POLICY "Admins can read all stories"
  ON public.stories FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can read all story_groups"
  ON public.story_groups FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
