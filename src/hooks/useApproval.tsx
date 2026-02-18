import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useApproval() {
  const { user, loading: authLoading } = useAuth();
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setApproved(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('approved, beta_access_until')
        .eq('id', user.id)
        .maybeSingle();

      if (!data) {
        setApproved(false);
      } else {
        const isApproved = data.approved === true;
        const betaOk = !data.beta_access_until || new Date(data.beta_access_until) > new Date();
        setApproved(isApproved && betaOk);
      }
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  return { approved, loading };
}
