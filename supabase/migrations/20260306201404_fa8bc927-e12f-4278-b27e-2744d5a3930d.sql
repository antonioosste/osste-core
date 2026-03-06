-- Update recording limit: Legacy gets 120 minutes (7200 seconds)
CREATE OR REPLACE FUNCTION public.get_user_recording_limit_seconds(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT CASE public.get_user_account_plan(p_user_id)
    WHEN 'legacy' THEN 7200
    WHEN 'digital' THEN 3600
    ELSE 1200
  END;
$$;

-- Update plan defaults: Digital now includes photo_uploads, Legacy gets 120 min
CREATE OR REPLACE FUNCTION public.apply_story_group_plan_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
    NEW.photo_uploads_enabled := true;
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