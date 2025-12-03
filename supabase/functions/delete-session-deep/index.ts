import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteResult {
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

    // Get sessionId from request body
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-session-deep] Starting deep deletion for session: ${sessionId}, user: ${user.id}`);

    // Use service role for deletions to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify ownership
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id, title')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (sessionData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You do not own this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: DeleteResult = {
      success: false,
      deletedCounts: {
        session: 0,
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

    // 1. Get all chapters for this session
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('id')
      .eq('session_id', sessionId);
    const chapterIds = chaptersData?.map(c => c.id) || [];
    console.log(`[delete-session-deep] Found ${chapterIds.length} chapters`);

    // 2. Get all recordings for this session
    const { data: recordingsData } = await supabase
      .from('recordings')
      .select('id, storage_path')
      .eq('session_id', sessionId);
    const recordingIds = recordingsData?.map(r => r.id) || [];
    const recordingPaths = recordingsData?.map(r => r.storage_path).filter(Boolean) || [];
    console.log(`[delete-session-deep] Found ${recordingIds.length} recordings`);

    // 3. Get all turns for this session
    const { data: turnsData } = await supabase
      .from('turns')
      .select('id')
      .eq('session_id', sessionId);
    const turnIds = turnsData?.map(t => t.id) || [];
    console.log(`[delete-session-deep] Found ${turnIds.length} turns`);

    // 4. Get all story_images linked to this session's content
    let imagePaths: string[] = [];
    let imageCount = 0;

    // Images linked to chapters
    if (chapterIds.length > 0) {
      const { data: chapterImages } = await supabase
        .from('story_images')
        .select('id, storage_path, thumbnail_path')
        .in('chapter_id', chapterIds);
      if (chapterImages) {
        imageCount += chapterImages.length;
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
        imageCount += turnImages.length;
        imagePaths.push(...turnImages.map(i => i.storage_path).filter(Boolean));
        imagePaths.push(...turnImages.map(i => i.thumbnail_path).filter(Boolean) as string[]);
      }
    }

    result.deletedCounts.images = imageCount;
    console.log(`[delete-session-deep] Found ${imagePaths.length} image files to delete`);

    // ===== BEGIN DELETION (order matters due to FK constraints) =====

    // Delete transcripts (linked to recordings)
    if (recordingIds.length > 0) {
      const { count, error } = await supabase
        .from('transcripts')
        .delete()
        .in('recording_id', recordingIds);
      if (error) result.errors.push(`Transcripts: ${error.message}`);
      else result.deletedCounts.transcripts = count || 0;
    }

    // Delete story_images (linked to chapters, turns)
    if (chapterIds.length > 0) {
      await supabase.from('story_images').delete().in('chapter_id', chapterIds);
    }
    if (turnIds.length > 0) {
      await supabase.from('story_images').delete().in('turn_id', turnIds);
    }

    // Delete turns
    {
      const { count, error } = await supabase
        .from('turns')
        .delete()
        .eq('session_id', sessionId);
      if (error) result.errors.push(`Turns: ${error.message}`);
      else result.deletedCounts.turns = count || 0;
    }

    // Delete chapters
    {
      const { count, error } = await supabase
        .from('chapters')
        .delete()
        .eq('session_id', sessionId);
      if (error) result.errors.push(`Chapters: ${error.message}`);
      else result.deletedCounts.chapters = count || 0;
    }

    // Delete recordings
    {
      const { count, error } = await supabase
        .from('recordings')
        .delete()
        .eq('session_id', sessionId);
      if (error) result.errors.push(`Recordings: ${error.message}`);
      else result.deletedCounts.recordings = count || 0;
    }

    // Delete session
    {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
      if (error) result.errors.push(`Session: ${error.message}`);
      else result.deletedCounts.session = 1;
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

    console.log(`[delete-session-deep] Deletion complete:`, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delete-session-deep] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
