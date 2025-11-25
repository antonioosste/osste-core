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
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📚 Generating book PDF for user:', user.id);

    // Get user profile for author name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    // Fetch all chapters for the user with status draft or approved
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .or('status.eq.draft,status.eq.approved')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (chaptersError) {
      console.error('Chapters fetch error:', chaptersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch chapters' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chapters || chapters.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No chapters found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 Found', chapters.length, 'chapters');

    // TODO: Anthony - Replace this with actual PDF generation library
    // Suggested libraries: jsPDF, pdfkit, or @react-pdf/renderer
    // For now, return structured data that can be used for PDF generation
    
    const bookData = {
      title: "My Life Stories",
      subtitle: "A Collection of Personal Memories",
      author: profile?.name || "Anonymous",
      year: new Date().getFullYear().toString(),
      chapters: chapters.map((chapter: any, index: number) => ({
        order: index + 1,
        title: chapter.title || "Untitled Chapter",
        content: chapter.polished_text || chapter.raw_transcript || "",
        summary: chapter.summary,
        quotes: chapter.quotes
      })),
      totalWords: chapters.reduce((sum: number, chapter: any) => {
        const text = chapter.polished_text || chapter.raw_transcript || "";
        return sum + text.split(/\s+/).length;
      }, 0)
    };

    console.log('📊 Book stats:', {
      chapters: bookData.chapters.length,
      totalWords: bookData.totalWords,
      estimatedPages: Math.ceil(bookData.totalWords / 250)
    });

    // TODO: Generate actual PDF here
    // For now, return the structured data as JSON
    // Anthony should integrate a PDF library like jsPDF or pdfkit
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF generation placeholder - integrate PDF library here',
        bookData,
        // When PDF is generated, return a download URL instead
        // downloadUrl: signedUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-book-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});