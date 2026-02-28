
-- Add trigger for plan updates so defaults are applied when plan changes
CREATE TRIGGER trg_story_group_plan_update
  BEFORE UPDATE OF plan ON public.story_groups
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.apply_story_group_plan_defaults();
