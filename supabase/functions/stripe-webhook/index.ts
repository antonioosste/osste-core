import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createLuluPrintJob } from "../_shared/lulu.ts";
import { logAuditEvent } from "../_shared/audit.ts";

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

const PLAN_DEFAULTS: Record<string, { minutes_limit: number; words_limit: number | null; pdf_enabled: boolean; printing_enabled: boolean; photo_uploads_enabled: boolean }> = {
  digital: { minutes_limit: 60, words_limit: 30000, pdf_enabled: true, printing_enabled: false, photo_uploads_enabled: false },
  legacy:  { minutes_limit: 120, words_limit: null, pdf_enabled: true, printing_enabled: true, photo_uploads_enabled: true },
};

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const recordEvent = async (eventId: string, eventType: string, payload: unknown, status: string, errorMessage?: string) => {
    try {
      if (status === "processed" || status === "ignored") {
        await supabaseAdmin.from("stripe_webhook_events").insert({
          event_id: eventId, event_type: eventType, payload: payload as Record<string, unknown>,
          status, error_message: errorMessage || null,
        });
      } else {
        await supabaseAdmin.from("stripe_webhook_events")
          .update({ status, error_message: errorMessage || null })
          .eq("event_id", eventId);
      }
    } catch (e) {
      log("Failed to record webhook event", { eventId, error: (e as Error).message });
    }
  };

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

    // Idempotency check
    const { data: existing } = await supabaseAdmin
      .from("stripe_webhook_events").select("id").eq("event_id", event.id).maybeSingle();

    if (existing) {
      log("Duplicate event, skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan;
      const userId = session.metadata?.user_id;
      const storyGroupId = session.metadata?.story_group_id;
      const metadataType = session.metadata?.type;
      const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

      // ── PRINT ORDER FLOW ──
      if (metadataType === "print") {
        const printOrderId = session.metadata?.print_order_id;
        if (!printOrderId) {
          log("Print order metadata missing print_order_id");
          await recordEvent(event.id, event.type, event.data.object, "ignored");
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        log("Processing print order", { printOrderId });

        // Audit: webhook received
        await logAuditEvent(supabaseAdmin, {
          print_order_id: printOrderId,
          actor_type: "webhook",
          event_type: "webhook_received",
          meta: { stripe_event_id: event.id, stripe_session_id: session.id },
        });

        try {
          const { error: updateErr } = await supabaseAdmin
            .from("print_orders")
            .update({
              status: "paid",
              stripe_session_id: session.id,
              stripe_payment_intent: paymentIntentId || null,
              total_price: session.amount_total ? session.amount_total / 100 : undefined,
              currency: session.currency || "usd",
            })
            .eq("id", printOrderId);

          if (updateErr) {
            await logAuditEvent(supabaseAdmin, {
              print_order_id: printOrderId, actor_type: "webhook", event_type: "error",
              meta: { error: updateErr.message, step: "update_to_paid" },
            });
            await recordEvent(event.id, event.type, event.data.object, "failed", updateErr.message);
            return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
          }

          log("print_orders updated to paid", { printOrderId });

          const { data: orderRow } = await supabaseAdmin
            .from("print_orders").select("*").eq("id", printOrderId).single();

          if (!orderRow) {
            await recordEvent(event.id, event.type, event.data.object, "processed");
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
          }

          if (orderRow.interior_pdf_url && orderRow.cover_pdf_url) {
            try {
              const lulu = await createLuluPrintJob(orderRow, log);
              const mappedStatus = lulu.status_name === "CREATED" ? "lulu_created" : "lulu_" + lulu.status_name.toLowerCase();
              await supabaseAdmin.from("print_orders").update({
                lulu_print_job_id: lulu.print_job_id, lulu_order_id: lulu.order_id,
                lulu_status: lulu.status_name, lulu_cost_incl_tax: lulu.total_cost_incl_tax,
                currency: lulu.currency || "usd", status: mappedStatus,
              }).eq("id", printOrderId);

              await logAuditEvent(supabaseAdmin, {
                print_order_id: printOrderId, actor_type: "webhook", event_type: "lulu_submit",
                new_values: { lulu_print_job_id: lulu.print_job_id, status: mappedStatus },
              });
            } catch (luluErr) {
              const errMsg = luluErr instanceof Error ? luluErr.message : String(luluErr);
              await supabaseAdmin.from("print_orders").update({ status: "lulu_error", error_message: errMsg }).eq("id", printOrderId);
              await logAuditEvent(supabaseAdmin, {
                print_order_id: printOrderId, actor_type: "webhook", event_type: "error",
                meta: { error: errMsg, step: "lulu_submit" },
              });
            }
          } else {
            await supabaseAdmin.from("print_orders").update({ status: "awaiting_pdfs" }).eq("id", printOrderId);
          }

          await recordEvent(event.id, event.type, event.data.object, "processed");
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (printErr) {
          const msg = printErr instanceof Error ? printErr.message : String(printErr);
          await recordEvent(event.id, event.type, event.data.object, "failed", msg);
          return new Response(JSON.stringify({ error: msg }), { status: 500 });
        }
      }

      // ── GIFT PURCHASE FLOW ──
      if (metadataType === "gift") {
        const giftPlan = plan || "digital";
        const recipientEmail = session.metadata?.recipient_email || "";
        const recipientName = session.metadata?.recipient_name || "";
        const senderEmail = session.metadata?.sender_email || "";
        const senderName = session.metadata?.sender_name || "";
        const personalMessage = session.metadata?.personal_message || "";

        try {
          const { data: existingGift } = await supabaseAdmin
            .from("gift_invitations").select("id").eq("stripe_session_id", session.id).maybeSingle();

          if (existingGift) {
            await recordEvent(event.id, event.type, event.data.object, "ignored");
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
          }

          const { data: invitation, error: insertErr } = await supabaseAdmin
            .from("gift_invitations").insert({
              status: "paid", plan: giftPlan, recipient_email: recipientEmail,
              recipient_name: recipientName || null, sender_email: senderEmail,
              sender_name: senderName || null, personal_message: personalMessage || null,
              stripe_session_id: session.id,
              stripe_payment_intent: paymentIntentId || null, amount_paid: session.amount_total,
            }).select("id").single();

          if (insertErr) {
            await recordEvent(event.id, event.type, event.data.object, "failed", insertErr.message);
            return new Response(JSON.stringify({ error: "Failed to create gift invitation" }), { status: 500 });
          }

          try {
            const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-gift-invitation`;
            await fetch(fnUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
              body: JSON.stringify({ giftId: invitation.id, recipientEmail, recipientName, senderEmail, senderName, personalMessage }),
            });
          } catch (_) { /* non-fatal */ }

          await recordEvent(event.id, event.type, event.data.object, "processed");
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (giftErr) {
          const msg = giftErr instanceof Error ? giftErr.message : String(giftErr);
          await recordEvent(event.id, event.type, event.data.object, "failed", msg);
          return new Response(JSON.stringify({ error: msg }), { status: 500 });
        }
      }

      // ── SELF-PURCHASE FLOW ──
      if (!plan || !PLAN_DEFAULTS[plan]) {
        await recordEvent(event.id, event.type, event.data.object, "ignored");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const planConfig = PLAN_DEFAULTS[plan];

      try {
        if (userId && paymentIntentId) {
          await supabaseAdmin.from("user_billing").upsert({
            user_id: userId, provider: "stripe", stripe_customer_id: stripeCustomerId || null,
            stripe_payment_intent_id: paymentIntentId, stripe_checkout_session_id: session.id,
            stripe_price_id: session.metadata?.price_id || null, plan,
            payment_status: session.payment_status || "paid", amount_paid: session.amount_total,
            currency: session.currency || "usd", is_manual: false,
          }, { onConflict: "stripe_payment_intent_id" });
        }

        if (storyGroupId) {
          const { error: updateErr } = await supabaseAdmin.from("story_groups").update({
            plan, minutes_limit: planConfig.minutes_limit, words_limit: planConfig.words_limit,
            watermark: false, pdf_enabled: planConfig.pdf_enabled,
            printing_enabled: planConfig.printing_enabled, photo_uploads_enabled: planConfig.photo_uploads_enabled,
            archive_at: null,
          }).eq("id", storyGroupId);

          if (updateErr) {
            await recordEvent(event.id, event.type, event.data.object, "failed", updateErr.message);
            return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
          }
        } else if (userId) {
          const { data: freeGroups } = await supabaseAdmin
            .from("story_groups").select("id").eq("user_id", userId).eq("plan", "free");
          if (freeGroups && freeGroups.length > 0) {
            const groupIds = freeGroups.map((g: { id: string }) => g.id);
            await supabaseAdmin.from("story_groups").update({ plan }).in("id", groupIds);
          }
        }

        if (userId) {
          await supabaseAdmin.from("profiles").update({ plan }).eq("id", userId);
          
          // Send payment success email (non-blocking)
          try {
            const { data: profile } = await supabaseAdmin.from("profiles").select("email, name").eq("id", userId).single();
            if (profile?.email) {
              const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`;
              await fetch(fnUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
                body: JSON.stringify({
                  type: "paymentSuccess",
                  email: profile.email,
                  firstName: profile.name || undefined,
                  amount: session.amount_total || 0,
                  currency: session.currency || "usd",
                  planName: plan === "legacy" ? "Legacy Story Plan" : "Digital Story Plan",
                  idempotencyKey: `paymentSuccess:${event.id}`,
                }),
              });
            }
          } catch (emailErr) {
            log("Payment email send failed (non-fatal)", { error: (emailErr as Error).message });
          }
        }

        await recordEvent(event.id, event.type, event.data.object, "processed");
      } catch (selfErr) {
        const msg = selfErr instanceof Error ? selfErr.message : String(selfErr);
        await recordEvent(event.id, event.type, event.data.object, "failed", msg);
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
      }
    } else {
      await recordEvent(event.id, event.type, event.data.object, "ignored");
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
