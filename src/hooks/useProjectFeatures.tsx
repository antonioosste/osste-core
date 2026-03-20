import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEntitlements } from './useEntitlements';

export interface ProjectFeatures {
  plan: string;
  minutesLimit: number | null;
  minutesUsed: number;
  wordsLimit: number | null;
  wordsUsed: number;
  archiveAt: string | null;
  pdfEnabled: boolean;
  printingEnabled: boolean;
  photoUploadsEnabled: boolean;
  isArchived: boolean;
  isRecordingAllowed: boolean;
  remainingMinutes: number;
  isRewriteAllowed: boolean;
}

export function useProjectFeatures(storyGroupId: string | null | undefined) {
  const [features, setFeatures] = useState<ProjectFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const { accountUsage, isRecordingLimitReached } = useEntitlements();

  const fetch = useCallback(async () => {
    if (!storyGroupId) {
      setFeatures(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('story_groups')
        .select('plan, minutes_limit, minutes_used, words_limit, words_used, archive_at, pdf_enabled, printing_enabled, photo_uploads_enabled')
        .eq('id', storyGroupId)
        .maybeSingle();

      if (error || !data) {
        setFeatures(null);
        setLoading(false);
        return;
      }

      const isArchived = data.archive_at ? new Date() > new Date(data.archive_at) : false;
      const remainingMinutes = data.minutes_limit !== null
        ? Math.max(0, data.minutes_limit - Number(data.minutes_used))
        : Infinity;

      setFeatures({
        plan: data.plan,
        minutesLimit: data.minutes_limit,
        minutesUsed: Number(data.minutes_used),
        wordsLimit: data.words_limit,
        wordsUsed: data.words_used,
        archiveAt: data.archive_at,
        pdfEnabled: data.pdf_enabled,
        printingEnabled: data.printing_enabled,
        photoUploadsEnabled: data.photo_uploads_enabled,
        isArchived,
        isRecordingAllowed: !isArchived && !isRecordingLimitReached && remainingMinutes > 0,
        remainingMinutes,
        isRewriteAllowed: data.words_limit === null || data.words_used < data.words_limit,
      });
    } catch (err) {
      console.error('Error fetching project features:', err);
    } finally {
      setLoading(false);
    }
  }, [storyGroupId, isRecordingLimitReached]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { features, loading, refetch: fetch };
}
