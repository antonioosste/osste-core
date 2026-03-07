import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getLuluAccessToken } from "../_shared/lulu.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[LULU-SYNC] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const useSandbox = Deno.env.get("LULU_USE_SANDBOX") === "true";
    const apiBase = useSandbox
      ? "https://api.sandbox.lulu.com"
      : "https://api.lulu.com";

    // Fetch active print orders with Lulu jobs
    const activeStatuses = [
      "lulu_created",
      "lulu_unpaid",
      "lulu_accepted",
      "lulu_in_production",
      "paid",
      "awaiting_pdfs",
    ];

    const { data: orders, error: fetchErr } = await supabaseAdmin
      .from("print_orders")
      .select("id, lulu_print_job_id, status")
      .not("lulu_print_job_id", "is", null)
      .in("status", activeStatuses);

    if (fetchErr) {
      log("Failed to fetch orders", { error: fetchErr.message });
      return json({ error: fetchErr.message }, 500);
    }

    if (!orders || orders.length === 0) {
      log("No active orders to sync");
      return json({ processed_count: 0, updated_count: 0, error_count: 0, errors: [] });
    }

    log("Orders to sync", { count: orders.length });

    const accessToken = await getLuluAccessToken();

    let updatedCount = 0;
    let errorCount = 0;
    const errors: { print_order_id: string; error: string }[] = [];

    for (const order of orders) {
      try {
        const resp = await fetch(
          `${apiBase}/print-jobs/${order.lulu_print_job_id}/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Lulu API ${resp.status}: ${text}`);
        }

        const job = await resp.json();
        const statusName = job.status?.name || "UNKNOWN";
        const mappedStatus = "lulu_" + statusName.toLowerCase();

        // Extract tracking from first line item
        const firstItem = job.line_items?.[0];
        const trackingId = firstItem?.tracking_id || null;
        const trackingUrl = firstItem?.tracking_urls?.[0] || null;
        const carrierName = firstItem?.carrier_name || null;

        const updatePayload: Record<string, unknown> = {
          lulu_status: statusName,
          status: mappedStatus,
          error_message: null,
        };

        if (job.order_id) updatePayload.lulu_order_id = String(job.order_id);
        if (job.costs?.total_cost_incl_tax != null)
          updatePayload.lulu_cost_incl_tax = Number(job.costs.total_cost_incl_tax);
        if (job.costs?.currency) updatePayload.currency = job.costs.currency;
        if (trackingId) updatePayload.tracking_id = trackingId;
        if (trackingUrl) updatePayload.tracking_url = trackingUrl;
        if (carrierName) updatePayload.carrier_name = carrierName;

        const { error: updateErr } = await supabaseAdmin
          .from("print_orders")
          .update(updatePayload)
          .eq("id", order.id);

        if (updateErr) {
          throw new Error(`DB update failed: ${updateErr.message}`);
        }

        log("Synced order", { id: order.id, status: mappedStatus, trackingId });
        updatedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log("Error syncing order", { id: order.id, error: msg });
        errorCount++;
        errors.push({ print_order_id: order.id, error: msg });

        // Write error to the row but don't stop processing
        await supabaseAdmin
          .from("print_orders")
          .update({ error_message: msg })
          .eq("id", order.id);
      }
    }

    const summary = {
      processed_count: orders.length,
      updated_count: updatedCount,
      error_count: errorCount,
      errors,
    };

    log("Sync complete", summary);
    return json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
