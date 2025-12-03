import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteResult {
  success: boolean;
  deletedCounts: {
    storyGroup: number;
    stories: number;
    sessions: number;
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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client for user auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get storyGroupId from request body
    const { storyGroupId } = await req.json();
    
    if (!storyGroupId) {
      return new Response(
        JSON.stringify({ error: 'Missing storyGroupId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-book-deep] Starting deep deletion for story_group: ${storyGroupId}, user: ${user.id}`);

    // Use service role for deletions to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify ownership
    const { data: storyGroup, error: sgError } = await supabase
      .from('story_groups')
      .select('id, user_id, title')
      .eq('id', storyGroupId)
      .single();

    if (sgError || !storyGroup) {
      return new Response(
        JSON.stringify({ error: 'Story group not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (storyGroup.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You do not own this book' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: DeleteResult = {
      success: false,
      deletedCounts: {
        storyGroup: 0,
        stories: 0,
        sessions: 0,
        chapters: 0,
        recordings: 0,
        transcripts: 0,
        turns: 0,
        images: 0,
        audioFiles: 0,
        imageFiles: 0,
      },
      errors: [],
    };

    // 1. Get all sessions for this story group
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('story_group_id', storyGroupId);
    
    const sessionIds = sessions?.map(s => s.id) || [];
    console.log(`[delete-book-deep] Found ${sessionIds.length} sessions`);

    // 2. Get all stories for this story group
    const { data: storiesData } = await supabase
      .from('stories')
      .select('id')
      .eq('story_group_id', storyGroupId);
    
    const storyIds = storiesData?.map(s => s.id) || [];
    console.log(`[delete-book-deep] Found ${storyIds.length} stories`);

    // 3. Get all chapters for these sessions
    let chapterIds: string[] = [];
    if (sessionIds.length > 0) {
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('id')
        .in('session_id', sessionIds);
      chapterIds = chaptersData?.map(c => c.id) || [];
    }
    console.log(`[delete-book-deep] Found ${chapterIds.length} chapters`);

    // 4. Get all recordings for these sessions
    let recordingIds: string[] = [];
    let recordingPaths: string[] = [];
    if (sessionIds.length > 0) {
      const { data: recordingsData } = await supabase
        .from('recordings')
        .select('id, storage_path')
        .in('session_id', sessionIds);
      recordingIds = recordingsData?.map(r => r.id) || [];
      recordingPaths = recordingsData?.map(r => r.storage_path).filter(Boolean) || [];
    }
    console.log(`[delete-book-deep] Found ${recordingIds.length} recordings`);

    // 5. Get all turns for these sessions
    let turnIds: string[] = [];
    if (sessionIds.length > 0) {
      const { data: turnsData } = await supabase
        .from('turns')
        .select('id')
        .in('session_id', sessionIds);
      turnIds = turnsData?.map(t => t.id) || [];
    }
    console.log(`[delete-book-deep] Found ${turnIds.length} turns`);

    // 6. Get all story_images linked to this book's content
    let imagePaths: string[] = [];
    const imageConditions = [];
    
    // Images linked to stories
    if (storyIds.length > 0) {
      const { data: storyImages } = await supabase
        .from('story_images')
        .select('id, storage_path, thumbnail_path')
        .in('story_id', storyIds);
      if (storyImages) {
        result.deletedCounts.images += storyImages.length;
        imagePaths.push(...storyImages.map(i => i.storage_path).filter(Boolean));
        imagePaths.push(...storyImages.map(i => i.thumbnail_path).filter(Boolean) as string[]);
      }
    }
    
    // Images linked to chapters
    if (chapterIds.length > 0) {
      const { data: chapterImages } = await supabase
        .from('story_images')
        .select('id, storage_path, thumbnail_path')
        .in('chapter_id', chapterIds);
      if (chapterImages) {
        result.deletedCounts.images += chapterImages.length;
        imagePaths.push(...chapterImages.map(i => i.storage_path).filter(Boolean));
        imagePaths.push(...chapterImages.map(i => i.thumbnail_path).filter(Boolean) as string[]);
      }
    }
    
    // Images linked to turns
    if (turnIds.length > 0) {
      const { data: turnImages } = await supabase
        .from('story_images')
        .select('id, storage_path, thumbnail_path')
        .in('turn_id', turnIds);
      if (turnImages) {
        result.deletedCounts.images += turnImages.length;
        imagePaths.push(...turnImages.map(i => i.storage_path).filter(Boolean));
        imagePaths.push(...turnImages.map(i => i.thumbnail_path).filter(Boolean) as string[]);
      }
    }

    console.log(`[delete-book-deep] Found ${imagePaths.length} image files to delete`);

    // ===== BEGIN DELETION (order matters due to FK constraints) =====

    // ===== BEGIN DELETION (strict order due to FK constraints) =====
    // Order: transcripts -> story_images -> turns -> chapters -> recordings -> sessions -> story_embeddings -> stories -> story_group

    // 1. Delete transcripts (linked to recordings)
    if (recordingIds.length > 0) {
      console.log(`[delete-book-deep] Deleting transcripts for ${recordingIds.length} recordings`);
      const { error } = await supabase
        .from('transcripts')
        .delete()
        .in('recording_id', recordingIds);
      if (error) {
        console.error(`[delete-book-deep] Error deleting transcripts:`, error);
        result.errors.push(`Transcripts: ${error.message}`);
      }
    }

    // 2. Delete story_images (linked to stories, chapters, turns)
    if (storyIds.length > 0) {
      console.log(`[delete-book-deep] Deleting images for ${storyIds.length} stories`);
      const { error } = await supabase.from('story_images').delete().in('story_id', storyIds);
      if (error) console.error(`[delete-book-deep] Error deleting story images:`, error);
    }
    if (chapterIds.length > 0) {
      console.log(`[delete-book-deep] Deleting images for ${chapterIds.length} chapters`);
      const { error } = await supabase.from('story_images').delete().in('chapter_id', chapterIds);
      if (error) console.error(`[delete-book-deep] Error deleting chapter images:`, error);
    }
    if (turnIds.length > 0) {
      console.log(`[delete-book-deep] Deleting images for ${turnIds.length} turns`);
      const { error } = await supabase.from('story_images').delete().in('turn_id', turnIds);
      if (error) console.error(`[delete-book-deep] Error deleting turn images:`, error);
    }

    // 3. Delete turns
    if (sessionIds.length > 0) {
      console.log(`[delete-book-deep] Deleting turns for ${sessionIds.length} sessions`);
      const { error } = await supabase
        .from('turns')
        .delete()
        .in('session_id', sessionIds);
      if (error) {
        console.error(`[delete-book-deep] Error deleting turns:`, error);
        result.errors.push(`Turns: ${error.message}`);
      }
    }

    // 4. Delete chapters
    if (sessionIds.length > 0) {
      console.log(`[delete-book-deep] Deleting chapters for ${sessionIds.length} sessions`);
      const { error } = await supabase
        .from('chapters')
        .delete()
        .in('session_id', sessionIds);
      if (error) {
        console.error(`[delete-book-deep] Error deleting chapters:`, error);
        result.errors.push(`Chapters: ${error.message}`);
      }
    }

    // 5. Delete recordings
    if (sessionIds.length > 0) {
      console.log(`[delete-book-deep] Deleting recordings for ${sessionIds.length} sessions`);
      const { error } = await supabase
        .from('recordings')
        .delete()
        .in('session_id', sessionIds);
      if (error) {
        console.error(`[delete-book-deep] Error deleting recordings:`, error);
        result.errors.push(`Recordings: ${error.message}`);
      }
    }

    // 6. Delete sessions - CRITICAL: Must happen before story_group deletion
    if (sessionIds.length > 0) {
      console.log(`[delete-book-deep] Deleting ${sessionIds.length} sessions`);
      const { error } = await supabase
        .from('sessions')
        .delete()
        .in('id', sessionIds);
      if (error) {
        console.error(`[delete-book-deep] Error deleting sessions:`, error);
        result.errors.push(`Sessions: ${error.message}`);
        // If sessions fail to delete, we cannot delete the story_group
        throw new Error(`Cannot delete book: sessions deletion failed - ${error.message}`);
      }
      result.deletedCounts.sessions = sessionIds.length;
    }

    // 7. Delete story embeddings (if any)
    if (storyIds.length > 0) {
      console.log(`[delete-book-deep] Deleting story embeddings`);
      const { error } = await supabase.from('story_embeddings').delete().in('story_id', storyIds);
      if (error) console.error(`[delete-book-deep] Error deleting story embeddings:`, error);
    }

    // 8. Delete stories - CRITICAL: Must happen before story_group deletion
    console.log(`[delete-book-deep] Deleting stories for story_group ${storyGroupId}`);
    {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('story_group_id', storyGroupId);
      if (error) {
        console.error(`[delete-book-deep] Error deleting stories:`, error);
        result.errors.push(`Stories: ${error.message}`);
      } else {
        result.deletedCounts.stories = storyIds.length;
      }
    }

    // 9. Delete story_group - FINAL step
    console.log(`[delete-book-deep] Deleting story_group ${storyGroupId}`);
    {
      const { error } = await supabase
        .from('story_groups')
        .delete()
        .eq('id', storyGroupId);
      if (error) {
        console.error(`[delete-book-deep] Error deleting story_group:`, error);
        result.errors.push(`StoryGroup: ${error.message}`);
      } else {
        result.deletedCounts.storyGroup = 1;
      }
    }

    // ===== DELETE STORAGE FILES =====

    // Delete audio files from recordings bucket
    if (recordingPaths.length > 0) {
      const { error: audioError } = await supabase.storage
        .from('recordings')
        .remove(recordingPaths);
      if (audioError) {
        result.errors.push(`Audio files: ${audioError.message}`);
      } else {
        result.deletedCounts.audioFiles = recordingPaths.length;
      }
    }

    // Delete image files from story_images bucket
    if (imagePaths.length > 0) {
      const { error: imageError } = await supabase.storage
        .from('story_images')
        .remove(imagePaths);
      if (imageError) {
        result.errors.push(`Image files: ${imageError.message}`);
      } else {
        result.deletedCounts.imageFiles = imagePaths.length;
      }
    }

    result.success = result.errors.length === 0;

    console.log(`[delete-book-deep] Deletion complete:`, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delete-book-deep] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
