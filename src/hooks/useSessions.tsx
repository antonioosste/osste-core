import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type Session = Tables<'sessions'>;

export function useSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSessions(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSession = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading session",
        description: err instanceof Error ? err.message : "Failed to load session",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateSession = async (id: string, updates: Partial<Session>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setSessions(prev => 
        prev.map(session => session.id === id ? data : session)
      );

      toast({
        title: "Session updated",
        description: "Your changes have been saved.",
      });
      return data;
    } catch (err) {
      toast({
        title: "Error updating session",
        description: err instanceof Error ? err.message : "Failed to update session",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSessions(prev => prev.filter(session => session.id !== id));

      toast({
        title: "Session deleted",
        description: "The session has been permanently deleted.",
      });
    } catch (err) {
      toast({
        title: "Error deleting session",
        description: err instanceof Error ? err.message : "Failed to delete session",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    getSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  };
}
