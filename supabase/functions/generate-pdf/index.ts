import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[GENERATE-PDF] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

// ── Trim size config ─────────────────────────────────────────────────────
interface TrimConfig {
  width: number;  // inches
  height: number; // inches
  marginTop: string;
  marginBottom: string;
  marginOuter: string;
  marginGutter: string;
}

const TRIM_SIZES: Record<string, TrimConfig> = {
  "6x9": { width: 6, height: 9, marginTop: "0.75in", marginBottom: "0.75in", marginOuter: "0.85in", marginGutter: "0.85in" },
  "5.5x8.5": { width: 5.5, height: 8.5, marginTop: "0.6in", marginBottom: "0.6in", marginOuter: "0.55in", marginGutter: "0.75in" },
  "8.5x11": { width: 8.5, height: 11, marginTop: "0.75in", marginBottom: "0.75in", marginOuter: "0.85in", marginGutter: "0.85in" },
};

const LULU_MIN_PAGES = 32;
const BLEED = 0.125; // inches per side
const SPINE_FACTOR = 0.0025; // inches per page (B&W perfect bound)

// ── Color themes ─────────────────────────────────────────────────────────
interface ColorTheme {
  bg: string;
  text: string;
  accent: string;
  spine: string;
}

const COLOR_THEMES: Record<string, ColorTheme> = {
  classic: { bg: "#2c3e50", text: "#fdfbf7", accent: "#c5a059", spine: "#1a252f" },
  burgundy: { bg: "#722F37", text: "#fdfbf7", accent: "#D4A574", spine: "#4a1f24" },
  navy: { bg: "#1B2A4A", text: "#fdfbf7", accent: "#B8860B", spine: "#0f1a30" },
  forest: { bg: "#2D4A3E", text: "#fdfbf7", accent: "#C5A059", spine: "#1a2d25" },
  charcoal: { bg: "#333333", text: "#fdfbf7", accent: "#A0A0A0", spine: "#1a1a1a" },
};

// ── HTML helpers ──────────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

// ── Page estimation ──────────────────────────────────────────────────────
function estimatePages(chapters: { title: string; content: string }[]): number {
  let pages = 1; // title page
  for (const ch of chapters) {
    pages += 1; // chapter title page
    const words = ch.content.split(/\s+/).filter(Boolean).length;
    pages += Math.max(1, Math.ceil(words / 250));
  }
  return pages;
}

// ── Filler pages ─────────────────────────────────────────────────────────
function buildFillerPages(bookTitle: string, needed: number): string {
  const pages: string[] = [];
  for (let i = 0; i < needed; i++) {
    if (i % 2 === 0) {
      pages.push(`
      <div class="filler-page">
        <h2 class="filler-title">Notes</h2>
        <div class="filler-lines"></div>
      </div>`);
    } else {
      pages.push(`
      <div class="filler-page filler-blank">
        <p class="filler-book-title">${escapeHtml(bookTitle)}</p>
      </div>`);
    }
  }
  return pages.join("\n");
}

// ── Interior HTML builder ────────────────────────────────────────────────
function buildInteriorHtml(
  bookTitle: string,
  chapters: { title: string; content: string }[],
  trim: TrimConfig,
): { html: string; pageCount: number } {
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

  const estimated = estimatePages(chapters);
  let fillerNeeded = Math.max(0, LULU_MIN_PAGES - estimated);
  const total = estimated + fillerNeeded;
  if (total % 2 !== 0) fillerNeeded += 1;
  const finalPageCount = estimated + fillerNeeded;

  const fillerHtml = fillerNeeded > 0 ? buildFillerPages(bookTitle, fillerNeeded) : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @page {
    margin: ${trim.marginTop} ${trim.marginOuter} ${trim.marginBottom} ${trim.marginGutter};
  }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }
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
  .chapter-body p {
    margin: 0 0 0.4em 0;
    text-align: justify;
    text-indent: 1.5em;
  }
  .chapter-body p:first-child {
    text-indent: 0;
  }
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
  ${fillerHtml}
</body>
</html>`;

  return { html, pageCount: finalPageCount };
}

// ── Cover HTML builder ───────────────────────────────────────────────────
function buildCoverHtml(opts: {
  title: string;
  subtitle: string;
  imageUrl?: string;
  theme: ColorTheme;
  trimWidth: number;
  trimHeight: number;
  spineWidth: number;
  coverWidthIn: number;
  coverHeightIn: number;
}): string {
  const { title, subtitle, imageUrl, theme, trimWidth, trimHeight, spineWidth, coverWidthIn, coverHeightIn } = opts;

  // All measurements in inches — PDFShift will render at this exact size
  const bleed = BLEED;
  // Panel positions (from left): back panel, spine, front panel — all include bleed
  const backPanelWidth = trimWidth + bleed; // left bleed + back trim
  const spinePanelWidth = spineWidth;
  const frontPanelStart = backPanelWidth + spinePanelWidth;
  const frontPanelWidth = trimWidth + bleed; // front trim + right bleed

  const imageBlock = imageUrl
    ? `<div class="cover-image" style="
        width: 2.5in;
        height: 2.5in;
        margin: 0.3in auto;
        border-radius: 0.08in;
        overflow: hidden;
        border: 2px solid ${theme.accent};
      ">
        <img src="${escapeHtml(imageUrl)}" style="width:100%;height:100%;object-fit:cover;" />
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @page {
    size: ${coverWidthIn}in ${coverHeightIn}in;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${coverWidthIn}in;
    height: ${coverHeightIn}in;
    font-family: 'Georgia', 'Times New Roman', serif;
    position: relative;
    overflow: hidden;
  }
  .cover-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    position: relative;
  }
  /* Back cover (left side) */
  .back-panel {
    width: ${backPanelWidth}in;
    height: 100%;
    background: ${theme.bg};
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding: ${bleed + 0.5}in ${bleed + 0.4}in;
  }
  .back-panel .back-title {
    font-size: 10pt;
    color: ${theme.accent};
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 0.3in;
  }
  .back-panel .back-brand {
    font-size: 8pt;
    color: ${theme.text};
    opacity: 0.5;
    letter-spacing: 1px;
  }
  /* Spine */
  .spine-panel {
    width: ${spinePanelWidth}in;
    height: 100%;
    background: ${theme.spine};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .spine-text {
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    font-size: ${spineWidth > 0.3 ? "9pt" : "7pt"};
    color: ${theme.text};
    letter-spacing: 2px;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: ${trimHeight - 0.5}in;
  }
  /* Front cover (right side) */
  .front-panel {
    width: ${frontPanelWidth}in;
    height: 100%;
    background: ${theme.bg};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: ${bleed + 0.8}in ${bleed + 0.5}in;
  }
  .front-panel .cover-title {
    font-size: 26pt;
    font-weight: 700;
    color: ${theme.text};
    line-height: 1.2;
    margin-bottom: 0.15in;
    max-width: ${trimWidth - 1}in;
  }
  .front-panel .cover-divider {
    width: 1.2in;
    height: 2px;
    background: ${theme.accent};
    margin: 0.15in auto;
  }
  .front-panel .cover-subtitle {
    font-size: 11pt;
    color: ${theme.text};
    opacity: 0.7;
    font-style: italic;
    margin-top: 0.1in;
    max-width: ${trimWidth - 1.2}in;
  }
</style>
</head>
<body>
  <div class="cover-wrap">
    <div class="back-panel">
      <p class="back-title">${escapeHtml(title)}</p>
      <p class="back-brand">OSSTE</p>
    </div>
    <div class="spine-panel">
      <span class="spine-text">${escapeHtml(title)}</span>
    </div>
    <div class="front-panel">
      <h1 class="cover-title">${escapeHtml(title)}</h1>
      <div class="cover-divider"></div>
      ${subtitle ? `<p class="cover-subtitle">${escapeHtml(subtitle)}</p>` : ""}
      ${imageBlock}
    </div>
  </div>
</body>
</html>`;
}

// ── PDF generation via PDFShift ──────────────────────────────────────────
async function callPdfShift(
  pdfshiftKey: string,
  html: string,
  extraOptions: Record<string, unknown> = {},
): Promise<ArrayBuffer> {
  const resp = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa("api:" + pdfshiftKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: html,
      landscape: false,
      use_print: true,
      ...extraOptions,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`PDFShift failed (${resp.status}): ${errText}`);
  }

  return resp.arrayBuffer();
}

async function generateInteriorPdf(
  pdfshiftKey: string,
  bookTitle: string,
  chapters: { title: string; content: string }[],
  trimSize: string,
): Promise<{ buffer: ArrayBuffer; pageCount: number }> {
  const trim = TRIM_SIZES[trimSize] || TRIM_SIZES["6x9"];
  const { html, pageCount } = buildInteriorHtml(bookTitle, chapters, trim);
  log("Interior HTML built", { pageCount, trimSize });

  const pdfshiftFormat = `${trim.width}inx${trim.height}in`;
  log("Interior PDF dimensions", { trimSize, pdfshiftFormat, widthIn: trim.width, heightIn: trim.height, pageCount });

  const buffer = await callPdfShift(pdfshiftKey, html, { format: pdfshiftFormat });
  log("Interior PDF generated", { sizeBytes: buffer.byteLength });

  return { buffer, pageCount };
}

async function generateCoverPdf(
  pdfshiftKey: string,
  opts: {
    title: string;
    subtitle: string;
    imageUrl?: string;
    colorTheme: string;
    pageCount: number;
    trimSize: string;
  },
): Promise<ArrayBuffer> {
  const trim = TRIM_SIZES[opts.trimSize] || TRIM_SIZES["6x9"];
  const theme = COLOR_THEMES[opts.colorTheme] || COLOR_THEMES["classic"];
  const spineWidth = opts.pageCount * SPINE_FACTOR;
  const coverWidthIn = (trim.width * 2) + spineWidth + (BLEED * 2);
  const coverHeightIn = trim.height + (BLEED * 2);

  log("Cover dimensions", {
    trimSize: opts.trimSize,
    pageCount: opts.pageCount,
    spineWidth: spineWidth.toFixed(4),
    coverWidthIn: coverWidthIn.toFixed(4),
    coverHeightIn: coverHeightIn.toFixed(4),
  });

  const html = buildCoverHtml({
    title: opts.title,
    subtitle: opts.subtitle,
    imageUrl: opts.imageUrl,
    theme,
    trimWidth: trim.width,
    trimHeight: trim.height,
    spineWidth,
    coverWidthIn,
    coverHeightIn,
  });

  const buffer = await callPdfShift(pdfshiftKey, html);
  log("Cover PDF generated", { sizeBytes: buffer.byteLength });

  return buffer;
}

// ── Upload helpers ───────────────────────────────────────────────────────
async function uploadPdf(
  admin: ReturnType<typeof createClient>,
  storagePath: string,
  buffer: ArrayBuffer,
): Promise<string> {
  // Ensure bucket exists
  const { data: buckets } = await admin.storage.listBuckets();
  const booksBucket = buckets?.find((b: any) => b.id === "books");
  if (!booksBucket) {
    await admin.storage.createBucket("books", { public: false });
    log("Created books bucket");
  }

  const { error: uploadErr } = await admin.storage
    .from("books")
    .upload(storagePath, new Uint8Array(buffer), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: signedData, error: signedErr } = await admin.storage
    .from("books")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days for Lulu fetch

  if (signedErr || !signedData?.signedUrl) {
    throw new Error("Failed to create signed URL");
  }

  return signedData.signedUrl;
}

// ── Main handler ─────────────────────────────────────────────────────────
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

  // Auth — accept either user JWT or service-role key
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  let userId: string | null = null;
  let isServiceRole = false;

  if (token === serviceRoleKey) {
    isServiceRole = true;
  } else {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = userData.user.id;
  }

  log("Authenticated", { userId, isServiceRole });

  try {
    const body = await req.json();
    const { storyId, print_order_id, generate_cover = true } = body;

    if (!storyId) throw new Error("storyId is required");
    log("Generating PDF(s)", { storyId, print_order_id, generate_cover });

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch story + story group (including plan flags)
    const { data: story, error: storyErr } = await admin
      .from("stories")
      .select("*, story_groups!inner(title, user_id, pdf_enabled, plan)")
      .eq("id", storyId)
      .single();

    if (storyErr || !story) throw new Error("Story not found");

    const storyGroupUserId = (story as any).story_groups?.user_id;
    const pdfEnabled = (story as any).story_groups?.pdf_enabled;

    // Ownership check (skip for service role)
    if (!isServiceRole && storyGroupUserId !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Plan-based PDF access check (skip for service role / print orders)
    if (!isServiceRole && !print_order_id && pdfEnabled === false) {
      log("PDF generation blocked – pdf_enabled is false", { plan: (story as any).story_groups?.plan });
      return new Response(JSON.stringify({ error: "PDF download is not available on your current plan. Please upgrade to Digital or Legacy." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveUserId = userId || storyGroupUserId;
    const bookTitle = (story as any).story_groups?.title || story.title || "My Book";

    // Fetch cover metadata from print_order if provided
    let coverTitle = bookTitle;
    let coverSubtitle = "A collection of memories";
    let coverImageUrl: string | undefined;
    let coverColorTheme = "classic";
    let trimSize = "6x9";

    if (print_order_id) {
      const { data: orderRow } = await admin
        .from("print_orders")
        .select("cover_title, cover_subtitle, cover_image_url, cover_color_theme, trim_size")
        .eq("id", print_order_id)
        .single();

      if (orderRow) {
        coverTitle = orderRow.cover_title || bookTitle;
        coverSubtitle = orderRow.cover_subtitle || coverSubtitle;
        coverImageUrl = orderRow.cover_image_url || undefined;
        coverColorTheme = orderRow.cover_color_theme || coverColorTheme;
        trimSize = orderRow.trim_size || trimSize;
      }
    }

    // ── Build chapters ──
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
          const title =
            ch.title || ch.suggested_cover_title || sess?.title || sess?.story_anchor || `Chapter ${i + 1}`;
          return { title, content: ch.polished_text || "" };
        });
      }
    }

    // Fallback: parse story text
    if (chapters.length === 0) {
      const content = story.edited_text || story.raw_text || "";
      if (!content) throw new Error("No content available to generate PDF");

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

    // ── Generate interior ──
    const { buffer: interiorBuffer, pageCount } = await generateInteriorPdf(
      pdfshiftKey, bookTitle, chapters, trimSize,
    );

    const interiorVersion = Date.now();
    const interiorPath = `books/${effectiveUserId}/${storyId}-interior-v${interiorVersion}.pdf`;
    const interiorUrl = await uploadPdf(admin, interiorPath, interiorBuffer);
    log("Interior uploaded", { path: interiorPath });

    // ── Generate cover (if requested) ──
    let coverUrl: string | null = null;
    if (generate_cover) {
      const coverBuffer = await generateCoverPdf(pdfshiftKey, {
        title: coverTitle,
        subtitle: coverSubtitle,
        imageUrl: coverImageUrl,
        colorTheme: coverColorTheme,
        pageCount,
        trimSize,
      });

      const coverPath = `books/${effectiveUserId}/${storyId}-cover.pdf`;
      coverUrl = await uploadPdf(admin, coverPath, coverBuffer);
      log("Cover uploaded", { path: coverPath });
    }

    // ── Update print_order if provided ──
    if (print_order_id) {
      const updatePayload: Record<string, unknown> = {
        interior_pdf_url: interiorUrl,
        page_count: pageCount,
        trim_size: trimSize,
      };
      if (coverUrl) {
        updatePayload.cover_pdf_url = coverUrl;
      }
      await admin.from("print_orders").update(updatePayload).eq("id", print_order_id);
      log("print_orders updated with PDF URLs", { print_order_id });
    }

    const result = {
      pdfUrl: interiorUrl, // backwards compat for BookPreview download
      interior_pdf_url: interiorUrl,
      cover_pdf_url: coverUrl,
      page_count: pageCount,
      trim_size: trimSize,
    };

    log("Success", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
