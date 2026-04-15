/**
 * OSSTE Unified Email Service
 * 
 * Handles all email sending for OSSTE using Resend.
 * Supports Resend templates (via env RESEND_TEMPLATE_*) with inline HTML fallbacks.
 * 
 * Features:
 * - Idempotency via optional `idempotencyKey` param
 * - Professional responsive HTML fallback templates
 * - Structured error responses (never throws 500 to callers)
 * 
 * REQUIRED SECRETS: RESEND_API_KEY
 * OPTIONAL SECRETS: RESEND_TEMPLATE_* for each email type
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "OSSTE <stories@osste.com>";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-EMAIL] ${step}${detailsStr}`);
};

// ── In-memory dedup cache (per isolate lifetime, ~5 min window) ──
const recentSends = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicate(key: string): boolean {
  const now = Date.now();
  // Prune old entries
  for (const [k, ts] of recentSends) {
    if (now - ts > DEDUP_WINDOW_MS) recentSends.delete(k);
  }
  if (recentSends.has(key)) return true;
  recentSends.set(key, now);
  return false;
}

// ── Types ──
type EmailType = 
  | 'welcome'
  | 'approved'
  | 'accountCreation'
  | 'emailVerification'
  | 'passwordReset'
  | 'paymentSuccess'
  | 'paymentFailed'
  | 'recordingFinished'
  | 'transcriptReady'
  | 'bookPreviewReady'
  | 'finalBookReady'
  | 'cancellation'
  | 'reactivation';

interface BaseEmailParams {
  type: EmailType;
  email: string;
  firstName?: string;
  idempotencyKey?: string; // Optional dedup key
}

interface WelcomeParams extends BaseEmailParams { type: 'welcome'; source?: 'waitlist' | 'direct'; }
interface AccountCreationParams extends BaseEmailParams { type: 'accountCreation'; }
interface EmailVerificationParams extends BaseEmailParams { type: 'emailVerification'; verificationUrl: string; }
interface PasswordResetParams extends BaseEmailParams { type: 'passwordReset'; resetUrl: string; }
interface PaymentSuccessParams extends BaseEmailParams { type: 'paymentSuccess'; amount: number; currency: string; planName?: string; }
interface PaymentFailedParams extends BaseEmailParams { type: 'paymentFailed'; amount?: number; currency?: string; reason?: string; }
interface RecordingFinishedParams extends BaseEmailParams { type: 'recordingFinished'; questionOrTopic?: string; sessionId: string; }
interface TranscriptReadyParams extends BaseEmailParams { type: 'transcriptReady'; chapterTitle: string; sessionId: string; chapterId: string; }
interface BookPreviewReadyParams extends BaseEmailParams { type: 'bookPreviewReady'; bookTitle: string; previewUrl: string; }
interface FinalBookReadyParams extends BaseEmailParams { type: 'finalBookReady'; bookTitle: string; downloadUrl: string; }
interface CancellationParams extends BaseEmailParams { type: 'cancellation'; planName?: string; effectiveDate?: string; }
interface ReactivationParams extends BaseEmailParams { type: 'reactivation'; planName?: string; }
interface ApprovedParams extends BaseEmailParams { type: 'approved'; loginUrl?: string; betaAccessUntil?: string; }

type EmailParams = 
  | WelcomeParams | ApprovedParams | AccountCreationParams | EmailVerificationParams
  | PasswordResetParams | PaymentSuccessParams | PaymentFailedParams
  | RecordingFinishedParams | TranscriptReadyParams
  | BookPreviewReadyParams | FinalBookReadyParams | CancellationParams | ReactivationParams;

// ── Template IDs from env ──
function getTemplateId(type: EmailType): string | null {
  const envMap: Record<EmailType, string> = {
    welcome: 'RESEND_TEMPLATE_WELCOME',
    approved: 'RESEND_TEMPLATE_APPROVED',
    accountCreation: 'RESEND_TEMPLATE_ACCOUNT_CREATION',
    emailVerification: 'RESEND_TEMPLATE_EMAIL_VERIFICATION',
    passwordReset: 'RESEND_TEMPLATE_PASSWORD_RESET',
    paymentSuccess: 'RESEND_TEMPLATE_PAYMENT_SUCCESS',
    paymentFailed: 'RESEND_TEMPLATE_PAYMENT_FAILED',
    recordingFinished: 'RESEND_TEMPLATE_RECORDING_FINISHED',
    transcriptReady: 'RESEND_TEMPLATE_TRANSCRIPT_READY',
    bookPreviewReady: 'RESEND_TEMPLATE_BOOK_PREVIEW_READY',
    finalBookReady: 'RESEND_TEMPLATE_FINAL_BOOK_READY',
    cancellation: 'RESEND_TEMPLATE_CANCELLATION',
    reactivation: 'RESEND_TEMPLATE_REACTIVATION',
  };
  return Deno.env.get(envMap[type]) || null;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// ── Responsive HTML email wrapper ──
function wrapHtml(subject: string, bodyContent: string): { subject: string; html: string } {
  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; width: 100% !important; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .btn-cta { width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Logo -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <img src="https://osste-core.lovable.app/logo-v3.png" alt="OSSTE" width="100" style="display: block;" />
            </td>
          </tr>
        </table>
        <!-- Card -->
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px 36px; color: #333333; font-size: 16px; line-height: 1.65;">
              ${bodyContent}
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <tr>
            <td align="center" style="padding: 24px 0; font-size: 12px; color: #999999; line-height: 1.5;">
              © ${new Date().getFullYear()} OSSTE · Preserve what matters most<br>
              <a href="https://osste.com" style="color: #999999; text-decoration: underline;">osste.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
    <tr>
      <td align="center" class="btn-cta" style="background-color: #1a1a1a; border-radius: 8px;">
        <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoBox(text: string): string {
  return `<div style="background-color: #f5f5f0; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #555555;">${text}</div>`;
}

const signoff = `<p style="margin-top: 32px; margin-bottom: 0;">Warm regards,<br><strong>The OSSTE Team</strong></p>`;

// ── Build fallback HTML ──
function buildFallbackHtml(params: EmailParams): { subject: string; html: string } {
  const name = params.firstName || 'there';
  const greeting = `<p style="margin-top: 0;">Hello ${name},</p>`;

  switch (params.type) {
    case 'welcome':
      return wrapHtml("Welcome to OSSTE!", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Welcome to OSSTE!</h1>
        ${greeting}
        <p>Thank you for joining OSSTE! We're excited to help you capture and preserve your most meaningful stories.</p>
        <p>Whether you're documenting family history, personal milestones, or treasured memories, OSSTE is here to guide you every step of the way.</p>
        ${ctaButton("https://osste.com", "Visit OSSTE")}
        ${signoff}
      `);

    case 'approved': {
      const ap = params as ApprovedParams;
      const loginUrl = ap.loginUrl || 'https://osste.com/login';
      const betaNote = ap.betaAccessUntil
        ? infoBox(`<strong>Note:</strong> Your beta access is valid until <strong>${new Date(ap.betaAccessUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.`)
        : '';
      return wrapHtml("🎉 You're in! Welcome to the OSSTE Beta", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">🎉 You're In!</h1>
        ${greeting}
        <p>Great news — your access to the <strong>OSSTE Beta</strong> has been approved!</p>
        <p>Here's what to do next:</p>
        <ol style="padding-left: 20px; margin: 16px 0;">
          <li style="margin-bottom: 8px;"><strong>Log in</strong> to your account</li>
          <li style="margin-bottom: 8px;"><strong>Start a session</strong> — answer guided questions to capture your stories</li>
          <li><strong>Build your book</strong> — we'll turn your recordings into a beautiful keepsake</li>
        </ol>
        ${betaNote}
        ${ctaButton(loginUrl, "Log In to OSSTE →")}
        <p style="font-size: 14px; color: #888;">If you have any questions, just reply to this email.</p>
        ${signoff}
      `);
    }

    case 'accountCreation':
      return wrapHtml("Your OSSTE Account is Ready!", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Your Account is Ready!</h1>
        ${greeting}
        <p>Your OSSTE account has been created successfully. You can now start capturing your stories and creating beautiful keepsake books.</p>
        ${ctaButton("https://osste.com/dashboard", "Go to Dashboard")}
        ${signoff}
      `);

    case 'emailVerification': {
      const vp = params as EmailVerificationParams;
      return wrapHtml("Verify Your Email — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Verify Your Email</h1>
        ${greeting}
        <p>Please verify your email address by clicking the button below:</p>
        ${ctaButton(vp.verificationUrl, "Verify Email")}
        <p style="font-size: 14px; color: #888;">If you didn't create an account with OSSTE, you can safely ignore this email.</p>
        ${signoff}
      `);
    }

    case 'passwordReset': {
      const rp = params as PasswordResetParams;
      return wrapHtml("Reset Your Password — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Reset Your Password</h1>
        ${greeting}
        <p>We received a request to reset your password. Click the button below to create a new one:</p>
        ${ctaButton(rp.resetUrl, "Reset Password")}
        <p style="font-size: 14px; color: #888;">If you didn't request this, you can safely ignore this email. This link expires in 24 hours.</p>
        ${signoff}
      `);
    }

    case 'paymentSuccess': {
      const ps = params as PaymentSuccessParams;
      return wrapHtml("Payment Confirmed — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Payment Confirmed!</h1>
        ${greeting}
        <p>Thank you for your payment of <strong>${formatAmount(ps.amount, ps.currency)}</strong>${ps.planName ? ` for the <strong>${ps.planName}</strong> plan` : ''}.</p>
        ${infoBox(`Your account has been upgraded and all features are now active.`)}
        ${ctaButton("https://osste.com/dashboard", "Start Creating")}
        ${signoff}
      `);
    }

    case 'paymentFailed': {
      const pf = params as PaymentFailedParams;
      return wrapHtml("Payment Issue — Action Required", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Payment Issue</h1>
        ${greeting}
        <p>We had trouble processing your payment${pf.amount ? ` of <strong>${formatAmount(pf.amount, pf.currency || 'usd')}</strong>` : ''}.</p>
        ${pf.reason ? infoBox(`Reason: ${pf.reason}`) : ''}
        <p>Please update your payment method to continue using OSSTE.</p>
        ${ctaButton("https://osste.com/settings", "Update Payment Method")}
        ${signoff}
      `);
    }

    case 'recordingFinished': {
      const rf = params as RecordingFinishedParams;
      return wrapHtml("Recording Complete — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Recording Complete!</h1>
        ${greeting}
        <p>Your recording has been saved successfully${rf.questionOrTopic ? ` for: <em>"${rf.questionOrTopic}"</em>` : ''}.</p>
        <p>We're now processing your story. You'll receive another email when your transcript is ready to review.</p>
        ${ctaButton(`https://osste.com/sessions/${rf.sessionId}`, "View Session")}
        ${signoff}
      `);
    }

    case 'transcriptReady': {
      const tr = params as TranscriptReadyParams;
      return wrapHtml("Your Transcript is Ready — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Transcript Ready!</h1>
        ${greeting}
        <p>Your chapter <strong>"${tr.chapterTitle}"</strong> has been transcribed and is ready for review.</p>
        <p>Take a moment to review and make any edits before it becomes part of your book.</p>
        ${ctaButton(`https://osste.com/chapters/${tr.chapterId}`, "Review Chapter")}
        ${signoff}
      `);
    }

    case 'bookPreviewReady': {
      const bp = params as BookPreviewReadyParams;
      return wrapHtml("Your Book Preview is Ready — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Book Preview Ready!</h1>
        ${greeting}
        <p>Your book <strong>"${bp.bookTitle}"</strong> preview is ready to view.</p>
        <p>Take a look and make sure everything looks perfect before finalizing.</p>
        ${ctaButton(bp.previewUrl, "View Preview")}
        ${signoff}
      `);
    }

    case 'finalBookReady': {
      const fb = params as FinalBookReadyParams;
      return wrapHtml("Your Book is Ready! — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Your Book is Ready! 🎉</h1>
        ${greeting}
        <p>Congratulations! Your book <strong>"${fb.bookTitle}"</strong> is complete and ready to download.</p>
        <p>This beautiful keepsake is now ready to be shared with your loved ones.</p>
        ${ctaButton(fb.downloadUrl, "Download Book")}
        ${signoff}
      `);
    }

    case 'cancellation': {
      const cp = params as CancellationParams;
      return wrapHtml("Subscription Canceled — OSSTE", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">We're Sorry to See You Go</h1>
        ${greeting}
        <p>Your${cp.planName ? ` <strong>${cp.planName}</strong>` : ''} subscription has been canceled${cp.effectiveDate ? ` effective <strong>${cp.effectiveDate}</strong>` : ''}.</p>
        <p>Your stories and recordings will remain accessible. If you change your mind, we'd love to have you back.</p>
        ${ctaButton("https://osste.com/pricing", "Resubscribe")}
        ${signoff}
      `);
    }

    case 'reactivation': {
      const rp = params as ReactivationParams;
      return wrapHtml("Welcome Back to OSSTE!", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">Welcome Back!</h1>
        ${greeting}
        <p>Great news! Your${rp.planName ? ` <strong>${rp.planName}</strong>` : ''} subscription is now active again.</p>
        <p>We're thrilled to have you back. Continue capturing your stories and creating beautiful keepsake books.</p>
        ${ctaButton("https://osste.com/dashboard", "Go to Dashboard")}
        ${signoff}
      `);
    }

    default:
      return wrapHtml("OSSTE Notification", `
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #1a1a1a;">OSSTE Update</h1>
        ${greeting}
        <p>You have a new notification from OSSTE.</p>
        ${signoff}
      `);
  }
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Authenticate: require service role key or valid JWT
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    let isAuthorized = false;

    // Allow service-role calls (server-to-server)
    if (token && serviceRoleKey && token === serviceRoleKey) {
      isAuthorized = true;
      logStep("Authenticated via service role key");
    } else if (token) {
      // Validate JWT for authenticated user calls
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        isAuthorized = true;
        logStep("Authenticated via JWT", { userId: data.user.id });
      }
    }

    if (!isAuthorized) {
      logStep("Unauthorized request rejected");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);
    const params: EmailParams = await req.json();
    logStep("Request parsed", { type: params.type, email: params.email });

    // Validate
    if (!params.email || !params.email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email address" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!params.type) {
      return new Response(
        JSON.stringify({ success: false, error: "Email type is required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Dedup check
    const dedupKey = params.idempotencyKey || `${params.type}:${params.email}`;
    if (isDuplicate(dedupKey)) {
      logStep("Duplicate detected, skipping", { dedupKey });
      return new Response(
        JSON.stringify({ success: true, message: "Duplicate suppressed", duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try template or fallback
    const templateId = getTemplateId(params.type);
    logStep("Template lookup", { type: params.type, hasTemplate: !!templateId });

    let emailResponse;

    if (templateId) {
      const dynamicData: Record<string, string> = { firstName: params.firstName || 'there' };

      switch (params.type) {
        case 'welcome': dynamicData.source = (params as WelcomeParams).source || 'direct'; break;
        case 'approved': {
          const ap = params as ApprovedParams;
          dynamicData.loginUrl = ap.loginUrl || 'https://osste.com/login';
          dynamicData.betaAccessUntil = ap.betaAccessUntil || '';
          break;
        }
        case 'emailVerification': dynamicData.verificationUrl = (params as EmailVerificationParams).verificationUrl; break;
        case 'passwordReset': dynamicData.resetUrl = (params as PasswordResetParams).resetUrl; break;
        case 'paymentSuccess': {
          const ps = params as PaymentSuccessParams;
          dynamicData.amount = formatAmount(ps.amount, ps.currency);
          dynamicData.planName = ps.planName || 'OSSTE Plan';
          break;
        }
        case 'paymentFailed': {
          const pf = params as PaymentFailedParams;
          dynamicData.amount = pf.amount ? formatAmount(pf.amount, pf.currency || 'usd') : '';
          dynamicData.reason = pf.reason || 'Payment could not be processed';
          break;
        }
        case 'recordingFinished': {
          const rf = params as RecordingFinishedParams;
          dynamicData.questionOrTopic = rf.questionOrTopic || 'Your Story';
          dynamicData.sessionUrl = `https://osste.com/sessions/${rf.sessionId}`;
          break;
        }
        case 'transcriptReady': {
          const tr = params as TranscriptReadyParams;
          dynamicData.chapterTitle = tr.chapterTitle;
          dynamicData.chapterUrl = `https://osste.com/chapters/${tr.chapterId}`;
          break;
        }
        case 'bookPreviewReady': {
          const bp = params as BookPreviewReadyParams;
          dynamicData.bookTitle = bp.bookTitle;
          dynamicData.previewUrl = bp.previewUrl;
          break;
        }
        case 'finalBookReady': {
          const fb = params as FinalBookReadyParams;
          dynamicData.bookTitle = fb.bookTitle;
          dynamicData.downloadUrl = fb.downloadUrl;
          break;
        }
        case 'cancellation': {
          const c = params as CancellationParams;
          dynamicData.planName = c.planName || 'OSSTE';
          dynamicData.effectiveDate = c.effectiveDate || 'immediately';
          break;
        }
        case 'reactivation': dynamicData.planName = (params as ReactivationParams).planName || 'OSSTE'; break;
      }

      logStep("Sending with template", { templateId });
      emailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: [params.email],
        subject: buildFallbackHtml(params).subject,
        // @ts-ignore - Resend template support
        template_id: templateId,
        // @ts-ignore
        data: dynamicData,
      });
    } else {
      logStep("Using fallback HTML");
      const { subject, html } = buildFallbackHtml(params);
      emailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: [params.email],
        subject,
        html,
      });
    }

    const hasError = emailResponse.error;
    if (hasError) {
      logStep("Resend API error", emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: (emailResponse.error as any)?.message || "Resend send failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Email sent successfully", { emailId: emailResponse.data?.id, type: params.type });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${params.type} email sent successfully`,
        emailId: emailResponse.data?.id,
        usedTemplate: !!templateId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
