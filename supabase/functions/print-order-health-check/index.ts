import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[PRINT-HEALTH] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

const ESCALATE_HOURS = 6;

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

    const now = Date.now();
    const min15ago = new Date(now - 15 * 60 * 1000).toISOString();
    const hours2ago = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const hours6ago = new Date(now - ESCALATE_HOURS * 60 * 60 * 1000).toISOString();

    // Fetch all non-terminal orders
    const { data: orders, error: fetchErr } = await supabaseAdmin
      .from("print_orders")
      .select("id, status, created_at, last_status_change_at, alert_state, error_message")
      .not("status", "in", "(lulu_shipped,lulu_cancelled)");

    if (fetchErr) {
      log("Failed to fetch orders", { error: fetchErr.message });
      return json({ error: fetchErr.message }, 500);
    }

    if (!orders || orders.length === 0) {
      log("No orders to check");
      return json({ total_checked: 0, buckets: {} });
    }

    type Bucket = { count: number; order_ids: string[] };
    const buckets: Record<string, Bucket> = {
      awaiting_pdfs_stale: { count: 0, order_ids: [] },
      stuck_at_printer: { count: 0, order_ids: [] },
      retry_exhausted: { count: 0, order_ids: [] },
      lulu_error: { count: 0, order_ids: [] },
    };

    const toWarn: string[] = [];
    const toEscalate: string[] = [];

    for (const order of orders) {
      const refTime = order.last_status_change_at || order.created_at;
      let flagged = false;

      // Bucket: awaiting_pdfs > 15 min
      if (order.status === "awaiting_pdfs" && refTime < min15ago) {
        buckets.awaiting_pdfs_stale.count++;
        buckets.awaiting_pdfs_stale.order_ids.push(order.id);
        flagged = true;
      }

      // Bucket: stuck at printer statuses > 2 hours without status change
      const stuckStatuses = ["lulu_created", "lulu_unpaid", "lulu_production_delayed"];
      if (stuckStatuses.includes(order.status) && refTime < hours2ago) {
        buckets.stuck_at_printer.count++;
        buckets.stuck_at_printer.order_ids.push(order.id);
        flagged = true;
      }

      // Bucket: retry exhausted
      if (order.status === "lulu_retry_exhausted") {
        buckets.retry_exhausted.count++;
        buckets.retry_exhausted.order_ids.push(order.id);
        flagged = true;
      }

      // Bucket: lulu_error
      if (order.status === "lulu_error") {
        buckets.lulu_error.count++;
        buckets.lulu_error.order_ids.push(order.id);
        flagged = true;
      }

      // Alert state management
      if (flagged) {
        if (order.alert_state === "none") {
          toWarn.push(order.id);
        } else if (order.alert_state === "warned" && refTime < hours6ago) {
          toEscalate.push(order.id);
        }
      }
    }

    // Batch update alert states
    if (toWarn.length > 0) {
      const { error } = await supabaseAdmin
        .from("print_orders")
        .update({ alert_state: "warned" })
        .in("id", toWarn);
      if (error) log("Failed to set warned", { error: error.message });
      else log("Set warned", { count: toWarn.length });
    }

    if (toEscalate.length > 0) {
      const { error } = await supabaseAdmin
        .from("print_orders")
        .update({ alert_state: "escalated" })
        .in("id", toEscalate);
      if (error) log("Failed to set escalated", { error: error.message });
      else log("Set escalated", { count: toEscalate.length });
    }

    const summary = {
      total_checked: orders.length,
      warned: toWarn.length,
      escalated: toEscalate.length,
      buckets,
    };

    log("Health check complete", summary);
    return json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
