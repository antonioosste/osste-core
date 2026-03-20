-- 1. Create the plans table as the single source of truth
CREATE TABLE IF NOT EXISTS public.plans (
  plan_name text PRIMARY KEY,
  minutes_limit integer NOT NULL,
  words_limit integer,
  watermark boolean NOT NULL DEFAULT false,
  pdf_enabled boolean NOT NULL DEFAULT false,
  printing_enabled boolean NOT NULL DEFAULT false,
  photo_uploads_enabled boolean NOT NULL DEFAULT false,
  archive_days integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the plan definitions
INSERT INTO public.plans (plan_name, minutes_limit, words_limit, watermark, pdf_enabled, printing_enabled, photo_uploads_enabled, archive_days) VALUES
  ('free',    20,    2000,  false, false, false, false, 30),
  ('digital', 60,    30000, false, true,  false, true,  NULL),
  ('legacy',  120,   NULL,  false, true,  true,  true,  NULL)
ON CONFLICT (plan_name) DO UPDATE SET
  minutes_limit = EXCLUDED.minutes_limit,
  words_limit = EXCLUDED.words_limit,
  watermark = EXCLUDED.watermark,
  pdf_enabled = EXCLUDED.pdf_enabled,
  printing_enabled = EXCLUDED.printing_enabled,
  photo_uploads_enabled = EXCLUDED.photo_uploads_enabled,
  archive_days = EXCLUDED.archive_days;

-- RLS: anyone can read plans, only admins can modify
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Only admins can modify plans" ON public.plans FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 2. Update the trigger to read from the plans table
CREATE OR REPLACE FUNCTION public.apply_story_group_plan_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p record;
BEGIN
  SELECT * INTO p FROM public.plans WHERE plan_name = NEW.plan;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  NEW.minutes_limit := p.minutes_limit;
  NEW.words_limit := p.words_limit;
  NEW.watermark := p.watermark;
  NEW.pdf_enabled := p.pdf_enabled;
  NEW.printing_enabled := p.printing_enabled;
  NEW.photo_uploads_enabled := p.photo_uploads_enabled;
  NEW.archive_at := CASE
    WHEN p.archive_days IS NOT NULL THEN now() + (p.archive_days || ' days')::interval
    ELSE NULL
  END;

  RETURN NEW;
END;
$$;

-- 3. Create a feature guard function
CREATE OR REPLACE FUNCTION public.can_user_perform(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE p_feature
    WHEN 'upload_photos' THEN
      EXISTS (
        SELECT 1 FROM story_groups sg
        JOIN plans pl ON pl.plan_name = sg.plan
        WHERE sg.user_id = p_user_id AND pl.photo_uploads_enabled = true
      )
    WHEN 'download_pdf' THEN
      EXISTS (
        SELECT 1 FROM story_groups sg
        JOIN plans pl ON pl.plan_name = sg.plan
        WHERE sg.user_id = p_user_id AND pl.pdf_enabled = true
      )
    WHEN 'order_print' THEN
      EXISTS (
        SELECT 1 FROM story_groups sg
        JOIN plans pl ON pl.plan_name = sg.plan
        WHERE sg.user_id = p_user_id AND pl.printing_enabled = true
      )
    ELSE false
  END;
$$;

-- 4. Get plan config for a given plan name (useful from edge functions)
CREATE OR REPLACE FUNCTION public.get_plan_config(p_plan_name text)
RETURNS TABLE(
  plan_name text,
  minutes_limit integer,
  words_limit integer,
  watermark boolean,
  pdf_enabled boolean,
  printing_enabled boolean,
  photo_uploads_enabled boolean,
  archive_days integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.plan_name, p.minutes_limit, p.words_limit, p.watermark,
         p.pdf_enabled, p.printing_enabled, p.photo_uploads_enabled, p.archive_days
  FROM public.plans p
  WHERE p.plan_name = p_plan_name;
$$;