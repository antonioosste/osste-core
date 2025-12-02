import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

/**
 * Story interface - aligned with new backend schema
 * 
 * Key change: Stories are linked to story_group_id (Book), not session_id
 * Each Story Group has ONE Story that aggregates content from all sessions
 */
export interface Story {
  id: string;
  story_group_id: string | null;
  title: string | null;
  raw_text: string | null;
  edited_text: string | null;
  style_instruction: string | null;
  approved: boolean | null;
  order_index: number | null;
  created_at: string | null;
}

export function useStories(storyGroupId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStories = async () => {
    if (!user) {
      setStories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by story_group_id if provided
      if (storyGroupId) {
        query = query.eq('story_group_id', storyGroupId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setStories(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a single story by ID
   */
  const getStory = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading story",
        description: err instanceof Error ? err.message : "Failed to load story",
        variant: "destructive",
      });
      throw err;
    }
  };

  /**
   * Get story by Story Group ID (Book)
   * This is the primary way to fetch a story in the new schema
   * 
   * @param groupId - The story_group_id (Book ID)
   */
  const getStoryByStoryGroupId = async (groupId: string): Promise<Story | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('story_group_id', groupId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading story",
        description: err instanceof Error ? err.message : "Failed to load story for this book",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateStory = async (id: string, updates: Partial<Story>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setStories(prev => 
        prev.map(story => story.id === id ? data : story)
      );

      toast({
        title: "Story updated",
        description: "Your changes have been saved.",
      });
      return data;
    } catch (err) {
      toast({
        title: "Error updating story",
        description: err instanceof Error ? err.message : "Failed to update story",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteStory = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setStories(prev => prev.filter(story => story.id !== id));

      toast({
        title: "Story deleted",
        description: "The story has been permanently deleted.",
      });
    } catch (err) {
      toast({
        title: "Error deleting story",
        description: err instanceof Error ? err.message : "Failed to delete story",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchStories();
  }, [user, storyGroupId]);

  return {
    stories,
    loading,
    error,
    getStory,
    getStoryByStoryGroupId,
    updateStory,
    deleteStory,
    refetch: fetchStories,
  };
}
