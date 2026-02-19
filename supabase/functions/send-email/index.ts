/**
 * OSSTE Unified Email Service
 * 
 * This edge function handles all email sending for OSSTE using Resend templates.
 * 
 * ADDING A NEW TEMPLATE:
 * 1. Create the template in Resend dashboard
 * 2. Add the template ID to the TEMPLATE_IDS object below (from env)
 * 3. Add the template type to EmailType union
 * 4. Add the template variables interface
 * 5. Handle the new type in the switch statement
 * 
 * WIRING TO A FEATURE:
 * - Call supabase.functions.invoke('send-email', { body: { type: 'templateType', ...params } })
 * - Or use the sendEmail helper from @/lib/emails.ts in the frontend
 * 
 * REQUIRED SECRETS:
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_TEMPLATE_*: Template IDs for each email type
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "OSSTE <stories@osste.com>";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-EMAIL] ${step}${detailsStr}`);
};

// Template type definitions
type EmailType = 
  | 'welcome'
  | 'approved'
  | 'accountCreation'
  | 'emailVerification'
  | 'passwordReset'
  | 'paymentSuccess'
  | 'paymentFailed'
  | 'recordingStarted'
  | 'recordingFinished'
  | 'transcriptReady'
  | 'bookPreviewReady'
  | 'finalBookReady'
  | 'cancellation'
  | 'reactivation';

// Base parameters for all emails
interface BaseEmailParams {
  type: EmailType;
  email: string;
  firstName?: string;
}

// Template-specific parameters
interface WelcomeParams extends BaseEmailParams {
  type: 'welcome';
  source?: 'waitlist' | 'direct';
}

interface AccountCreationParams extends BaseEmailParams {
  type: 'accountCreation';
}

interface EmailVerificationParams extends BaseEmailParams {
  type: 'emailVerification';
  verificationUrl: string;
}

interface PasswordResetParams extends BaseEmailParams {
  type: 'passwordReset';
  resetUrl: string;
}

interface PaymentSuccessParams extends BaseEmailParams {
  type: 'paymentSuccess';
  amount: number;
  currency: string;
  planName?: string;
}

interface PaymentFailedParams extends BaseEmailParams {
  type: 'paymentFailed';
  amount?: number;
  currency?: string;
  reason?: string;
}

interface RecordingStartedParams extends BaseEmailParams {
  type: 'recordingStarted';
  questionOrTopic?: string;
  sessionId: string;
}

interface RecordingFinishedParams extends BaseEmailParams {
  type: 'recordingFinished';
  questionOrTopic?: string;
  sessionId: string;
}

interface TranscriptReadyParams extends BaseEmailParams {
  type: 'transcriptReady';
  chapterTitle: string;
  sessionId: string;
  chapterId: string;
}

interface BookPreviewReadyParams extends BaseEmailParams {
  type: 'bookPreviewReady';
  bookTitle: string;
  previewUrl: string;
}

interface FinalBookReadyParams extends BaseEmailParams {
  type: 'finalBookReady';
  bookTitle: string;
  downloadUrl: string;
}

interface CancellationParams extends BaseEmailParams {
  type: 'cancellation';
  planName?: string;
  effectiveDate?: string;
}

interface ReactivationParams extends BaseEmailParams {
  type: 'reactivation';
  planName?: string;
}

interface ApprovedParams extends BaseEmailParams {
  type: 'approved';
  loginUrl?: string;
  betaAccessUntil?: string;
}

type EmailParams = 
  | WelcomeParams
  | ApprovedParams
  | AccountCreationParams
  | EmailVerificationParams
  | PasswordResetParams
  | PaymentSuccessParams
  | PaymentFailedParams
  | RecordingStartedParams
  | RecordingFinishedParams
  | TranscriptReadyParams
  | BookPreviewReadyParams
  | FinalBookReadyParams
  | CancellationParams
  | ReactivationParams;

// Get template IDs from environment variables
function getTemplateId(type: EmailType): string | null {
  const envMap: Record<EmailType, string> = {
    welcome: 'RESEND_TEMPLATE_WELCOME',
    approved: 'RESEND_TEMPLATE_APPROVED',
    accountCreation: 'RESEND_TEMPLATE_ACCOUNT_CREATION',
    emailVerification: 'RESEND_TEMPLATE_EMAIL_VERIFICATION',
    passwordReset: 'RESEND_TEMPLATE_PASSWORD_RESET',
    paymentSuccess: 'RESEND_TEMPLATE_PAYMENT_SUCCESS',
    paymentFailed: 'RESEND_TEMPLATE_PAYMENT_FAILED',
    recordingStarted: 'RESEND_TEMPLATE_RECORDING_STARTED',
    recordingFinished: 'RESEND_TEMPLATE_RECORDING_FINISHED',
    transcriptReady: 'RESEND_TEMPLATE_TRANSCRIPT_READY',
    bookPreviewReady: 'RESEND_TEMPLATE_BOOK_PREVIEW_READY',
    finalBookReady: 'RESEND_TEMPLATE_FINAL_BOOK_READY',
    cancellation: 'RESEND_TEMPLATE_CANCELLATION',
    reactivation: 'RESEND_TEMPLATE_REACTIVATION',
  };
  
  return Deno.env.get(envMap[type]) || null;
}

// Format amount for display (e.g., 4999 cents -> "$49.99")
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Build the email HTML for each type (fallback if no template ID)
function buildFallbackHtml(params: EmailParams): { subject: string; html: string } {
  const greeting = params.firstName ? `Hello ${params.firstName},` : 'Hello,';
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  switch (params.type) {
    case 'welcome':
      return {
        subject: "Welcome to OSSTE!",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Welcome to OSSTE!</h1>
            <p>${greeting}</p>
            <p>Thank you for joining OSSTE! We're excited to help you capture and preserve your most meaningful stories.</p>
            <p>Whether you're documenting family history, personal milestones, or treasured memories, OSSTE is here to guide you every step of the way.</p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'approved':
      const approvedParams = params as ApprovedParams;
      const loginUrl = approvedParams.loginUrl || 'https://osste.com/login';
      const betaNote = approvedParams.betaAccessUntil
        ? `<p style="background-color: #f5f5f0; padding: 12px 16px; border-radius: 8px; margin: 16px 0;"><strong>Note:</strong> Your beta access is valid until <strong>${new Date(approvedParams.betaAccessUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>`
        : '';
      return {
        subject: "🎉 You're in! Welcome to the OSSTE Beta",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">🎉 You're In!</h1>
            <p>${greeting}</p>
            <p>Great news — your access to the <strong>OSSTE Beta</strong> has been approved!</p>
            <p>Here's what to do next:</p>
            <ol style="padding-left: 20px;">
              <li><strong>Log in</strong> to your account using the button below</li>
              <li><strong>Start a session</strong> — answer guided questions to capture your stories</li>
              <li><strong>Build your book</strong> — we'll turn your recordings into a beautiful keepsake</li>
            </ol>
            ${betaNote}
            <p style="margin: 24px 0;">
              <a href="${loginUrl}" style="background-color: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Log In to OSSTE →</a>
            </p>
            <p>If you have any questions, just reply to this email. We're here to help.</p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'accountCreation':
      return {
        subject: "Your OSSTE Account is Ready!",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Your Account is Ready!</h1>
            <p>${greeting}</p>
            <p>Your OSSTE account has been created successfully. You can now start capturing your stories and creating beautiful keepsake books.</p>
            <p><a href="https://osste.com/dashboard" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'emailVerification':
      const verifyParams = params as EmailVerificationParams;
      return {
        subject: "Verify Your Email - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Verify Your Email</h1>
            <p>${greeting}</p>
            <p>Please verify your email address by clicking the button below:</p>
            <p><a href="${verifyParams.verificationUrl}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
            <p>If you didn't create an account with OSSTE, you can safely ignore this email.</p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'passwordReset':
      const resetParams = params as PasswordResetParams;
      return {
        subject: "Reset Your Password - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Reset Your Password</h1>
            <p>${greeting}</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p><a href="${resetParams.resetUrl}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'paymentSuccess':
      const paymentParams = params as PaymentSuccessParams;
      return {
        subject: "Payment Confirmed - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Payment Confirmed!</h1>
            <p>${greeting}</p>
            <p>Thank you for your payment of <strong>${formatAmount(paymentParams.amount, paymentParams.currency)}</strong>${paymentParams.planName ? ` for the ${paymentParams.planName}` : ''}.</p>
            <p>Your account is now active and you can start creating your stories.</p>
            <p><a href="https://osste.com/dashboard" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Creating</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'paymentFailed':
      const failedParams = params as PaymentFailedParams;
      return {
        subject: "Payment Issue - Action Required - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Payment Issue</h1>
            <p>${greeting}</p>
            <p>We had trouble processing your payment${failedParams.amount ? ` of ${formatAmount(failedParams.amount, failedParams.currency || 'usd')}` : ''}.</p>
            ${failedParams.reason ? `<p>Reason: ${failedParams.reason}</p>` : ''}
            <p>Please update your payment method to continue using OSSTE.</p>
            <p><a href="https://osste.com/settings" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment Method</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'recordingStarted':
      const startedParams = params as RecordingStartedParams;
      return {
        subject: "Recording Started - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Recording Started!</h1>
            <p>${greeting}</p>
            <p>Your story recording session has begun${startedParams.questionOrTopic ? ` for: "${startedParams.questionOrTopic}"` : ''}.</p>
            <p>Take your time sharing your memories. You can pause and return whenever you're ready.</p>
            <p><a href="https://osste.com/session/${startedParams.sessionId}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Continue Recording</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'recordingFinished':
      const finishedParams = params as RecordingFinishedParams;
      return {
        subject: "Recording Complete - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Recording Complete!</h1>
            <p>${greeting}</p>
            <p>Your recording has been saved successfully${finishedParams.questionOrTopic ? ` for: "${finishedParams.questionOrTopic}"` : ''}.</p>
            <p>We're now transcribing your story. You'll receive another email when it's ready to review.</p>
            <p><a href="https://osste.com/sessions/${finishedParams.sessionId}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Session</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'transcriptReady':
      const transcriptParams = params as TranscriptReadyParams;
      return {
        subject: "Your Transcript is Ready - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Transcript Ready!</h1>
            <p>${greeting}</p>
            <p>Your chapter "${transcriptParams.chapterTitle}" has been transcribed and is ready for review.</p>
            <p>Take a moment to review and make any edits before it becomes part of your book.</p>
            <p><a href="https://osste.com/chapters/${transcriptParams.chapterId}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Chapter</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'bookPreviewReady':
      const previewParams = params as BookPreviewReadyParams;
      return {
        subject: "Your Book Preview is Ready - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Book Preview Ready!</h1>
            <p>${greeting}</p>
            <p>Your book "${previewParams.bookTitle}" preview is ready to view.</p>
            <p>Take a look and make sure everything looks perfect before finalizing.</p>
            <p><a href="${previewParams.previewUrl}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Preview</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'finalBookReady':
      const bookParams = params as FinalBookReadyParams;
      return {
        subject: "Your Book is Ready! - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Your Book is Ready!</h1>
            <p>${greeting}</p>
            <p>Congratulations! Your book "${bookParams.bookTitle}" is complete and ready to download.</p>
            <p>This beautiful keepsake is now ready to be shared with your loved ones.</p>
            <p><a href="${bookParams.downloadUrl}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Book</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'cancellation':
      const cancelParams = params as CancellationParams;
      return {
        subject: "Subscription Canceled - OSSTE",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">We're Sorry to See You Go</h1>
            <p>${greeting}</p>
            <p>Your${cancelParams.planName ? ` ${cancelParams.planName}` : ''} subscription has been canceled${cancelParams.effectiveDate ? ` effective ${cancelParams.effectiveDate}` : ''}.</p>
            <p>Your stories and recordings will remain accessible, but you won't be able to create new content.</p>
            <p>If you change your mind, we'd love to have you back.</p>
            <p><a href="https://osste.com/pricing" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Resubscribe</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    case 'reactivation':
      const reactivateParams = params as ReactivationParams;
      return {
        subject: "Welcome Back to OSSTE!",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">Welcome Back!</h1>
            <p>${greeting}</p>
            <p>Great news! Your${reactivateParams.planName ? ` ${reactivateParams.planName}` : ''} subscription is now active again.</p>
            <p>We're thrilled to have you back. Continue capturing your stories and creating beautiful keepsake books.</p>
            <p><a href="https://osste.com/dashboard" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a></p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };

    default:
      return {
        subject: "OSSTE Notification",
        html: `
          <div style="${baseStyles}">
            <h1 style="color: #1a1a1a;">OSSTE Update</h1>
            <p>${greeting}</p>
            <p>You have a new notification from OSSTE.</p>
            <p>Warm regards,<br>The OSSTE Team</p>
          </div>
        `
      };
  }
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

    const params: EmailParams = await req.json();
    logStep("Request parsed", { type: params.type, email: params.email });

    if (!params.email || !params.email.includes("@")) {
      throw new Error("Invalid email address");
    }

    if (!params.type) {
      throw new Error("Email type is required");
    }

    // Try to get template ID from environment
    const templateId = getTemplateId(params.type);
    logStep("Template lookup", { type: params.type, hasTemplate: !!templateId });

    let emailResponse;

    if (templateId) {
      // Use Resend template
      // Build dynamic data based on email type
      const dynamicData: Record<string, any> = {
        firstName: params.firstName || 'there',
      };

      // Add type-specific dynamic data
      switch (params.type) {
        case 'welcome':
          dynamicData.source = (params as WelcomeParams).source || 'direct';
          break;
        case 'approved':
          const ap = params as ApprovedParams;
          dynamicData.loginUrl = ap.loginUrl || 'https://osste.com/login';
          dynamicData.betaAccessUntil = ap.betaAccessUntil || '';
          break;
        case 'emailVerification':
          dynamicData.verificationUrl = (params as EmailVerificationParams).verificationUrl;
          break;
        case 'passwordReset':
          dynamicData.resetUrl = (params as PasswordResetParams).resetUrl;
          break;
        case 'paymentSuccess':
          const ps = params as PaymentSuccessParams;
          dynamicData.amount = formatAmount(ps.amount, ps.currency);
          dynamicData.planName = ps.planName || 'OSSTE Plan';
          break;
        case 'paymentFailed':
          const pf = params as PaymentFailedParams;
          dynamicData.amount = pf.amount ? formatAmount(pf.amount, pf.currency || 'usd') : '';
          dynamicData.reason = pf.reason || 'Payment could not be processed';
          break;
        case 'recordingStarted':
          const rs = params as RecordingStartedParams;
          dynamicData.questionOrTopic = rs.questionOrTopic || 'Your Story';
          dynamicData.sessionUrl = `https://osste.com/session/${rs.sessionId}`;
          break;
        case 'recordingFinished':
          const rf = params as RecordingFinishedParams;
          dynamicData.questionOrTopic = rf.questionOrTopic || 'Your Story';
          dynamicData.sessionUrl = `https://osste.com/sessions/${rf.sessionId}`;
          break;
        case 'transcriptReady':
          const tr = params as TranscriptReadyParams;
          dynamicData.chapterTitle = tr.chapterTitle;
          dynamicData.chapterUrl = `https://osste.com/chapters/${tr.chapterId}`;
          break;
        case 'bookPreviewReady':
          const bp = params as BookPreviewReadyParams;
          dynamicData.bookTitle = bp.bookTitle;
          dynamicData.previewUrl = bp.previewUrl;
          break;
        case 'finalBookReady':
          const fb = params as FinalBookReadyParams;
          dynamicData.bookTitle = fb.bookTitle;
          dynamicData.downloadUrl = fb.downloadUrl;
          break;
        case 'cancellation':
          const c = params as CancellationParams;
          dynamicData.planName = c.planName || 'OSSTE';
          dynamicData.effectiveDate = c.effectiveDate || 'immediately';
          break;
        case 'reactivation':
          const r = params as ReactivationParams;
          dynamicData.planName = r.planName || 'OSSTE';
          break;
      }

      logStep("Sending with template", { templateId, dynamicData });

      emailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: [params.email],
        subject: buildFallbackHtml(params).subject, // Use as fallback subject
        react: undefined, // Not using react components
        html: undefined, // Template will provide HTML
        // @ts-ignore - Resend supports templates
        template_id: templateId,
        // @ts-ignore - Resend dynamic data
        data: dynamicData,
      });
    } else {
      // Use fallback HTML
      logStep("Using fallback HTML (no template configured)");
      const { subject, html } = buildFallbackHtml(params);

      emailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: [params.email],
        subject,
        html,
      });
    }

    logStep("Email sent successfully", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${params.type} email sent successfully`,
        emailId: emailResponse.data?.id,
        usedTemplate: !!templateId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Don't throw - return error gracefully so main user flows continue
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 200, // Return 200 so the calling code doesn't fail
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
