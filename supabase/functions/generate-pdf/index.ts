import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[GENERATE-PDF] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Convert markdown-ish chapter text to simple HTML paragraphs */
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

/** Estimate page count: ~250 words per 6x9 page */
function estimatePages(chapters: { title: string; content: string }[]): number {
  // Title page = 1, each chapter start = 1 page
  let pages = 1;
  for (const ch of chapters) {
    pages += 1; // chapter title page
    const words = ch.content.split(/\s+/).filter(Boolean).length;
    pages += Math.max(1, Math.ceil(words / 250));
  }
  return pages;
}

function buildFillerPages(bookTitle: string, needed: number): string {
  const pages: string[] = [];
  for (let i = 0; i < needed; i++) {
    if (i % 2 === 0) {
      // "Notes" page
      pages.push(`
      <div class="filler-page">
        <h2 class="filler-title">Notes</h2>
        <div class="filler-lines"></div>
      </div>`);
    } else {
      // Branded blank page
      pages.push(`
      <div class="filler-page filler-blank">
        <p class="filler-book-title">${escapeHtml(bookTitle)}</p>
      </div>`);
    }
  }
  return pages.join("\n");
}

function buildBookHtml(
  bookTitle: string,
  chapters: { title: string; content: string }[],
): string {
  const chapterPages = chapters
    .map(
      (ch, i) => `
      <div class="chapter-start">
        <h2>Chapter ${i + 1}</h2>
        <h3>${escapeHtml(ch.title)}</h3>
      </div>
      <div class="chapter-body">
        ${textToHtml(ch.content)}
      </div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @page {
    size: 5.75in 8.75in;
    margin: 0.5in 0.5in 0.5in 0.75in;
  }
  @page :left {
    margin: 0.5in 0.75in 0.5in 0.5in;
  }
  @page :right {
    margin: 0.5in 0.5in 0.5in 0.75in;
  }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }
  /* Title page */
  .title-page {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
  }
  .title-page h1 {
    font-size: 28pt;
    margin-bottom: 0.3in;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .title-page .divider {
    width: 1.5in;
    height: 2px;
    background: #999;
    margin: 0.2in auto;
  }
  .title-page .subtitle {
    font-size: 12pt;
    color: #666;
    font-style: italic;
  }
  /* Chapter start */
  .chapter-start {
    page-break-before: always;
    padding-top: 1.5in;
    margin-bottom: 0.5in;
    text-align: center;
  }
  .chapter-start h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: #888;
    margin-bottom: 0.15in;
    font-weight: 400;
  }
  .chapter-start h3 {
    font-size: 18pt;
    font-weight: 700;
    margin: 0;
  }
  /* Chapter body */
  .chapter-body p {
    margin: 0 0 0.4em 0;
    text-align: justify;
    text-indent: 1.5em;
  }
  .chapter-body p:first-child {
    text-indent: 0;
  }
  /* Filler pages */
  .filler-page {
    page-break-before: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 1.5in;
  }
  .filler-title {
    font-size: 14pt;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: #888;
    font-weight: 400;
    margin-bottom: 0.5in;
  }
  .filler-lines {
    width: 100%;
    flex: 1;
    background: repeating-linear-gradient(
      transparent, transparent 28px, #e8e8e8 28px, #e8e8e8 29px
    );
  }
  .filler-blank {
    justify-content: center;
    padding-top: 0;
  }
  .filler-book-title {
    font-size: 10pt;
    color: #ccc;
    font-style: italic;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
  <div class="title-page">
    <h1>${escapeHtml(bookTitle)}</h1>
    <div class="divider"></div>
    <p class="subtitle">A collection of memories</p>
  </div>
  ${chapterPages}
  ${(() => {
    const LULU_MIN = 32;
    const estimated = estimatePages(chapters);
    let needed = Math.max(0, LULU_MIN - estimated);
    const total = estimated + needed;
    if (total % 2 !== 0) needed += 1;
    return needed > 0 ? buildFillerPages(bookTitle, needed) : "";
  })()}
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const pdfshiftKey = Deno.env.get("PDFSHIFT_API_KEY") ?? "";

  if (!pdfshiftKey) {
    return new Response(JSON.stringify({ error: "PDFSHIFT_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;
  log("Authenticated", { userId });

  try {
    const { storyId } = await req.json();
    if (!storyId) throw new Error("storyId is required");
    log("Generating PDF for story", { storyId });

    // Use service role to fetch data
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch story
    const { data: story, error: storyErr } = await admin
      .from("stories")
      .select("*, story_groups!inner(title, user_id)")
      .eq("id", storyId)
      .single();

    if (storyErr || !story) {
      throw new Error("Story not found");
    }

    // Verify ownership
    if ((story as any).story_groups?.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bookTitle = (story as any).story_groups?.title || story.title || "My Book";

    // Fetch sessions for this story group
    const { data: sessions } = await admin
      .from("sessions")
      .select("id, title, story_anchor")
      .eq("story_group_id", story.story_group_id);

    let chapters: { title: string; content: string }[] = [];

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s: any) => s.id);
      const sessLookup: Record<string, any> = {};
      sessions.forEach((s: any) => { sessLookup[s.id] = s; });

      const { data: chaptersData } = await admin
        .from("chapters")
        .select("*")
        .in("session_id", sessionIds)
        .order("order_index", { ascending: true });

      if (chaptersData && chaptersData.length > 0) {
        chapters = chaptersData.map((ch: any, i: number) => {
          const sess = ch.session_id ? sessLookup[ch.session_id] : null;
          // Title hierarchy: chapter.title > chapter.suggested_cover_title > session.title > session.story_anchor
          const title =
            ch.title ||
            ch.suggested_cover_title ||
            sess?.title ||
            sess?.story_anchor ||
            `Chapter ${i + 1}`;
          return { title, content: ch.polished_text || "" };
        });
      }
    }

    // Fallback: use story text which may contain markdown chapter headers
    if (chapters.length === 0) {
      const content = story.edited_text || story.raw_text || "";
      if (!content) {
        throw new Error("No content available to generate PDF");
      }

      // Parse markdown ## headers as chapter delimiters
      const chapterRegex = /^##\s+(.+)$/gm;
      const headerMatches = [...content.matchAll(chapterRegex)];

      if (headerMatches.length > 0) {
        for (let i = 0; i < headerMatches.length; i++) {
          const headerTitle = headerMatches[i][1].trim();
          const startIdx = headerMatches[i].index! + headerMatches[i][0].length;
          const endIdx = i + 1 < headerMatches.length ? headerMatches[i + 1].index! : content.length;
          const chapterContent = content.substring(startIdx, endIdx).trim();
          if (chapterContent) {
            chapters.push({ title: headerTitle, content: chapterContent });
          }
        }
      } else {
        chapters = [{ title: bookTitle, content }];
      }
    }

    const estimatedPageCount = estimatePages(chapters);
    const fillerNeeded = Math.max(0, 32 - estimatedPageCount);
    const finalEven = (estimatedPageCount + fillerNeeded) % 2 !== 0 ? fillerNeeded + 1 : fillerNeeded;
    log("Building HTML", { chapterCount: chapters.length, estimatedPageCount, fillerPages: finalEven });
    const html = buildBookHtml(bookTitle, chapters);

    // Call PDFShift
    log("Calling PDFShift");
    const pdfResponse = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa("api:" + pdfshiftKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        use_print: true,
        format: {
          width: "5.75in",
          height: "8.75in",
        },
        margin: {
          top: "0.5in",
          bottom: "0.5in",
          left: "0.75in",
          right: "0.5in",
        },
      }),
    });

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      log("PDFShift error", { status: pdfResponse.status, body: errText });
      throw new Error(`PDFShift failed: ${pdfResponse.status}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    log("PDF generated", { sizeBytes: pdfBuffer.byteLength });

    // Upload to Supabase Storage
    const storagePath = `books/${userId}/${storyId}.pdf`;

    // Ensure bucket exists (use admin client)
    const { data: buckets } = await admin.storage.listBuckets();
    const booksBucket = buckets?.find((b: any) => b.id === "books");
    if (!booksBucket) {
      await admin.storage.createBucket("books", { public: false });
      log("Created books bucket");
    }

    const { error: uploadErr } = await admin.storage
      .from("books")
      .upload(storagePath, new Uint8Array(pdfBuffer), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      log("Upload error", { error: uploadErr.message });
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    // Create signed URL (24h)
    const { data: signedData, error: signedErr } = await admin.storage
      .from("books")
      .createSignedUrl(storagePath, 60 * 60 * 24);

    if (signedErr || !signedData?.signedUrl) {
      throw new Error("Failed to create signed URL");
    }

    log("Success", { url: signedData.signedUrl.substring(0, 60) + "..." });

    return new Response(
      JSON.stringify({ pdfUrl: signedData.signedUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
