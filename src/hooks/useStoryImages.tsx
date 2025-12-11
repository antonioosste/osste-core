import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { listStoryImages, deleteImageViaBackend, BackendImageResponse } from '@/lib/backend-api';
import { supabase } from '@/integrations/supabase/client';

/**
 * StoryImage interface - aligned with new backend schema
 * 
 * IMPORTANT: session_id is no longer stored in the story_images table.
 * Images must be linked to chapter_id, turn_id, or story_id.
 * session_id can still be used for filtering (backend finds images via chapters/turns).
 */
export interface StoryImage {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  url: string; // This is provided by the backend API with proper signed/public URL
  chapter_id?: string | null;
  turn_id?: string | null;
  story_id?: string | null;
  caption?: string | null;
  alt_text?: string | null;
}

interface UseStoryImagesParams {
  sessionId?: string;  // For filtering - backend finds images via chapters/turns
  chapterId?: string;
  storyId?: string;
  turnId?: string;
  storyGroupId?: string; // New: fetch all images for all sessions in this story group
}

export function useStoryImages({ sessionId, chapterId, storyId, turnId, storyGroupId }: UseStoryImagesParams) {
  const [images, setImages] = useState<StoryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchImages = async () => {
    if (!sessionId && !chapterId && !storyId && !turnId && !storyGroupId) return;
    
    setLoading(true);
    try {
      // Get auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      let allImages: StoryImage[] = [];

      // If storyGroupId is provided, fetch images for all sessions in the group
      if (storyGroupId) {
        // Get all sessions in this story group
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id')
          .eq('story_group_id', storyGroupId);

        if (sessionsError) {
          throw sessionsError;
        }

        // Fetch images for each session
        const imagePromises = (sessions || []).map(async (sess) => {
          const backendImages = await listStoryImages(session.access_token, {
            sessionId: sess.id,
          });
          return backendImages;
        });

        const sessionImageArrays = await Promise.all(imagePromises);
        const sessionImages = sessionImageArrays.flat();

        // Also fetch images directly linked to the story
        if (storyId) {
          const storyImages = await listStoryImages(session.access_token, {
            storyId,
          });
          sessionImages.push(...storyImages);
        }

        // Deduplicate by id
        const uniqueMap = new Map<string, BackendImageResponse>();
        sessionImages.forEach(img => uniqueMap.set(img.id, img));
        
        allImages = Array.from(uniqueMap.values()).map((img) => ({
          id: img.id,
          storage_path: img.storage_path,
          file_name: img.file_name,
          mime_type: img.mime_type,
          url: img.url,
          chapter_id: img.chapter_id || null,
          turn_id: img.turn_id || null,
          story_id: img.story_id || null,
          caption: img.caption || null,
          alt_text: img.alt_text || null,
        }));
      } else {
        // Original behavior for single session/chapter/story/turn
        const backendImages = await listStoryImages(session.access_token, {
          sessionId,
          chapterId,
          storyId,
          turnId,
        });

        allImages = backendImages.map((img) => ({
          id: img.id,
          storage_path: img.storage_path,
          file_name: img.file_name,
          mime_type: img.mime_type,
          url: img.url,
          chapter_id: img.chapter_id || null,
          turn_id: img.turn_id || null,
          story_id: img.story_id || null,
          caption: img.caption || null,
          alt_text: img.alt_text || null,
        }));
      }

      setImages(allImages);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Failed to load images',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string, storagePath: string) => {
    try {
      // Get auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      // Delete via backend API - backend handles storage cleanup
      await deleteImageViaBackend(session.access_token, imageId);

      // Update local state
      setImages((prev) => prev.filter((img) => img.id !== imageId));

      toast({
        title: 'Image deleted',
        description: 'Image has been removed successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Failed to delete image',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchImages();
  }, [sessionId, chapterId, storyId, turnId, storyGroupId]);

  return {
    images,
    loading,
    refetch: fetchImages,
    deleteImage,
  };
}
