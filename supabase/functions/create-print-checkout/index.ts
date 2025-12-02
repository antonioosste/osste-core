import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PRINT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { orderData } = await req.json();
    logStep("Order data received", { orderData });

    // Validate order data
    if (!orderData || !orderData.story_group_id || !orderData.format || !orderData.size) {
      throw new Error("Invalid order data");
    }

    // Calculate price based on format and quantity
    const basePrice = orderData.format === 'hardcover' ? 4999 : 2999; // $49.99 or $29.99
    const sizeMultiplier = orderData.size === 'large' ? 1.5 : orderData.size === 'small' ? 0.8 : 1;
    const unitPrice = Math.round(basePrice * sizeMultiplier);
    const totalAmount = unitPrice * orderData.quantity;

    logStep("Price calculated", { unitPrice, totalAmount });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitPrice,
            product_data: {
              name: `${orderData.format === 'hardcover' ? 'Hardcover' : 'Paperback'} Book - ${orderData.size} size`,
              description: `Physical copy of: ${orderData.book_title}`,
            },
          },
          quantity: orderData.quantity,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/print-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard`,
      metadata: {
        user_id: user.id,
        story_group_id: orderData.story_group_id,
        book_title: orderData.book_title,
        format: orderData.format,
        size: orderData.size,
        quantity: orderData.quantity.toString(),
        shipping_name: orderData.shipping_name,
        shipping_address: orderData.shipping_address,
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_zip: orderData.shipping_zip,
        shipping_country: orderData.shipping_country || 'US',
        total_price: (totalAmount / 100).toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});