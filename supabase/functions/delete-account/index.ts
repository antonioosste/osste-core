import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify password by attempting sign-in
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (email !== user.email) {
      return new Response(JSON.stringify({ error: 'Email does not match your account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify password with a fresh sign-in using anon key
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const anonClient = createClient(supabaseUrl, anonKey);
    const { error: signInError } = await anonClient.auth.signInWithPassword({ email, password });

    if (signInError) {
      return new Response(JSON.stringify({ error: 'Incorrect password. Account deletion aborted.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, serviceKey);
    const errors: string[] = [];

    console.log(`[delete-account] Starting full account deletion for user: ${userId}`);

    // 1. Get all story groups
    const { data: storyGroups } = await supabase
      .from('story_groups').select('id').eq('user_id', userId);
    const sgIds = storyGroups?.map(sg => sg.id) || [];

    // 2. Get all sessions
    const { data: sessions } = await supabase
      .from('sessions').select('id').eq('user_id', userId);
    const sessionIds = sessions?.map(s => s.id) || [];

    // 3. Get stories
    let storyIds: string[] = [];
    if (sgIds.length > 0) {
      const { data: stories } = await supabase
        .from('stories').select('id').in('story_group_id', sgIds);
      storyIds = stories?.map(s => s.id) || [];
    }

    // 4. Get recordings + storage paths
    let recordingIds: string[] = [];
    let recordingPaths: string[] = [];
    if (sessionIds.length > 0) {
      const { data: recs } = await supabase
        .from('recordings').select('id, storage_path').in('session_id', sessionIds);
      recordingIds = recs?.map(r => r.id) || [];
      recordingPaths = recs?.map(r => r.storage_path).filter(Boolean) || [];
    }

    // 5. Get chapters & turns
    let chapterIds: string[] = [];
    let turnIds: string[] = [];
    if (sessionIds.length > 0) {
      const [{ data: chapters }, { data: turns }] = await Promise.all([
        supabase.from('chapters').select('id').in('session_id', sessionIds),
        supabase.from('turns').select('id').in('session_id', sessionIds),
      ]);
      chapterIds = chapters?.map(c => c.id) || [];
      turnIds = turns?.map(t => t.id) || [];
    }

    // 6. Get image storage paths
    let imagePaths: string[] = [];
    const { data: userImages } = await supabase
      .from('story_images').select('storage_path, thumbnail_path').eq('user_id', userId);
    if (userImages) {
      imagePaths.push(...userImages.map(i => i.storage_path).filter(Boolean));
      imagePaths.push(...userImages.map(i => i.thumbnail_path).filter(Boolean) as string[]);
    }

    console.log(`[delete-account] Found: ${sgIds.length} story_groups, ${sessionIds.length} sessions, ${storyIds.length} stories, ${recordingIds.length} recordings, ${chapterIds.length} chapters, ${turnIds.length} turns, ${imagePaths.length} image files`);

    // ===== DELETION ORDER (respecting FK constraints) =====

    // Transcripts
    if (recordingIds.length > 0) {
      const { error } = await supabase.from('transcripts').delete().in('recording_id', recordingIds);
      if (error) errors.push(`transcripts: ${error.message}`);
    }

    // Story images (all user images)
    {
      const { error } = await supabase.from('story_images').delete().eq('user_id', userId);
      if (error) errors.push(`story_images: ${error.message}`);
    }

    // Turns
    if (sessionIds.length > 0) {
      const { error } = await supabase.from('turns').delete().in('session_id', sessionIds);
      if (error) errors.push(`turns: ${error.message}`);
    }

    // Chapters
    if (sessionIds.length > 0) {
      const { error } = await supabase.from('chapters').delete().in('session_id', sessionIds);
      if (error) errors.push(`chapters: ${error.message}`);
    }

    // Recordings
    if (sessionIds.length > 0) {
      const { error } = await supabase.from('recordings').delete().in('session_id', sessionIds);
      if (error) errors.push(`recordings: ${error.message}`);
    }

    // Print orders
    if (sgIds.length > 0) {
      // Delete print order related data first
      const { data: printOrders } = await supabase
        .from('print_orders').select('id').in('story_group_id', sgIds);
      const poIds = printOrders?.map(p => p.id) || [];

      if (poIds.length > 0) {
        await supabase.from('print_order_admin_actions').delete().in('print_order_id', poIds);
        await supabase.from('print_order_alerts').delete().in('print_order_id', poIds);
        await supabase.from('print_order_events').delete().in('print_order_id', poIds);
        const { error } = await supabase.from('print_orders').delete().in('id', poIds);
        if (error) errors.push(`print_orders: ${error.message}`);
      }
    }

    // Sessions
    if (sessionIds.length > 0) {
      const { error } = await supabase.from('sessions').delete().in('id', sessionIds);
      if (error) errors.push(`sessions: ${error.message}`);
    }

    // Story embeddings
    if (storyIds.length > 0) {
      await supabase.from('story_embeddings').delete().in('story_id', storyIds);
    }

    // Stories
    if (sgIds.length > 0) {
      const { error } = await supabase.from('stories').delete().in('story_group_id', sgIds);
      if (error) errors.push(`stories: ${error.message}`);
    }

    // Story groups
    if (sgIds.length > 0) {
      const { error } = await supabase.from('story_groups').delete().in('id', sgIds);
      if (error) errors.push(`story_groups: ${error.message}`);
    }

    // User billing
    {
      const { error } = await supabase.from('user_billing').delete().eq('user_id', userId);
      if (error) errors.push(`user_billing: ${error.message}`);
    }

    // Entitlements
    {
      const { error } = await supabase.from('entitlements').delete().eq('user_id', userId);
      if (error) errors.push(`entitlements: ${error.message}`);
    }

    // User roles
    {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (error) errors.push(`user_roles: ${error.message}`);
    }

    // Invite code redemptions
    {
      const { error } = await supabase.from('invite_code_redemptions').delete().eq('user_id', userId);
      if (error) errors.push(`invite_code_redemptions: ${error.message}`);
    }

    // Profile
    {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) errors.push(`profiles: ${error.message}`);
    }

    // ===== DELETE STORAGE FILES =====
    if (recordingPaths.length > 0) {
      await supabase.storage.from('recordings').remove(recordingPaths);
    }
    if (imagePaths.length > 0) {
      await supabase.storage.from('story_images').remove(imagePaths);
    }

    // ===== DELETE AUTH USER =====
    const { error: deleteUserError } = await supabaseAuth.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      errors.push(`auth user: ${deleteUserError.message}`);
    }

    console.log(`[delete-account] Deletion complete. Errors: ${errors.length}`);
    if (errors.length > 0) console.error(`[delete-account] Errors:`, errors);

    return new Response(
      JSON.stringify({ success: errors.length === 0, errors }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delete-account] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
