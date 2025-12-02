import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

/**
 * Chapter interface - aligned with new backend schema
 * 
 * Key change: Chapters are linked to session_id (not recording_id)
 * Each Session (Chapter Recording) can have one generated Chapter
 */
export interface Chapter {
  id: string;
  session_id: string | null;
  title: string | null;
  summary: string | null;
  overall_summary: string | null;
  raw_transcript: string | null;
  polished_text: string | null;
  order_index: number | null;
  suggested_cover_title: string | null;
  image_hints: any | null;
  quotes: any | null;
  created_at: string | null;
}

export function useChapters(sessionId?: string) {
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
      
      if (sessionId) {
        // Fetch chapter(s) for a specific session
        const { data, error: fetchError } = await supabase
          .from('chapters')
          .select('*')
          .eq('session_id', sessionId)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;
        setChapters(data || []);
      } else {
        // Fetch all chapters for user's sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id')
          .eq('user_id', user.id);

        if (sessionsError) throw sessionsError;

        if (!sessions || sessions.length === 0) {
          setChapters([]);
          return;
        }

        const sessionIds = sessions.map(s => s.id);

        // Fetch chapters linked to user's sessions
        const { data, error: fetchError } = await supabase
          .from('chapters')
          .select('*')
          .in('session_id', sessionIds)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;
        setChapters(data || []);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching chapters:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a single chapter by ID
   */
  const getChapter = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
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

  /**
   * Get chapter by session ID
   * In the new schema, each session has one chapter
   */
  const getChapterBySessionId = async (sessId: string): Promise<Chapter | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('chapters')
        .select('*')
        .eq('session_id', sessId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading chapter",
        description: err instanceof Error ? err.message : "Failed to load chapter for this session",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateChapter = async (id: string, updates: Partial<Chapter>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setChapters(prev => 
        prev.map(chapter => chapter.id === id ? data : chapter)
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
  }, [user, sessionId]);

  return {
    chapters,
    loading,
    error,
    getChapter,
    getChapterBySessionId,
    updateChapter,
    refetch: fetchChapters,
  };
}
