import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

const PLAN_DEFAULTS: Record<string, { minutes_limit: number; words_limit: number | null; pdf_enabled: boolean; printing_enabled: boolean; photo_uploads_enabled: boolean }> = {
  digital: { minutes_limit: 60, words_limit: 30000, pdf_enabled: true, printing_enabled: false, photo_uploads_enabled: false },
  legacy:  { minutes_limit: 120, words_limit: null, pdf_enabled: true, printing_enabled: true, photo_uploads_enabled: true },
};

// ── Lulu Helper ──────────────────────────────────────────────────────────────

interface LuluResult {
  print_job_id: string;
  order_id: string;
  status_name: string;
  total_cost_incl_tax: number | null;
  currency: string | null;
}

async function getLuluAccessToken(): Promise<string> {
  const clientKey = Deno.env.get("LULU_CLIENT_KEY")!;
  const clientSecret = Deno.env.get("LULU_CLIENT_SECRET")!;
  const useSandbox = Deno.env.get("LULU_USE_SANDBOX") === "true";
  const tokenUrl = useSandbox
    ? "https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token"
    : "https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token";

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientKey,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Lulu auth failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.access_token;
}

async function createLuluPrintJob(order: Record<string, unknown>): Promise<LuluResult> {
  const useSandbox = Deno.env.get("LULU_USE_SANDBOX") === "true";
  const apiBase = useSandbox ? "https://api.sandbox.lulu.com" : "https://api.lulu.com";
  const podPackageId = Deno.env.get("LULU_POD_PACKAGE_ID") || "0600X0900BWSTDPB060UW444MXX";

  const accessToken = await getLuluAccessToken();

  const interiorUrl = order.interior_pdf_url as string;
  const coverUrl = order.cover_pdf_url as string;

  if (!interiorUrl || !coverUrl) {
    throw new Error("Missing interior_pdf_url or cover_pdf_url on print_orders row");
  }

  const payload = {
    contact_email: "stories@osste.com",
    external_id: order.id as string,
    line_items: [
      {
        external_id: order.id as string,
        printable_normalization: { cover: { source_url: coverUrl }, interior: { source_url: interiorUrl } },
        pod_package_id: podPackageId,
        quantity: order.quantity as number,
        title: order.book_title as string,
      },
    ],
    production_delay: 120,
    shipping_address: {
      city: order.shipping_city as string,
      country_code: (order.shipping_country as string) || "US",
      name: order.shipping_name as string,
      phone_number: "",
      postcode: order.shipping_zip as string,
      state_code: order.shipping_state as string,
      street1: order.shipping_address as string,
    },
    shipping_level: "MAIL",
  };

  log("Lulu payload", payload);

  const resp = await fetch(`${apiBase}/print-jobs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Lulu API error (${resp.status}): ${text}`);
  }

  const job = JSON.parse(text);
  log("Lulu print job created", { id: job.id, status: job.status?.name });

  return {
    print_job_id: String(job.id),
    order_id: job.order_id ? String(job.order_id) : "",
    status_name: job.status?.name || "CREATED",
    total_cost_incl_tax: job.costs?.total_cost_incl_tax ? Number(job.costs.total_cost_incl_tax) : null,
    currency: job.costs?.currency || null,
  };
}

// ── Webhook Handler ──────────────────────────────────────────────────────────

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
      const metadataType = session.metadata?.type;
      const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

      // ── PRINT ORDER FLOW ──
      if (metadataType === "print") {
        const printOrderId = session.metadata?.print_order_id;
        if (!printOrderId) {
          log("Print order metadata missing print_order_id");
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        log("Processing print order", { printOrderId });

        // Update print_orders with payment info
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
          log("Failed to update print_orders to paid", { error: updateErr.message });
          return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
        }

        log("print_orders updated to paid", { printOrderId });

        // Attempt Lulu job creation
        const { data: orderRow, error: fetchErr } = await supabaseAdmin
          .from("print_orders")
          .select("*")
          .eq("id", printOrderId)
          .single();

        if (fetchErr || !orderRow) {
          log("Failed to fetch print_orders row for Lulu", { error: fetchErr?.message });
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        // Only create Lulu job if PDFs are ready
        if (orderRow.interior_pdf_url && orderRow.cover_pdf_url) {
          try {
            const lulu = await createLuluPrintJob(orderRow);
            await supabaseAdmin
              .from("print_orders")
              .update({
                lulu_print_job_id: lulu.print_job_id,
                lulu_order_id: lulu.order_id,
                lulu_status: lulu.status_name,
                lulu_cost_incl_tax: lulu.total_cost_incl_tax,
                currency: lulu.currency || "usd",
                status: lulu.status_name === "CREATED" ? "lulu_created" : "lulu_" + lulu.status_name.toLowerCase(),
              })
              .eq("id", printOrderId);

            log("Lulu job created and saved", { printOrderId, luluJobId: lulu.print_job_id });
          } catch (luluErr) {
            const errMsg = luluErr instanceof Error ? luluErr.message : String(luluErr);
            log("Lulu job creation failed", { error: errMsg });
            await supabaseAdmin
              .from("print_orders")
              .update({ status: "lulu_error", error_message: errMsg })
              .eq("id", printOrderId);
          }
        } else {
          log("PDFs not yet available, marking as awaiting_pdfs", { printOrderId });
          await supabaseAdmin
            .from("print_orders")
            .update({ status: "awaiting_pdfs" })
            .eq("id", printOrderId);
        }

        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // ── GIFT PURCHASE FLOW ──
      if (metadataType === "gift") {
        const giftPlan = plan || "digital";
        const recipientEmail = session.metadata?.recipient_email || "";
        const recipientName = session.metadata?.recipient_name || "";
        const senderEmail = session.metadata?.sender_email || "";
        const senderName = session.metadata?.sender_name || "";

        log("Processing gift purchase", { giftPlan, recipientEmail, senderEmail });

        const { data: existing } = await supabaseAdmin
          .from("gift_invitations")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (existing) {
          log("Gift invitation already exists for this session, skipping", { id: existing.id });
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        const { data: invitation, error: insertErr } = await supabaseAdmin
          .from("gift_invitations")
          .insert({
            status: "paid",
            plan: giftPlan,
            recipient_email: recipientEmail,
            recipient_name: recipientName || null,
            sender_email: senderEmail,
            sender_name: senderName || null,
            stripe_session_id: session.id,
            stripe_payment_intent: paymentIntentId || null,
            amount_paid: session.amount_total,
          })
          .select("id")
          .single();

        if (insertErr) {
          log("Failed to insert gift invitation", { error: insertErr.message });
          return new Response(JSON.stringify({ error: "Failed to create gift invitation" }), { status: 500 });
        }

        log("Gift invitation created", { id: invitation.id });

        try {
          const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-gift-invitation`;
          const resp = await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ giftId: invitation.id, recipientEmail, recipientName, senderEmail, senderName }),
          });
          log("Gift invitation email triggered", { status: resp.status });
        } catch (emailErr) {
          log("Failed to trigger gift email (non-fatal)", { error: (emailErr as Error).message });
        }

        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // ── SELF-PURCHASE FLOW (existing logic preserved) ──
      if (!plan || !PLAN_DEFAULTS[plan]) {
        log("No valid plan in metadata, skipping", { plan });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const planConfig = PLAN_DEFAULTS[plan];

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
