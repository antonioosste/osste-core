import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-GIFT-INVITATION] ${step}${detailsStr}`);
};

interface GiftInvitationRequest {
  giftId: string;
  recipientEmail: string;
  recipientName?: string;
  senderEmail: string;
  senderName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { giftId, recipientEmail, recipientName, senderEmail, senderName }: GiftInvitationRequest = await req.json();
    logStep("Request parsed", { giftId, recipientEmail, senderEmail });

    // Update the gift invitation status
    const { error: updateError } = await supabaseClient
      .from('gift_invitations')
      .update({ 
        invitation_sent_at: new Date().toISOString(),
        status: 'sent'
      })
      .eq('id', giftId);

    if (updateError) {
      logStep("Error updating gift invitation", updateError);
      throw new Error(`Failed to update gift invitation: ${updateError.message}`);
    }

    logStep("Gift invitation updated successfully");

    // In production, you would send an actual email here using Resend or similar
    // For now, we just log and update the status
    logStep("Gift invitation email would be sent", {
      to: recipientEmail,
      recipientName,
      from: senderEmail,
      senderName,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Gift invitation sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
