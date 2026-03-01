import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserBilling {
  billing_provider: 'none' | 'stripe' | 'manual';
  stripe_customer_id: string | null;
  plan_type: string;
  subscription_status: string;
}

export function useBilling() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBilling = useCallback(async () => {
    if (!user) {
      setBilling(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('user_billing')
        .select('billing_provider, stripe_customer_id, plan_type, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching billing:', error);
        setBilling(null);
      } else {
        setBilling(data);
      }
    } catch (err) {
      console.error('Error fetching billing:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const isManual = billing?.billing_provider === 'manual';
  const isStripe = billing?.billing_provider === 'stripe';
  const hasStripeCustomer = !!billing?.stripe_customer_id;

  return {
    billing,
    loading,
    isManual,
    isStripe,
    hasStripeCustomer,
    refetch: fetchBilling,
  };
}
