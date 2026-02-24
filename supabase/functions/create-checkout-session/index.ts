import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Parse & validate input ──────────────────────────────────────
    const { print_order_id, amount_cents, currency, customer_email } = await req.json();

    if (!print_order_id || !amount_cents || !currency || !customer_email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields: print_order_id, amount_cents, currency, customer_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof amount_cents !== "number" || amount_cents <= 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "amount_cents must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    log("Input validated", { print_order_id, amount_cents, currency, customer_email });

    // ── 2. Read existing print_orders row ──────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("print_orders")
      .select("id")
      .eq("id", print_order_id)
      .single();

    if (fetchErr || !order) {
      log("Order not found", { print_order_id, fetchErr });
      return new Response(
        JSON.stringify({ ok: false, error: "print_order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    log("Order found", { id: order.id });

    // ── 3. Create Stripe Checkout Session ──────────────────────────────
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const siteUrl = Deno.env.get("SITE_URL") || "https://example.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount_cents,
            product_data: { name: "OSSTE Paperback Printing" },
          },
        },
      ],
      success_url: `${siteUrl}/print/success?order_id=${print_order_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/print/cancel?order_id=${print_order_id}`,
      metadata: { print_order_id },
    });

    log("Stripe session created", { sessionId: session.id });

    // ── 4. Update print_orders row ─────────────────────────────────────
    const { error: updateErr } = await supabaseAdmin
      .from("print_orders")
      .update({
        stripe_session_id: session.id,
        currency,
        total_price: amount_cents / 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", print_order_id);

    if (updateErr) {
      log("Failed to update print_orders", updateErr);
      // Still return the URL – payment can proceed
    }

    // ── 5. Return ──────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        ok: true,
        checkout_url: session.url,
        checkout_session_id: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
