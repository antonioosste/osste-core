import { useState, useEffect } from 'react';
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

export function useEntitlements() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntitlements(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setEntitlements(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const isRecordingLimitReached = entitlements
    ? entitlements.minutes_used >= entitlements.minutes_limit
    : false;

  return { entitlements, loading, isRecordingLimitReached };
}
