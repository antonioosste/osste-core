import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Entitlements {
  id: string;
  user_id: string;
  minutes_limit: number;
  minutes_used: number;
  tokens_limit: number;
  max_books: number;
  can_record: boolean;
  can_generate_book: boolean;
  can_download_pdf: boolean;
}

export interface AccountUsage {
  /** Highest plan across all books: 'free' | 'digital' | 'legacy' */
  accountPlan: string;
  /** Total seconds recorded across ALL books */
  totalRecordedSeconds: number;
  /** Account-level limit in seconds (Free=1200, Paid=3600) */
  recordingLimitSeconds: number;
  /** Minutes used (derived) */
  minutesUsed: number;
  /** Minutes limit (derived) */
  minutesLimit: number;
  /** Minutes remaining */
  minutesRemaining: number;
  /** Whether account recording cap is reached */
  isRecordingLimitReached: boolean;
}

export function useEntitlements() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [accountUsage, setAccountUsage] = useState<AccountUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setEntitlements(null);
      setAccountUsage(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch entitlements, account plan, total recorded seconds, and limit in parallel
      const supabaseAny = supabase as any;
      const [entResult, planResult, usageResult, limitResult] = await Promise.all([
        supabase
          .from('entitlements')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabaseAny.rpc('get_user_account_plan', { p_user_id: user.id }),
        supabaseAny.rpc('get_user_total_recorded_seconds', { p_user_id: user.id }),
        supabaseAny.rpc('get_user_recording_limit_seconds', { p_user_id: user.id }),
      ]);

      setEntitlements(entResult.data);

      const accountPlan = (planResult.data as string) || 'free';
      const totalRecordedSeconds = Number(usageResult.data) || 0;
      const recordingLimitSeconds = Number(limitResult.data) || 1200;

      const minutesUsed = Math.round(totalRecordedSeconds / 60);
      const minutesLimit = Math.round(recordingLimitSeconds / 60);
      const minutesRemaining = Math.max(0, minutesLimit - minutesUsed);

      setAccountUsage({
        accountPlan,
        totalRecordedSeconds,
        recordingLimitSeconds,
        minutesUsed,
        minutesLimit,
        minutesRemaining,
        isRecordingLimitReached: totalRecordedSeconds >= recordingLimitSeconds,
      });
    } catch (err) {
      console.error('Error fetching entitlements:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isRecordingLimitReached = accountUsage?.isRecordingLimitReached ?? false;

  return {
    entitlements,
    accountUsage,
    loading,
    isRecordingLimitReached,
    refetch: fetchAll,
  };
}
