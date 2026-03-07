import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getLuluAccessToken, fetchWithRetry, createLuluPrintJob, LuluApiError } from "../_shared/lulu.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ADMIN-PRINT-ACTION] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

const VALID_ACTIONS = ["retry_lulu_submit", "force_sync", "update_pdfs", "mark_needs_review", "requeue_webhook"] as const;
type Action = typeof VALID_ACTIONS[number];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    // ── Auth: require admin ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const adminUserId = claimsData.claims.sub as string;

    // Check admin role via service-role client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      log("Non-admin attempted action", { userId: adminUserId });
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    // ── Parse input ──
    const { print_order_id, action, payload } = await req.json();

    if (!print_order_id) return json({ error: "print_order_id is required" }, 400);
    if (!action || !VALID_ACTIONS.includes(action)) {
      return json({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` }, 400);
    }

    log("Action requested", { adminUserId, print_order_id, action });

    // ── Load order ──
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("print_orders")
      .select("*")
      .eq("id", print_order_id)
      .single();

    if (fetchErr || !order) return json({ error: "print_order not found" }, 404);

    // ── Write audit row ──
    await supabaseAdmin.from("print_order_admin_actions").insert({
      print_order_id,
      admin_user_id: adminUserId,
      action,
      payload: payload || null,
    });

    // ── Execute action ──
    let result: Record<string, unknown> = {};

    switch (action as Action) {
      case "retry_lulu_submit": {
        // Reset status to allow re-submission, then invoke submit function
        await supabaseAdmin
          .from("print_orders")
          .update({ status: "paid", error_message: null, lulu_print_job_id: null })
          .eq("id", print_order_id);

        const interiorUrl = payload?.interior_pdf_url || order.interior_pdf_url;
        const coverUrl = payload?.cover_pdf_url || order.cover_pdf_url;

        if (!interiorUrl || !coverUrl) {
          result = { ok: false, error: "Missing PDF URLs. Provide interior_pdf_url and cover_pdf_url in payload or ensure they exist on the order." };
          break;
        }

        try {
          const lulu = await createLuluPrintJob({ ...order, interior_pdf_url: interiorUrl, cover_pdf_url: coverUrl }, log);
          const mappedStatus = lulu.status_name === "CREATED" ? "lulu_created" : "lulu_" + lulu.status_name.toLowerCase();

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
              interior_pdf_url: interiorUrl,
              cover_pdf_url: coverUrl,
              last_submit_at: new Date().toISOString(),
              submit_attempts: (order.submit_attempts ?? 0) + 1,
            })
            .eq("id", print_order_id);

          result = { ok: true, lulu_print_job_id: lulu.print_job_id, status: mappedStatus };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const isRetryable = err instanceof LuluApiError ? err.retryable : false;
          await supabaseAdmin
            .from("print_orders")
            .update({ status: isRetryable ? "lulu_retry_exhausted" : "lulu_error", error_message: msg })
            .eq("id", print_order_id);
          result = { ok: false, error: msg };
        }
        break;
      }

      case "force_sync": {
        if (!order.lulu_print_job_id) {
          result = { ok: false, error: "No lulu_print_job_id on this order" };
          break;
        }

        const useSandbox = Deno.env.get("LULU_USE_SANDBOX") === "true";
        const apiBase = useSandbox ? "https://api.sandbox.lulu.com" : "https://api.lulu.com";
        const accessToken = await getLuluAccessToken();

        try {
          const resp = await fetchWithRetry(
            `${apiBase}/print-jobs/${order.lulu_print_job_id}/`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
            log,
          );
          const job = await resp.json();
          const statusName = job.status?.name || "UNKNOWN";
          const mappedStatus = "lulu_" + statusName.toLowerCase();
          const firstItem = job.line_items?.[0];

          const updatePayload: Record<string, unknown> = {
            lulu_status: statusName,
            status: mappedStatus,
            error_message: null,
            last_synced_at: new Date().toISOString(),
            sync_attempts: (order.sync_attempts ?? 0) + 1,
            last_sync_error: null,
          };
          if (mappedStatus !== order.status) updatePayload.last_status_change_at = new Date().toISOString();
          if (job.order_id) updatePayload.lulu_order_id = String(job.order_id);
          if (job.costs?.total_cost_incl_tax != null) updatePayload.lulu_cost_incl_tax = Number(job.costs.total_cost_incl_tax);
          if (job.costs?.currency) updatePayload.currency = job.costs.currency;
          if (firstItem?.tracking_id) updatePayload.tracking_id = firstItem.tracking_id;
          if (firstItem?.tracking_urls?.[0]) updatePayload.tracking_url = firstItem.tracking_urls[0];
          if (firstItem?.carrier_name) updatePayload.carrier_name = firstItem.carrier_name;

          await supabaseAdmin.from("print_orders").update(updatePayload).eq("id", print_order_id);
          result = { ok: true, status: mappedStatus, lulu_status: statusName };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result = { ok: false, error: msg };
        }
        break;
      }

      case "update_pdfs": {
        const { interior_pdf_url, cover_pdf_url } = payload || {};
        if (!interior_pdf_url && !cover_pdf_url) {
          result = { ok: false, error: "Provide interior_pdf_url and/or cover_pdf_url in payload" };
          break;
        }
        const update: Record<string, unknown> = {};
        if (interior_pdf_url) update.interior_pdf_url = interior_pdf_url;
        if (cover_pdf_url) update.cover_pdf_url = cover_pdf_url;

        const { error } = await supabaseAdmin.from("print_orders").update(update).eq("id", print_order_id);
        result = error ? { ok: false, error: error.message } : { ok: true, updated: Object.keys(update) };
        break;
      }

      case "mark_needs_review": {
        const note = payload?.note || "Flagged by admin";
        const { error } = await supabaseAdmin
          .from("print_orders")
          .update({ status: "needs_manual_review", error_message: note, last_status_change_at: new Date().toISOString() })
          .eq("id", print_order_id);
        result = error ? { ok: false, error: error.message } : { ok: true, status: "needs_manual_review" };
        break;
      }

      case "requeue_webhook": {
        // Clear webhook-related failure markers and reset to paid for reprocessing
        const { error } = await supabaseAdmin
          .from("print_orders")
          .update({
            status: "paid",
            error_message: null,
            alert_state: "none",
          })
          .eq("id", print_order_id);
        result = error ? { ok: false, error: error.message } : { ok: true, status: "paid", message: "Order reset to paid for reprocessing" };
        break;
      }
    }

    // Update audit row with result
    await supabaseAdmin
      .from("print_order_admin_actions")
      .update({ result: result as Record<string, unknown> })
      .eq("print_order_id", print_order_id)
      .eq("admin_user_id", adminUserId)
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(1);

    log("Action completed", { action, print_order_id, result });
    return json({ action, print_order_id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
