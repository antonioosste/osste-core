import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchImagesFromBackend, deleteImageViaBackend, BackendImageResponse } from '@/lib/backend-api';
import { supabase } from '@/integrations/supabase/client';

export interface StoryImage {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  url: string; // This is provided by the backend API with proper signed/public URL
  session_id?: string | null;
  chapter_id?: string | null;
  story_id?: string | null;
  caption?: string | null;
  alt_text?: string | null;
}

interface UseStoryImagesParams {
  sessionId?: string;
  chapterId?: string;
  storyId?: string;
}

export function useStoryImages({ sessionId, chapterId, storyId }: UseStoryImagesParams) {
  const [images, setImages] = useState<StoryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchImages = async () => {
    if (!sessionId && !chapterId && !storyId) return;
    
    setLoading(true);
    try {
      // Get auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      // Fetch from backend API which returns images with proper URLs
      const backendImages = await fetchImagesFromBackend(session.access_token, {
        sessionId,
        chapterId,
        storyId,
      });

      // Map backend response to StoryImage format
      const mappedImages: StoryImage[] = backendImages.map((img) => ({
        id: img.id,
        storage_path: img.storage_path,
        file_name: img.file_name,
        mime_type: img.mime_type,
        url: img.url, // Use URL directly from backend - DO NOT construct manually
        session_id: img.session_id || null,
        chapter_id: img.chapter_id || null,
        story_id: img.story_id || null,
        caption: img.caption || null,
        alt_text: img.alt_text || null,
      }));

      setImages(mappedImages);
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
  }, [sessionId, chapterId, storyId]);

  return {
    images,
    loading,
    refetch: fetchImages,
    deleteImage,
  };
}

