import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type Feature = 'upload_photos' | 'download_pdf' | 'order_print';

/**
 * Checks whether the current user can perform a specific feature
 * by calling the server-side `can_user_perform` RPC.
 */
export function useFeatureGuard(feature: Feature) {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any).rpc('can_user_perform', {
        p_user_id: user.id,
        p_feature: feature,
      });

      if (error) {
        console.error('Feature guard check failed:', error);
        setAllowed(false);
      } else {
        setAllowed(!!data);
      }
    } catch (err) {
      console.error('Feature guard error:', err);
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }, [user, feature]);

  useEffect(() => {
    check();
  }, [check]);

  return { allowed, loading, recheck: check };
}
