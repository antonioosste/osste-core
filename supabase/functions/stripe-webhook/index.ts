import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

const PLAN_DEFAULTS: Record<string, { minutes_limit: number; words_limit: number | null; pdf_enabled: boolean; printing_enabled: boolean; photo_uploads_enabled: boolean }> = {
  digital: { minutes_limit: 60, words_limit: 30000, pdf_enabled: true, printing_enabled: false, photo_uploads_enabled: false },
  legacy:  { minutes_limit: 120, words_limit: null, pdf_enabled: true, printing_enabled: true, photo_uploads_enabled: true },
};

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) { log("Missing stripe-signature"); return new Response("Missing signature", { status: 400 }); }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) { log("STRIPE_WEBHOOK_SECRET not configured"); return new Response("Webhook secret not configured", { status: 500 }); }

    let event: Stripe.Event;
    try { event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret); }
    catch (err) { log("Signature verification failed", { error: (err as Error).message }); return new Response("Invalid signature", { status: 400 }); }

    log("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan;
      const userId = session.metadata?.user_id;
      const storyGroupId = session.metadata?.story_group_id;
      const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

      if (!plan || !PLAN_DEFAULTS[plan]) {
        log("No valid plan in metadata, skipping (may be print order)", { plan });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const planConfig = PLAN_DEFAULTS[plan];
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

      // ── Idempotent billing upsert (keyed on stripe_payment_intent_id) ──
      if (userId && paymentIntentId) {
        const { error: billingErr } = await supabaseAdmin
          .from("user_billing")
          .upsert({
            user_id: userId,
            provider: "stripe",
            stripe_customer_id: stripeCustomerId || null,
            stripe_payment_intent_id: paymentIntentId,
            stripe_checkout_session_id: session.id,
            stripe_price_id: session.metadata?.price_id || null,
            plan,
            payment_status: session.payment_status || "paid",
            amount_paid: session.amount_total,
            currency: session.currency || "usd",
            is_manual: false,
          }, { onConflict: "stripe_payment_intent_id" });

        if (billingErr) log("Failed to upsert user_billing", { error: billingErr.message });
        else log("user_billing upserted", { userId, plan, paymentIntentId });
      }

      // ── Update story_groups ──
      if (storyGroupId) {
        log("Upgrading story_group", { storyGroupId, plan });
        const { error: updateErr } = await supabaseAdmin
          .from("story_groups")
          .update({
            plan, minutes_limit: planConfig.minutes_limit, words_limit: planConfig.words_limit,
            watermark: false, pdf_enabled: planConfig.pdf_enabled,
            printing_enabled: planConfig.printing_enabled, photo_uploads_enabled: planConfig.photo_uploads_enabled,
            archive_at: null,
          })
          .eq("id", storyGroupId);

        if (updateErr) {
          log("Failed to update story_group", { error: updateErr.message });
          return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
        }
        log("Story group upgraded", { storyGroupId, plan });
      } else if (userId) {
        log("Account-level purchase", { userId, plan });
        const { data: freeGroups, error: fetchErr } = await supabaseAdmin
          .from("story_groups").select("id").eq("user_id", userId).eq("plan", "free");

        if (fetchErr) log("Failed to fetch free groups", { error: fetchErr.message });
        else if (freeGroups && freeGroups.length > 0) {
          const groupIds = freeGroups.map((g: { id: string }) => g.id);
          const { error: upgradeErr } = await supabaseAdmin.from("story_groups").update({ plan }).in("id", groupIds);
          if (upgradeErr) log("Failed to upgrade groups", { error: upgradeErr.message });
          else log("Groups upgraded", { count: groupIds.length, plan });
        }
      }

      // ── Update profiles.plan ──
      if (userId) {
        const { error: profileErr } = await supabaseAdmin.from("profiles").update({ plan }).eq("id", userId);
        if (profileErr) log("Failed to update profile", { error: profileErr.message });
        else log("Profile updated", { userId, plan });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
