import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

// Plan config keyed by Stripe price ID
const PLAN_CONFIG: Record<string, { plan: string; minutes_limit: number; words_limit: number | null; pdf_enabled: boolean; printing_enabled: boolean; photo_uploads_enabled: boolean }> = {
  // TODO: Replace with actual Stripe price IDs
  "price_digital": {
    plan: "digital",
    minutes_limit: 60,
    words_limit: 30000,
    pdf_enabled: true,
    printing_enabled: false,
    photo_uploads_enabled: false,
  },
  "price_legacy": {
    plan: "legacy",
    minutes_limit: 120,
    words_limit: null,
    pdf_enabled: true,
    printing_enabled: true,
    photo_uploads_enabled: true,
  },
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      log("Missing stripe-signature header");
      return new Response("Missing signature", { status: 400 });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      log("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      log("Signature verification failed", { error: (err as Error).message });
      return new Response("Invalid signature", { status: 400 });
    }

    log("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const storyGroupId = session.metadata?.story_group_id;
      const priceId = session.metadata?.price_id;

      if (!storyGroupId) {
        log("No story_group_id in metadata, skipping (may be print order)");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const planConfig = priceId ? PLAN_CONFIG[priceId] : null;
      if (!planConfig) {
        log("Unknown price_id, skipping", { priceId });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      log("Upgrading story_group", { storyGroupId, plan: planConfig.plan });

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Update the story_group plan (trigger will apply defaults, but we set explicitly for safety)
      const { error: updateErr } = await supabaseAdmin
        .from("story_groups")
        .update({
          plan: planConfig.plan,
          minutes_limit: planConfig.minutes_limit,
          words_limit: planConfig.words_limit,
          watermark: false,
          pdf_enabled: planConfig.pdf_enabled,
          printing_enabled: planConfig.printing_enabled,
          photo_uploads_enabled: planConfig.photo_uploads_enabled,
          archive_at: null,
        })
        .eq("id", storyGroupId);

      if (updateErr) {
        log("Failed to update story_group", { error: updateErr.message });
        return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
      }

      log("Story group upgraded successfully", { storyGroupId, plan: planConfig.plan });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
