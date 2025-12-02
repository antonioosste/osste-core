import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface StoryGroup {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string | null;
}

export function useStoryGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStoryGroups = async () => {
    if (!user) {
      setStoryGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('story_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setStoryGroups(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching story groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStoryGroup = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('story_groups')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      toast({
        title: "Error loading story group",
        description: err instanceof Error ? err.message : "Failed to load story group",
        variant: "destructive",
      });
      throw err;
    }
  };

  const createStoryGroup = async (title: string, description?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a story group.",
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }

    try {
      const { data, error: insertError } = await supabase
        .from('story_groups')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setStoryGroups(prev => [data, ...prev]);

      toast({
        title: "Book created",
        description: `"${title}" is ready for your stories.`,
      });
      return data;
    } catch (err) {
      toast({
        title: "Error creating story group",
        description: err instanceof Error ? err.message : "Failed to create story group",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateStoryGroup = async (id: string, updates: Partial<StoryGroup>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('story_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setStoryGroups(prev =>
        prev.map(group => group.id === id ? data : group)
      );

      toast({
        title: "Book updated",
        description: "Your changes have been saved.",
      });
      return data;
    } catch (err) {
      toast({
        title: "Error updating story group",
        description: err instanceof Error ? err.message : "Failed to update story group",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteStoryGroup = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('story_groups')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setStoryGroups(prev => prev.filter(group => group.id !== id));

      toast({
        title: "Book deleted",
        description: "The book and all its content have been removed.",
      });
    } catch (err) {
      toast({
        title: "Error deleting story group",
        description: err instanceof Error ? err.message : "Failed to delete story group",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchStoryGroups();
  }, [user]);

  return {
    storyGroups,
    loading,
    error,
    getStoryGroup,
    createStoryGroup,
    updateStoryGroup,
    deleteStoryGroup,
    refetch: fetchStoryGroups,
  };
}
