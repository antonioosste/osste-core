import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

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

    // Send the gift invitation email using Resend
    const recipientDisplayName = recipientName || "there";
    const senderDisplayName = senderName || "Someone special";

    const emailResponse = await resend.emails.send({
      from: "OSSTE <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `${senderDisplayName} sent you a gift: Your story awaits!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 10px;">You've Received a Gift!</h1>
          </div>
          
          <p style="font-size: 16px;">Hello ${recipientDisplayName},</p>
          
          <p style="font-size: 16px;">
            <strong>${senderDisplayName}</strong> has given you a wonderful gift – the opportunity to preserve your stories and memories with OSSTE.
          </p>
          
          <p style="font-size: 16px;">
            OSSTE helps you capture and share your life stories through guided conversations. Your stories matter, and now you have the perfect tool to preserve them for generations to come.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://osste.com/redeem?gift=${giftId}" 
               style="background-color: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500; display: inline-block;">
              Redeem Your Gift
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            If you have any questions, feel free to reach out to us. We're here to help you every step of the way.
          </p>
          
          <p style="font-size: 16px; margin-top: 30px;">
            Warm regards,<br>
            The OSSTE Team
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This email was sent because ${senderDisplayName} (${senderEmail}) gifted you an OSSTE subscription.
          </p>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Gift invitation sent successfully",
        emailId: emailResponse.data?.id
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
