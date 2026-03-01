import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserBilling {
  provider: string;
  stripe_customer_id: string | null;
  plan: string;
  is_manual: boolean;
  payment_status: string | null;
  created_at: string;
}

export function useBilling() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBilling = useCallback(async () => {
    if (!user) { setBilling(null); setLoading(false); return; }
    try {
      const { data, error } = await (supabase as any)
        .from('user_billing')
        .select('provider, stripe_customer_id, plan, is_manual, payment_status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) { console.error('Error fetching billing:', error); setBilling(null); }
      else setBilling(data);
    } catch (err) { console.error('Error fetching billing:', err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  const isManual = billing?.is_manual === true;
  const isStripe = billing?.provider === 'stripe' && !!billing?.stripe_customer_id;
  const hasStripeCustomer = !!billing?.stripe_customer_id;
  const hasPaidPlan = !!billing;

  return { billing, loading, isManual, isStripe, hasStripeCustomer, hasPaidPlan, refetch: fetchBilling };
}
