import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ApprovalStatus = 'approved' | 'pending' | 'beta_expired';

export function useApproval() {
  const { user, loading: authLoading } = useAuth();
  const [approved, setApproved] = useState(false);
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setApproved(false);
      setStatus('pending');
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('approved, beta_access_until, user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (!data) {
        setApproved(false);
        setStatus('pending');
      } else if (data.user_type === 'public' || data.user_type === 'admin') {
        // Public and admin users bypass beta approval
        setApproved(true);
        setStatus('approved');
      } else if (!data.approved) {
        // Beta users require approval
        setApproved(false);
        setStatus('pending');
      } else if (data.beta_access_until && new Date(data.beta_access_until) <= new Date()) {
        setApproved(false);
        setStatus('beta_expired');
      } else {
        setApproved(true);
        setStatus('approved');
      }
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  return { approved, status, loading };
}
