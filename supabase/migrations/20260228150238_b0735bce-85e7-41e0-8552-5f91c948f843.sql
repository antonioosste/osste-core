
-- Remove watermark: set all existing story_groups to watermark = false
UPDATE public.story_groups SET watermark = false WHERE watermark = true;

-- Update the default for watermark column to false
ALTER TABLE public.story_groups ALTER COLUMN watermark SET DEFAULT false;

-- Update the trigger function to never set watermark = true
CREATE OR REPLACE FUNCTION public.apply_story_group_plan_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.plan = 'free' THEN
    NEW.minutes_limit := 20;
    NEW.words_limit := 2000;
    NEW.watermark := false;
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
$function$;
