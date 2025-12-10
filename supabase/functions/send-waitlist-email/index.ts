import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WAITLIST-EMAIL] ${step}${detailsStr}`);
};

interface WaitlistEmailRequest {
  email: string;
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

    const { email }: WaitlistEmailRequest = await req.json();
    logStep("Request parsed", { email });

    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Send the waitlist welcome email
    const emailResponse = await resend.emails.send({
      from: "OSSTE <no-reply@osste.com>",
      to: [email],
      subject: "Welcome to the OSSTE Waitlist!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 10px;">You're on the List!</h1>
          </div>
          
          <p style="font-size: 16px;">Hello,</p>
          
          <p style="font-size: 16px;">
            Thank you for joining the OSSTE early access waitlist! We're thrilled to have you as part of our growing community.
          </p>
          
          <p style="font-size: 16px;">
            OSSTE helps you capture and preserve life's most meaningful moments through guided storytelling conversations. Your memories deserve to be treasured for generations.
          </p>
          
          <p style="font-size: 16px;">
            We'll be in touch soon with exclusive early access details and updates on our launch.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #666;">
              In the meantime, follow us on social media for updates:
            </p>
            <a href="https://x.com/osste" style="color: #1a1a1a; text-decoration: none; margin: 0 10px;">Twitter</a>
            <a href="https://instagram.com/osste" style="color: #1a1a1a; text-decoration: none; margin: 0 10px;">Instagram</a>
          </div>
          
          <p style="font-size: 16px; margin-top: 30px;">
            Warm regards,<br>
            The OSSTE Team
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            You're receiving this email because you signed up for the OSSTE waitlist.
          </p>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Waitlist email sent successfully",
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
