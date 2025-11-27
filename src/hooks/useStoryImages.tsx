import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoryImage {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  url: string;
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
      let query = supabase.from('story_images').select('*');
      
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }
      if (storyId) {
        query = query.eq('story_id', storyId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const imagesWithUrls = await Promise.all(
          data.map(async (img) => {
            let url = '';
            
            // Clean the storage_path by removing bucket name prefix if present
            let cleanPath = img.storage_path;
            if (cleanPath.startsWith('story_images/')) {
              cleanPath = cleanPath.substring('story_images/'.length);
            }

            try {
              // Try signed URL first
              const { data: signedData, error: signedError } = await supabase.storage
                .from('story_images')
                .createSignedUrl(cleanPath, 86400); // 24 hours

              if (signedData?.signedUrl) {
                url = signedData.signedUrl;
              } else if (!signedError) {
                // Fallback to public URL
                const { data: publicData } = supabase.storage
                  .from('story_images')
                  .getPublicUrl(cleanPath);
                url = publicData.publicUrl;
              }
            } catch (urlError) {
              console.error('Error creating URL for image:', urlError);
            }

            return {
              ...img,
              url,
            };
          })
        );

        setImages(imagesWithUrls);
      }
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
      // Clean the storage_path
      let cleanPath = storagePath;
      if (cleanPath.startsWith('story_images/')) {
        cleanPath = cleanPath.substring('story_images/'.length);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('story_images')
        .remove([cleanPath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw new Error('Failed to delete image from storage');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('story_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw new Error('Failed to delete image from database');
      }

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
