import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createLuluPrintJob, LuluApiError } from "../_shared/lulu.ts";

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

    let callerUserId: string | null = null;
    let isServiceRole = false;

    if (claimsErr || !claimsData?.claims) {
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

    // ── Authorization ──
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

    // ── Optimistic guard: set status='lulu_submitting' only if in allowed state ──
    const allowedStatuses = ["paid", "awaiting_pdfs", "lulu_error"];
    log("Optimistic guard", { currentStatus: order.status, allowed: allowedStatuses });

    const { data: guardRows, error: guardErr } = await supabaseAdmin
      .from("print_orders")
      .update({
        status: "lulu_submitting",
        last_submit_at: new Date().toISOString(),
        submit_attempts: (order.submit_attempts ?? 0) + 1,
      })
      .eq("id", print_order_id)
      .in("status", allowedStatuses)
      .select("id");

    if (guardErr) {
      log("Guard update failed", { error: guardErr.message });
      return json({ error: "Guard update failed" }, 500);
    }

    if (!guardRows || guardRows.length === 0) {
      log("Optimistic guard failed – concurrent submit or invalid status", { status: order.status });
      return json({
        ok: false,
        error: "conflict",
        message: `Order is currently '${order.status}' and cannot be submitted. Another submission may be in progress.`,
      }, 409);
    }

    // ── Update PDF URLs ──
    await supabaseAdmin
      .from("print_orders")
      .update({ interior_pdf_url, cover_pdf_url })
      .eq("id", print_order_id);

    const orderWithPdfs = { ...order, interior_pdf_url, cover_pdf_url };

    // ── Create Lulu print job ──
    try {
      const lulu = await createLuluPrintJob(orderWithPdfs, log);

      const mappedStatus = lulu.status_name === "CREATED"
        ? "lulu_created"
        : "lulu_" + lulu.status_name.toLowerCase();

      await supabaseAdmin
        .from("print_orders")
        .update({
          lulu_print_job_id: lulu.print_job_id,
          lulu_order_id: lulu.order_id,
          lulu_status: lulu.status_name,
          lulu_cost_incl_tax: lulu.total_cost_incl_tax,
          currency: lulu.currency || "usd",
          status: mappedStatus,
          error_message: null,
        })
        .eq("id", print_order_id);

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
      const isRetryable = luluErr instanceof LuluApiError ? luluErr.retryable : (luluErr instanceof TypeError);

      const errorPrefix = isRetryable ? "transient:" : "validation:";
      const failStatus = isRetryable ? "lulu_retry_exhausted" : "lulu_error";

      log("Lulu job creation failed", { error: errMsg, retryable: isRetryable, failStatus });

      await supabaseAdmin
        .from("print_orders")
        .update({
          status: failStatus,
          error_message: `${errorPrefix} ${errMsg}`,
        })
        .eq("id", print_order_id);

      return json({ error: `${errorPrefix} ${errMsg}`, status: failStatus }, 500);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
