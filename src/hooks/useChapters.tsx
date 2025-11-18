import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Chapter {
  id: string;
  recording_id: string;
  title: string | null;
  summary: string | null;
  overall_summary: string | null;
  order_index: number | null;
  suggested_cover_title: string | null;
  image_hints: any | null;
  quotes: any | null;
  created_at: string | null;
}

export function useChapters(recordingId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChapters = async () => {
    if (!user) {
      setChapters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      if (recordingId) {
        // Fetch chapters for a specific recording
        const { data, error: fetchError } = await (supabase as any)
          .from('chapters')
          .select('*')
          .eq('recording_id', recordingId)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;
        setChapters((data as any) || []);
      } else {
        // Fetch all chapters for the current user's recordings
        const { data: recordings, error: recordingsError } = await (supabase as any)
          .from('recordings')
          .select('id')
          .in('session_id', 
            (supabase as any)
              .from('sessions')
              .select('id')
              .eq('user_id', user.id)
          );

        if (recordingsError) throw recordingsError;

        if (recordings && recordings.length > 0) {
          const recordingIds = recordings.map((r: any) => r.id);
          const { data, error: fetchError } = await (supabase as any)
            .from('chapters')
            .select('*')
            .in('recording_id', recordingIds)
            .order('order_index', { ascending: true });

          if (fetchError) throw fetchError;
          setChapters((data as any) || []);
        } else {
          setChapters([]);
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching chapters:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChapter = async (id: string) => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('chapters')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading chapter",
        description: err instanceof Error ? err.message : "Failed to load chapter",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateChapter = async (id: string, updates: Partial<Chapter>) => {
    try {
      const { data, error: updateError } = await (supabase as any)
        .from('chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setChapters(prev => 
        prev.map(chapter => chapter.id === id ? data as any : chapter)
      );

      toast({
        title: "Chapter updated",
        description: "Your changes have been saved.",
      });
      return data;
    } catch (err) {
      toast({
        title: "Error updating chapter",
        description: err instanceof Error ? err.message : "Failed to update chapter",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [user, recordingId]);

  return {
    chapters,
    loading,
    error,
    getChapter,
    updateChapter,
    refetch: fetchChapters,
  };
}
