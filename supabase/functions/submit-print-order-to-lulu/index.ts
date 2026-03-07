import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createLuluPrintJob } from "../_shared/lulu.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[SUBMIT-PRINT-ORDER-TO-LULU] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseClient.auth.getClaims(token);

    // If getClaims fails, allow service-role calls (token = service role key)
    let callerUserId: string | null = null;
    let isServiceRole = false;

    if (claimsErr || !claimsData?.claims) {
      // Check if this is a service-role call
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (token === serviceRoleKey) {
        isServiceRole = true;
      } else {
        return json({ error: "Unauthorized" }, 401);
      }
    } else {
      callerUserId = claimsData.claims.sub as string;
    }

    // ── Parse input ──
    const { print_order_id, interior_pdf_url, cover_pdf_url } = await req.json();

    if (!print_order_id) return json({ error: "print_order_id is required" }, 400);
    if (!interior_pdf_url) return json({ error: "interior_pdf_url is required" }, 400);
    if (!cover_pdf_url) return json({ error: "cover_pdf_url is required" }, 400);

    log("Request received", { print_order_id, interior_pdf_url, cover_pdf_url, callerUserId, isServiceRole });

    // ── Load order ──
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("print_orders")
      .select("*")
      .eq("id", print_order_id)
      .single();

    if (fetchErr || !order) {
      log("Order not found", { print_order_id, error: fetchErr?.message });
      return json({ error: "print_order not found" }, 404);
    }

    // ── Authorization: caller must own the order (unless service role) ──
    if (!isServiceRole && order.user_id !== callerUserId) {
      log("Unauthorized: caller does not own order", { callerUserId, orderUserId: order.user_id });
      return json({ error: "Forbidden" }, 403);
    }

    // ── Idempotent: if Lulu job already exists, return it ──
    if (order.lulu_print_job_id) {
      log("Lulu job already exists, returning existing", { lulu_print_job_id: order.lulu_print_job_id });
      return json({
        ok: true,
        idempotent: true,
        order: {
          id: order.id,
          status: order.status,
          lulu_print_job_id: order.lulu_print_job_id,
          lulu_order_id: order.lulu_order_id,
          lulu_status: order.lulu_status,
        },
      });
    }

    // ── Guard: only process paid / awaiting_pdfs orders ──
    if (order.status !== "paid" && order.status !== "awaiting_pdfs") {
      log("Order not in submittable status", { status: order.status });
      return json({ error: `Order status is '${order.status}', expected 'paid' or 'awaiting_pdfs'` }, 400);
    }

    // ── Update PDF URLs ──
    const { error: pdfUpdateErr } = await supabaseAdmin
      .from("print_orders")
      .update({ interior_pdf_url, cover_pdf_url })
      .eq("id", print_order_id);

    if (pdfUpdateErr) {
      log("Failed to update PDF URLs", { error: pdfUpdateErr.message });
      return json({ error: "Failed to update PDF URLs" }, 500);
    }

    // Merge URLs into order object for the Lulu helper
    const orderWithPdfs = { ...order, interior_pdf_url, cover_pdf_url };

    // ── Create Lulu print job ──
    try {
      const lulu = await createLuluPrintJob(orderWithPdfs, log);

      const mappedStatus = lulu.status_name === "CREATED"
        ? "lulu_created"
        : "lulu_" + lulu.status_name.toLowerCase();

      const { error: luluUpdateErr } = await supabaseAdmin
        .from("print_orders")
        .update({
          lulu_print_job_id: lulu.print_job_id,
          lulu_order_id: lulu.order_id,
          lulu_status: lulu.status_name,
          lulu_cost_incl_tax: lulu.total_cost_incl_tax,
          currency: lulu.currency || "usd",
          status: mappedStatus,
          error_message: null, // clear any previous error
        })
        .eq("id", print_order_id);

      if (luluUpdateErr) {
        log("Failed to save Lulu result to DB", { error: luluUpdateErr.message });
      }

      log("Lulu job created successfully", { print_order_id, lulu_print_job_id: lulu.print_job_id });

      return json({
        ok: true,
        order: {
          id: print_order_id,
          status: mappedStatus,
          lulu_print_job_id: lulu.print_job_id,
          lulu_order_id: lulu.order_id,
          lulu_status: lulu.status_name,
          lulu_cost_incl_tax: lulu.total_cost_incl_tax,
          currency: lulu.currency,
        },
      });
    } catch (luluErr) {
      const errMsg = luluErr instanceof Error ? luluErr.message : String(luluErr);
      log("Lulu job creation failed", { error: errMsg });

      await supabaseAdmin
        .from("print_orders")
        .update({ status: "lulu_error", error_message: errMsg })
        .eq("id", print_order_id);

      return json({ error: errMsg, status: "lulu_error" }, 500);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
