import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type Turn = Tables<'turns'>;

export function useTurns(sessionId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTurns = async () => {
    if (!user) {
      setTurns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('turns')
        .select('*')
        .order('turn_index', { ascending: true });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTurns(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching turns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurns();
  }, [user, sessionId]);

  return {
    turns,
    loading,
    error,
    refetch: fetchTurns,
  };
}
