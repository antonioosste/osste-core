import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Transcript {
  id: string;
  recording_id: string;
  text: string | null;
  language: string | null;
  model_used: string | null;
  word_count: number | null;
  created_at: string | null;
}

export function useTranscripts(recordingId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTranscripts = async () => {
    if (!user) {
      setTranscripts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = (supabase as any)
        .from('transcripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (recordingId) {
        query = query.eq('recording_id', recordingId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTranscripts((data as any) || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching transcripts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTranscript = async (id: string) => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('transcripts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading transcript",
        description: err instanceof Error ? err.message : "Failed to load transcript",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchTranscripts();
  }, [user, recordingId]);

  return {
    transcripts,
    loading,
    error,
    getTranscript,
    refetch: fetchTranscripts,
  };
}
