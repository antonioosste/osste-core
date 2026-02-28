import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-PLAN-CHECKOUT] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, story_group_id } = await req.json();

    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Missing plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve price IDs from environment secrets
    const PLAN_PRICES: Record<string, { priceId: string; amount: number }> = {
      digital: { priceId: Deno.env.get("STRIPE_PRICE_DIGITAL") || "", amount: 3900 },
      legacy: { priceId: Deno.env.get("STRIPE_PRICE_LEGACY") || "", amount: 12900 },
    };

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig || !planConfig.priceId) {
      return new Response(
        JSON.stringify({ error: `Invalid plan or missing price ID for: ${plan}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user?.email) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const user = userData.user;
    log("User authenticated", { userId: user.id, email: user.email });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // If story_group_id provided, verify ownership
    if (story_group_id) {
      const { data: sg, error: sgErr } = await supabaseAdmin
        .from("story_groups")
        .select("id, user_id, plan")
        .eq("id", story_group_id)
        .single();

      if (sgErr || !sg) {
        return new Response(
          JSON.stringify({ error: "Story group not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (sg.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Not authorized for this story group" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (sg.plan === plan) {
        return new Response(
          JSON.stringify({ error: `Story group is already on the ${plan} plan` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    log("Creating checkout session", { plan, storyGroupId: story_group_id || "none" });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const rawSiteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://example.com";
    const siteUrl = rawSiteUrl.replace(/\/+$/, ""); // strip trailing slashes

    const metadata: Record<string, string> = {
      price_id: planConfig.priceId,
      plan,
      user_id: user.id,
    };
    if (story_group_id) {
      metadata.story_group_id = story_group_id;
    }

    // Build URLs manually to avoid URLSearchParams encoding {CHECKOUT_SESSION_ID}
    const successParts = [`plan=${encodeURIComponent(plan)}`];
    if (story_group_id) successParts.push(`story_group_id=${encodeURIComponent(story_group_id)}`);
    successParts.push("session_id={CHECKOUT_SESSION_ID}");

    const cancelParts = [`plan=${encodeURIComponent(plan)}`];
    if (story_group_id) cancelParts.push(`story_group_id=${encodeURIComponent(story_group_id)}`);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/checkout/success?${successParts.join("&")}`,
      cancel_url: `${siteUrl}/checkout/cancel?${cancelParts.join("&")}`,
      metadata,
    });

    log("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
