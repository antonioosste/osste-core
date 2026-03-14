import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { logAuditEvent } from "../_shared/audit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CREATE-PRINT-CHECKOUT] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

// Fixed product configuration
const FIXED_FORMAT = "paperback";
const FIXED_TRIM_SIZE = "5.5x8.5";
const FIXED_QUANTITY = 1;
const FIXED_SIZE = "small";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userId || !userEmail) throw new Error("User not authenticated or email not available");
    log("User authenticated", { userId, email: userEmail });

    const { orderData } = await req.json();
    log("Order data received (will be normalized)", { orderData });

    if (!orderData?.story_group_id) {
      return new Response(JSON.stringify({ error: "Invalid order data: missing story_group_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log if client sent non-standard values (for monitoring)
    if (orderData.format && orderData.format !== FIXED_FORMAT) {
      log("Client sent non-standard format, ignoring", { sent: orderData.format, forced: FIXED_FORMAT });
    }
    if (orderData.trim_size && orderData.trim_size !== FIXED_TRIM_SIZE) {
      log("Client sent non-standard trim_size, ignoring", { sent: orderData.trim_size, forced: FIXED_TRIM_SIZE });
    }
    if (orderData.quantity && orderData.quantity !== FIXED_QUANTITY) {
      log("Client sent non-standard quantity, ignoring", { sent: orderData.quantity, forced: FIXED_QUANTITY });
    }

    log("Normalized values", { format: FIXED_FORMAT, trim_size: FIXED_TRIM_SIZE, quantity: FIXED_QUANTITY, size: FIXED_SIZE });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const skipStripe = Deno.env.get("PRINT_SKIP_STRIPE") === "true";
    log("Stripe skip flag", { skipStripe });

    const { data: order, error: insertErr } = await supabaseAdmin
      .from("print_orders")
      .insert({
        user_id: userId,
        story_group_id: orderData.story_group_id,
        book_title: orderData.book_title || "Untitled",
        format: FIXED_FORMAT,
        size: FIXED_SIZE,
        quantity: FIXED_QUANTITY,
        shipping_name: orderData.shipping_name || "",
        shipping_address: orderData.shipping_address || "",
        shipping_city: orderData.shipping_city || "",
        shipping_state: orderData.shipping_state || "",
        shipping_zip: orderData.shipping_zip || "",
        shipping_country: orderData.shipping_country || "US",
        total_price: 0,
        currency: "usd",
        status: skipStripe ? "paid" : "checkout_created",
        trim_size: FIXED_TRIM_SIZE,
        cover_title: orderData.cover_title || orderData.book_title || "Untitled",
        cover_subtitle: orderData.cover_subtitle || null,
        cover_image_url: orderData.cover_image_url || null,
        cover_color_theme: orderData.cover_color_theme || "classic",
      })
      .select("id")
      .single();

    if (insertErr || !order) {
      log("Failed to insert print_orders", { error: insertErr?.message });
      return new Response(JSON.stringify({ error: "Failed to create order record" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("print_orders row created", { id: order.id, status: skipStripe ? "paid" : "checkout_created" });

    await logAuditEvent(supabaseAdmin, {
      print_order_id: order.id,
      actor_type: "user",
      actor_id: userId,
      event_type: "order_created",
      new_values: { status: skipStripe ? "paid" : "checkout_created", format: FIXED_FORMAT, trim_size: FIXED_TRIM_SIZE, quantity: FIXED_QUANTITY },
    });

    // If skipping Stripe, return order directly (no payment needed)
    if (skipStripe) {
      log("Stripe skipped – order created as paid", { orderId: order.id });
      return new Response(
        JSON.stringify({ print_order_id: order.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Otherwise create a $0 Stripe checkout for record-keeping
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    const siteUrl = (Deno.env.get("SITE_URL") || req.headers.get("origin") || "").replace(/\/+$/, "");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: 0,
          product_data: {
            name: "Paperback Book – 5.5×8.5",
            description: `Physical copy of: ${orderData.book_title || "Untitled"}`,
          },
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: siteUrl + "/print-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: siteUrl + "/dashboard",
      metadata: { type: "print", print_order_id: order.id, user_id: userId, story_group_id: orderData.story_group_id },
    });

    log("Stripe session created", { sessionId: session.id });

    await supabaseAdmin.from("print_orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, print_order_id: order.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
