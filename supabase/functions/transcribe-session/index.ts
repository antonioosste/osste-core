import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📝 Starting transcription for session:', sessionId);

    // 1. Get session and its recordings
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, recordings(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Found session with', session.recordings?.length || 0, 'recordings');

    // 2. Get all transcripts for this session's recordings
    const recordingIds = (session.recordings || []).map((r: any) => r.id);
    
    if (recordingIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recordings found for this session' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: transcripts, error: transcriptsError } = await supabase
      .from('transcripts')
      .select('*')
      .in('recording_id', recordingIds)
      .order('created_at', { ascending: true });

    if (transcriptsError) {
      console.error('Transcripts error:', transcriptsError);
    }

    console.log('📄 Found', transcripts?.length || 0, 'transcripts');

    // 3. Determine chapter title
    let chapterTitle = 'Untitled Chapter';
    
    if (session.title) {
      chapterTitle = session.title;
    } else if (session.story_anchor) {
      chapterTitle = session.story_anchor;
    } else if (transcripts && transcripts.length > 0 && transcripts[0].text) {
      // Generate title from first sentence
      const firstSentence = transcripts[0].text.split(/[.!?]/)[0].trim();
      chapterTitle = firstSentence.substring(0, 80);
    }

    console.log('📚 Chapter title:', chapterTitle);

    // 4. Combine all transcripts into one
    const rawTranscript = (transcripts || [])
      .map((t: any) => t.text)
      .filter(Boolean)
      .join('\n\n');

    console.log('✍️ Combined transcript length:', rawTranscript.length);

    // 5. Get next chapter order for this user
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('order_index')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = (existingChapters && existingChapters.length > 0) 
      ? (existingChapters[0].order_index || 0) + 1 
      : 1;

    console.log('📊 Next chapter order:', nextOrder);

    // 6. Create chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .insert({
        user_id: session.user_id,
        session_id: session.id,
        title: chapterTitle,
        raw_transcript: rawTranscript,
        status: 'draft',
        order_index: nextOrder
      })
      .select()
      .single();

    if (chapterError) {
      console.error('Chapter creation error:', chapterError);
      return new Response(
        JSON.stringify({ error: 'Failed to create chapter', details: chapterError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Chapter created:', chapter.id);

    // 7. Update session status
    await supabase
      .from('sessions')
      .update({ status: 'done' })
      .eq('id', sessionId);

    console.log('✅ Session status updated to done');

    return new Response(
      JSON.stringify({ 
        success: true,
        chapter: {
          id: chapter.id,
          title: chapter.title,
          order_index: chapter.order_index
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});