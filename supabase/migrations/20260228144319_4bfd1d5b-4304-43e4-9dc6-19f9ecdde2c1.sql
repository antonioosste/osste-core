
-- Phase 2: Add plan column to story_groups
ALTER TABLE public.story_groups
  ADD COLUMN plan text NOT NULL DEFAULT 'free';

-- Phase 3: Add project-level entitlement fields
ALTER TABLE public.story_groups
  ADD COLUMN minutes_limit integer DEFAULT 20,
  ADD COLUMN minutes_used numeric NOT NULL DEFAULT 0,
  ADD COLUMN words_limit integer DEFAULT 2000,
  ADD COLUMN words_used integer NOT NULL DEFAULT 0,
  ADD COLUMN watermark boolean NOT NULL DEFAULT true,
  ADD COLUMN archive_at timestamptz NULL,
  ADD COLUMN pdf_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN printing_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN photo_uploads_enabled boolean NOT NULL DEFAULT false;

-- Phase 4: Function to apply plan defaults on story_group creation
CREATE OR REPLACE FUNCTION public.apply_story_group_plan_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan = 'free' THEN
    NEW.minutes_limit := 20;
    NEW.words_limit := 2000;
    NEW.watermark := true;
    NEW.pdf_enabled := false;
    NEW.printing_enabled := false;
    NEW.photo_uploads_enabled := false;
    NEW.archive_at := now() + interval '30 days';
  ELSIF NEW.plan = 'digital' THEN
    NEW.minutes_limit := 60;
    NEW.words_limit := 30000;
    NEW.watermark := false;
    NEW.pdf_enabled := true;
    NEW.printing_enabled := false;
    NEW.photo_uploads_enabled := false;
    NEW.archive_at := NULL;
  ELSIF NEW.plan = 'legacy' THEN
    NEW.minutes_limit := 120;
    NEW.words_limit := NULL;
    NEW.watermark := false;
    NEW.pdf_enabled := true;
    NEW.printing_enabled := true;
    NEW.photo_uploads_enabled := true;
    NEW.archive_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_story_group_plan_defaults
BEFORE INSERT OR UPDATE OF plan ON public.story_groups
FOR EACH ROW
EXECUTE FUNCTION public.apply_story_group_plan_defaults();

-- Phase 7: Safe migration for existing story_groups
-- Default: all existing books start as free
UPDATE public.story_groups SET plan = 'free';

-- Upgrade to digital if user has used > 20 minutes
UPDATE public.story_groups sg
SET plan = 'digital'
FROM public.entitlements e
WHERE sg.user_id = e.user_id AND e.minutes_used > 20;

-- Upgrade to legacy if user has print orders
UPDATE public.story_groups sg
SET plan = 'legacy'
WHERE sg.user_id IN (
  SELECT DISTINCT user_id FROM public.print_orders WHERE status != 'pending'
);
