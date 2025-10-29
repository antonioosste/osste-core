import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Recording {
  id: string;
  session_id: string | null;
  storage_path: string;
  mime_type: string | null;
  status: string | null;
  language: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  updated_at: string | null;
  transcribed_at: string | null;
  processed_at: string | null;
}

export function useRecordings(sessionId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecordings = async () => {
    if (!user) {
      setRecordings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = (supabase as any)
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setRecordings((data as any) || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRecording = async (id: string) => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('recordings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading recording",
        description: err instanceof Error ? err.message : "Failed to load recording",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from('recordings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setRecordings(prev => prev.filter(recording => recording.id !== id));

      toast({
        title: "Recording deleted",
        description: "The recording has been permanently deleted.",
      });
    } catch (err) {
      toast({
        title: "Error deleting recording",
        description: err instanceof Error ? err.message : "Failed to delete recording",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [user, sessionId]);

  return {
    recordings,
    loading,
    error,
    getRecording,
    deleteRecording,
    refetch: fetchRecordings,
  };
}
