import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createLuluPrintJob, LuluApiError } from "../_shared/lulu.ts";
import { logAuditEvent } from "../_shared/audit.ts";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseClient.auth.getClaims(token);

    let callerUserId: string | null = null;
    let isServiceRole = false;

    if (claimsErr || !claimsData?.claims) {
      if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
        isServiceRole = true;
      } else {
        return json({ error: "Unauthorized" }, 401);
      }
    } else {
      callerUserId = claimsData.claims.sub as string;
    }

    const { print_order_id, interior_pdf_url, cover_pdf_url } = await req.json();
    if (!print_order_id) return json({ error: "print_order_id is required" }, 400);
    if (!interior_pdf_url) return json({ error: "interior_pdf_url is required" }, 400);
    if (!cover_pdf_url) return json({ error: "cover_pdf_url is required" }, 400);

    log("Request received", { print_order_id, callerUserId, isServiceRole });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("print_orders").select("*").eq("id", print_order_id).single();

    if (fetchErr || !order) return json({ error: "print_order not found" }, 404);
    if (!isServiceRole && order.user_id !== callerUserId) return json({ error: "Forbidden" }, 403);

    // Idempotent
    if (order.lulu_print_job_id) {
      return json({
        ok: true, idempotent: true,
        order: { id: order.id, status: order.status, lulu_print_job_id: order.lulu_print_job_id, lulu_order_id: order.lulu_order_id, lulu_status: order.lulu_status },
      });
    }

    // Optimistic guard
    const allowedStatuses = ["paid", "awaiting_pdfs", "lulu_error"];
    const { data: guardRows } = await supabaseAdmin
      .from("print_orders")
      .update({ status: "lulu_submitting", last_submit_at: new Date().toISOString(), submit_attempts: (order.submit_attempts ?? 0) + 1 })
      .eq("id", print_order_id).in("status", allowedStatuses).select("id");

    if (!guardRows || guardRows.length === 0) {
      return json({ ok: false, error: "conflict", message: `Order is '${order.status}', cannot submit.` }, 409);
    }

    await supabaseAdmin.from("print_orders").update({ interior_pdf_url, cover_pdf_url }).eq("id", print_order_id);

    // Validate format + trim_size before attempting Lulu submit
    const { isValidFormat, isValidTrimSize, getPodPackageId } = await import("../_shared/luluPackages.ts");
    if (!isValidFormat(order.format)) {
      await supabaseAdmin.from("print_orders").update({ status: "lulu_error", error_message: `Invalid format: '${order.format}'` }).eq("id", print_order_id);
      return json({ error: `Invalid format: '${order.format}'` }, 400);
    }
    if (!isValidTrimSize(order.trim_size)) {
      await supabaseAdmin.from("print_orders").update({ status: "lulu_error", error_message: `Invalid trim_size: '${order.trim_size}'` }).eq("id", print_order_id);
      return json({ error: `Invalid trim_size: '${order.trim_size}'` }, 400);
    }

    let resolvedPodPackageId: string;
    try {
      resolvedPodPackageId = getPodPackageId(order.format, order.trim_size);
    } catch (pkgErr) {
      const msg = pkgErr instanceof Error ? pkgErr.message : String(pkgErr);
      await supabaseAdmin.from("print_orders").update({ status: "lulu_error", error_message: msg }).eq("id", print_order_id);
      return json({ error: msg }, 400);
    }

    const orderWithPdfs = { ...order, interior_pdf_url, cover_pdf_url };

    try {
      const lulu = await createLuluPrintJob(orderWithPdfs, log);
      const mappedStatus = lulu.status_name === "CREATED" ? "lulu_created" : "lulu_" + lulu.status_name.toLowerCase();

      await supabaseAdmin.from("print_orders").update({
        lulu_print_job_id: lulu.print_job_id, lulu_order_id: lulu.order_id,
        lulu_status: lulu.status_name, lulu_cost_incl_tax: lulu.total_cost_incl_tax,
        currency: lulu.currency || "usd", status: mappedStatus, error_message: null,
        pod_package_id: resolvedPodPackageId,
      }).eq("id", print_order_id);

      await logAuditEvent(supabaseAdmin, {
        print_order_id, actor_type: isServiceRole ? "system" : "user", actor_id: callerUserId,
        event_type: "lulu_submit",
        old_values: { status: order.status },
        new_values: { status: mappedStatus, lulu_print_job_id: lulu.print_job_id },
      });

      return json({
        ok: true, order: {
          id: print_order_id, status: mappedStatus, lulu_print_job_id: lulu.print_job_id,
          lulu_order_id: lulu.order_id, lulu_status: lulu.status_name,
          lulu_cost_incl_tax: lulu.total_cost_incl_tax, currency: lulu.currency,
        },
      });
    } catch (luluErr) {
      const errMsg = luluErr instanceof Error ? luluErr.message : String(luluErr);
      const isRetryable = luluErr instanceof LuluApiError ? luluErr.retryable : (luluErr instanceof TypeError);
      const errorPrefix = isRetryable ? "transient:" : "validation:";
      const failStatus = isRetryable ? "lulu_retry_exhausted" : "lulu_error";

      await supabaseAdmin.from("print_orders").update({ status: failStatus, error_message: `${errorPrefix} ${errMsg}` }).eq("id", print_order_id);

      await logAuditEvent(supabaseAdmin, {
        print_order_id, actor_type: isServiceRole ? "system" : "user", actor_id: callerUserId,
        event_type: "error",
        old_values: { status: order.status },
        new_values: { status: failStatus },
        meta: { error: errMsg, retryable: isRetryable },
      });

      return json({ error: `${errorPrefix} ${errMsg}`, status: failStatus }, 500);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
