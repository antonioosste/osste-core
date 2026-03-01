import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CUSTOMER-PORTAL] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) return new Response(JSON.stringify({ error: "unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

    const user = userData.user;
    log("User authenticated", { userId: user.id });

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // ── Single query: latest billing row ──
    const { data: billing } = await supabaseAdmin
      .from("user_billing")
      .select("stripe_customer_id, is_manual, provider, plan")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // No billing row → free user
    if (!billing) {
      log("No billing record (free user)", { userId: user.id });
      return new Response(JSON.stringify({ error: "no_billing_record" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Manual user without Stripe customer
    if (billing.is_manual && !billing.stripe_customer_id) {
      log("Manual billing user", { userId: user.id });
      return new Response(JSON.stringify({ error: "manual_billing" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Has billing row but no Stripe customer (edge case)
    if (!billing.stripe_customer_id) {
      log("Billing row without Stripe customer", { userId: user.id });
      return new Response(JSON.stringify({ error: "no_stripe_customer" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // ── Open Stripe portal ──
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://osste-core.lovable.app";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    log("Portal session created", { url: portalSession.url });
    return new Response(JSON.stringify({ url: portalSession.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("ERROR", { errorMessage });
    return new Response(JSON.stringify({ error: "internal_error", message: errorMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  }
});
