import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
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
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const resend = new Resend(resendApiKey);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { giftId, recipientEmail, recipientName, senderEmail, senderName, personalMessage }: GiftInvitationRequest & { personalMessage?: string } = await req.json();
    logStep("Request parsed", { giftId, recipientEmail, senderEmail, hasMessage: !!personalMessage });

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return new Response(JSON.stringify({ success: false, error: "Invalid recipient email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotency: check if already sent
    const { data: existing } = await supabaseClient
      .from('gift_invitations')
      .select('invitation_sent_at, personal_message')
      .eq('id', giftId)
      .single();

    if (existing?.invitation_sent_at) {
      logStep("Invitation already sent, skipping", { giftId });
      return new Response(JSON.stringify({ success: true, message: "Already sent", duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use the message from the request or fall back to DB value
    const message = personalMessage || existing?.personal_message || "";

    // Update the gift invitation status
    const { error: updateError } = await supabaseClient
      .from('gift_invitations')
      .update({ invitation_sent_at: new Date().toISOString(), status: 'sent' })
      .eq('id', giftId);

    if (updateError) {
      logStep("Error updating gift invitation", updateError);
      throw new Error(`Failed to update gift invitation: ${updateError.message}`);
    }

    const recipientDisplayName = recipientName || "there";
    const senderDisplayName = senderName || "Someone special";
    const rawSiteUrl = Deno.env.get("SITE_URL") || "https://osste.com";
    const siteUrl = rawSiteUrl.replace(/\/+$/, "");

    const emailResponse = await resend.emails.send({
      from: "OSSTE <stories@osste.com>",
      to: [recipientEmail],
      subject: `${senderDisplayName} sent you a gift: Your story awaits!`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; width: 100% !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <img src="https://osste-core.lovable.app/logo-v3.png" alt="OSSTE" width="100" style="display: block;" />
            </td>
          </tr>
        </table>
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px 36px; color: #333333; font-size: 16px; line-height: 1.65;">
              <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">You've Received a Gift! 🎁</h1>
              <p style="margin-top: 0;">Hello ${recipientDisplayName},</p>
              <p><strong>${senderDisplayName}</strong> has given you a wonderful gift — the opportunity to preserve your stories and memories with OSSTE.</p>
              <p>OSSTE helps you capture and share your life stories through guided conversations. Your stories matter, and now you have the perfect tool to preserve them for generations.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #1a1a1a; border-radius: 8px;">
                    <a href="${siteUrl}/redeem/${giftId}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">Redeem Your Gift</a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 14px; color: #888;">If you have any questions, feel free to reach out. We're here to help.</p>
              <p style="margin-top: 32px; margin-bottom: 0;">Warm regards,<br><strong>The OSSTE Team</strong></p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <tr>
            <td align="center" style="padding: 24px 0; font-size: 12px; color: #999999; line-height: 1.5;">
              This email was sent because ${senderDisplayName} (${senderEmail}) gifted you an OSSTE subscription.<br>
              © ${new Date().getFullYear()} OSSTE · <a href="https://osste.com" style="color: #999999;">osste.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    if (emailResponse.error) {
      logStep("Resend error", emailResponse.error);
      return new Response(JSON.stringify({ success: false, error: (emailResponse.error as any)?.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ success: true, message: "Gift invitation sent", emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
