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
      // First, get all recordings for this session to delete storage files
      const { data: recordings } = await supabase
        .from('recordings')
        .select('storage_path')
        .eq('session_id', id);

      // Delete storage files for recordings
      if (recordings && recordings.length > 0) {
        const filePaths = recordings.map(r => r.storage_path);
        const { error: storageError } = await supabase.storage
          .from('recordings')
          .remove(filePaths);
        
        if (storageError) {
          console.error('Error deleting recording files:', storageError);
        }
      }

      // Delete story images from storage
      const { data: storyImages } = await supabase
        .from('story_images')
        .select('storage_path')
        .eq('session_id', id);

      if (storyImages && storyImages.length > 0) {
        const imagePaths = storyImages.map(img => img.storage_path);
        const { error: imageStorageError } = await supabase.storage
          .from('story_media')
          .remove(imagePaths);
        
        if (imageStorageError) {
          console.error('Error deleting story images:', imageStorageError);
        }
      }

      // Delete in order due to foreign key constraints:
      // 1. Delete turns (references session)
      await supabase.from('turns').delete().eq('session_id', id);
      
      // 2. Delete transcripts and chapters that reference this session via recordings
      const { data: sessionRecordings } = await supabase
        .from('recordings')
        .select('id')
        .eq('session_id', id);
      
      if (sessionRecordings && sessionRecordings.length > 0) {
        const recordingIds = sessionRecordings.map(r => r.id);
        await supabase.from('transcripts').delete().in('recording_id', recordingIds);
        await supabase.from('chapters').delete().in('recording_id', recordingIds);
      }

      // 3. Also delete any chapters that reference this session directly
      await supabase.from('chapters').delete().eq('session_id', id);

      // 4. Delete story images
      await supabase.from('story_images').delete().eq('session_id', id);
      
      // 5. Delete stories
      await supabase.from('stories').delete().eq('session_id', id);
      
      // 6. Delete recordings
      await supabase.from('recordings').delete().eq('session_id', id);

      // 7. Finally delete the session
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSessions(prev => prev.filter(session => session.id !== id));

      toast({
        title: "Session deleted",
        description: "The session and all related data have been permanently deleted.",
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
