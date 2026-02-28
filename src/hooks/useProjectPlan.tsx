import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type PlanTier = 'free' | 'digital' | 'legacy';

export interface ProjectPlan {
  plan: PlanTier;
  minutes_limit: number | null;
  minutes_used: number;
  words_limit: number | null;
  words_used: number;
  archive_at: string | null;
  pdf_enabled: boolean;
  printing_enabled: boolean;
  photo_uploads_enabled: boolean;
}

export function useProjectPlan() {
  const { toast } = useToast();

  const getProjectPlan = async (storyGroupId: string): Promise<ProjectPlan | null> => {
    const { data, error } = await supabase
      .from('story_groups')
      .select('plan, minutes_limit, minutes_used, words_limit, words_used, archive_at, pdf_enabled, printing_enabled, photo_uploads_enabled')
      .eq('id', storyGroupId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project plan:', error);
      return null;
    }

    return data as ProjectPlan | null;
  };

  const isRecordingAllowed = (plan: ProjectPlan): boolean => {
    if (plan.minutes_limit === null) return true;
    return plan.minutes_used < plan.minutes_limit;
  };

  const getRemainingMinutes = (plan: ProjectPlan): number => {
    if (plan.minutes_limit === null) return Infinity;
    return Math.max(0, plan.minutes_limit - Number(plan.minutes_used));
  };

  const isRewriteAllowed = (plan: ProjectPlan): boolean => {
    if (plan.words_limit === null) return true;
    return plan.words_used < plan.words_limit;
  };

  const isArchived = (plan: ProjectPlan): boolean => {
    if (!plan.archive_at) return false;
    return new Date() > new Date(plan.archive_at);
  };

  const initiateUpgrade = async (storyGroupId: string, targetPlan: PlanTier) => {
    if (targetPlan === 'free') return;

    try {
      const { data, error } = await supabase.functions.invoke('create-plan-checkout', {
        body: { plan: targetPlan, story_group_id: storyGroupId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast({
        title: 'Checkout Error',
        description: err instanceof Error ? err.message : 'Failed to start checkout',
        variant: 'destructive',
      });
    }
  };

  return {
    getProjectPlan,
    isRecordingAllowed,
    getRemainingMinutes,
    isRewriteAllowed,
    isArchived,
    initiateUpgrade,
  };
}
