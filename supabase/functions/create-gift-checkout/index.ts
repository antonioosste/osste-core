import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-GIFT-CHECKOUT] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { plan, recipient_email, recipient_name, sender_email, sender_name, personal_message } = await req.json();

    if (!plan || !recipient_email || !sender_email) {
      return new Response(
        JSON.stringify({ error: "missing_fields", message: "plan, recipient_email, and sender_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PLAN_PRICES: Record<string, { priceId: string }> = {
      digital: { priceId: Deno.env.get("STRIPE_PRICE_DIGITAL") || "" },
      legacy:  { priceId: Deno.env.get("STRIPE_PRICE_LEGACY") || "" },
    };

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig || !planConfig.priceId) {
      return new Response(
        JSON.stringify({ error: "invalid_plan", message: `Invalid plan: ${plan}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });

    const rawSiteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://osste.com";
    const siteUrl = rawSiteUrl.replace(/\/+$/, "");

    // Stripe metadata values max 500 chars
    const safeMessage = typeof personal_message === "string" ? personal_message.slice(0, 500) : "";

    const metadata: Record<string, string> = {
      type: "gift",
      plan,
      recipient_email,
      recipient_name: recipient_name || "",
      sender_email,
      sender_name: sender_name || "",
      personal_message: safeMessage,
    };

    const session = await stripe.checkout.sessions.create({
      customer_email: sender_email,
      mode: "payment",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: siteUrl + "/gift/confirmation?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: siteUrl + "/gift?cancelled=true",
      metadata,
    });

    log("Gift checkout session created", { sessionId: session.id, plan, recipientEmail: recipient_email });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
