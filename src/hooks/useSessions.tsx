import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Tables } from '@/integrations/supabase/types';

/**
 * Session type from database
 * 
 * TITLE HIERARCHY for chapters/sessions:
 * - Session.title: User-editable title (highest priority when displaying)
 * - Chapter.suggested_cover_title: AI-suggested title
 * - Session.story_anchor: The prompt/question used to start the recording
 * - Chapter.title: AI-generated chapter title
 * - Fallback: "Recording {date}"
 * 
 * Data Hierarchy:
 * User -> Story Group (Book) -> Session (Chapter Recording) -> Chapter
 * 
 * Sessions belong to a Story Group and contain:
 * - recordings (audio clips)
 * - turns (conversation)
 * - chapters (generated content)
 */
export type Session = Tables<'sessions'>;

export interface DeleteSessionResult {
  success: boolean;
  deletedCounts: {
    session: number;
    chapters: number;
    recordings: number;
    transcripts: number;
    turns: number;
    images: number;
    audioFiles: number;
    imageFiles: number;
  };
  errors: string[];
}

export function useSessions(storyGroupId?: string) {
  const { user, session: authSession } = useAuth();
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
      
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      // Filter by story_group_id if provided
      if (storyGroupId) {
        query = query.eq('story_group_id', storyGroupId);
      }

      const { data, error: fetchError } = await query;

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

  /**
   * Get all sessions by Story Group ID (Book)
   * This is useful for getting all chapter recordings in a book
   */
  const getSessionsByStoryGroupId = async (groupId: string): Promise<Session[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('story_group_id', groupId)
        .order('started_at', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      toast({
        title: "Error loading sessions",
        description: err instanceof Error ? err.message : "Failed to load sessions for this book",
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

  /**
   * Deep delete a session/chapter and ALL its related content:
   * - Chapters
   * - Recordings (+ audio files from storage)
   * - Transcripts
   * - Turns
   * - Images (+ image files from storage)
   */
  const deleteSessionDeep = async (id: string): Promise<DeleteSessionResult> => {
    if (!authSession?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete this chapter.",
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }

    try {
      const response = await supabase.functions.invoke('delete-session-deep', {
        body: { sessionId: id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete chapter');
      }

      const result = response.data as DeleteSessionResult;

      if (result.success) {
        setSessions(prev => prev.filter(session => session.id !== id));
        toast({
          title: "Chapter deleted successfully",
          description: "The chapter and all its content have been permanently removed.",
        });
      } else {
        toast({
          title: "Partial deletion",
          description: `Some items could not be deleted: ${result.errors.join(', ')}`,
          variant: "destructive",
        });
      }

      return result;
    } catch (err) {
      toast({
        title: "Error deleting chapter",
        description: err instanceof Error ? err.message : "Failed to delete chapter",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Legacy delete - now uses deep deletion
  const deleteSession = async (id: string) => {
    return deleteSessionDeep(id);
  };

  useEffect(() => {
    fetchSessions();
  }, [user, storyGroupId]);

  return {
    sessions,
    loading,
    error,
    getSession,
    getSessionsByStoryGroupId,
    updateSession,
    deleteSession,
    deleteSessionDeep,
    refetch: fetchSessions,
  };
}
