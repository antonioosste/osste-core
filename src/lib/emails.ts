/**
 * OSSTE Email Service Client
 * 
 * This module provides typed helper functions for sending emails via the send-email edge function.
 * 
 * ADDING A NEW EMAIL TYPE:
 * 1. Add the template ID secret in Supabase (RESEND_TEMPLATE_*)
 * 2. Add the function parameters interface below
 * 3. Create the send function
 * 
 * WIRING TO A FEATURE:
 * 1. Import the relevant send function
 * 2. Call it with the required parameters
 * 3. Errors are logged but not thrown (email failures shouldn't break user flows)
 * 
 * All functions are async and return { success: boolean, emailId?: string, error?: string }
 */

import { supabase } from '@/integrations/supabase/client';

// Response type from the edge function
interface EmailResponse {
  success: boolean;
  message?: string;
  emailId?: string;
  usedTemplate?: boolean;
  error?: string;
}

// Generic email sender
async function sendEmail(params: Record<string, any>): Promise<EmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error(`[Email] Error sending ${params.type} email:`, error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      console.log(`[Email] ${params.type} email sent:`, data.emailId);
    } else {
      console.warn(`[Email] ${params.type} email may have failed:`, data?.error);
    }

    return data as EmailResponse;
  } catch (err) {
    console.error(`[Email] Exception sending ${params.type} email:`, err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send welcome email (for waitlist signups and direct welcomes)
 */
export async function sendWelcomeEmail(params: {
  email: string;
  firstName?: string;
  source?: 'waitlist' | 'direct';
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'welcome',
    ...params,
  });
}

/**
 * Send account creation confirmation email
 */
export async function sendAccountCreationEmail(params: {
  email: string;
  firstName?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'accountCreation',
    ...params,
  });
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(params: {
  email: string;
  verificationUrl: string;
  firstName?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'emailVerification',
    ...params,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  resetUrl: string;
  firstName?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'passwordReset',
    ...params,
  });
}

/**
 * Send payment success/subscription confirmation email
 */
export async function sendPaymentSuccessEmail(params: {
  email: string;
  firstName?: string;
  amount: number; // Amount in cents
  currency: string; // e.g., 'usd'
  planName?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'paymentSuccess',
    ...params,
  });
}

/**
 * Send payment failed/retry needed email
 */
export async function sendPaymentFailedEmail(params: {
  email: string;
  firstName?: string;
  amount?: number;
  currency?: string;
  reason?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'paymentFailed',
    ...params,
  });
}

/**
 * Send recording started notification email
 */
export async function sendRecordingStartedEmail(params: {
  email: string;
  firstName?: string;
  questionOrTopic?: string;
  sessionId: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'recordingStarted',
    ...params,
  });
}

/**
 * Send recording finished notification email
 */
export async function sendRecordingFinishedEmail(params: {
  email: string;
  firstName?: string;
  questionOrTopic?: string;
  sessionId: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'recordingFinished',
    ...params,
  });
}

/**
 * Send transcript ready notification email
 */
export async function sendTranscriptReadyEmail(params: {
  email: string;
  firstName?: string;
  chapterTitle: string;
  sessionId: string;
  chapterId: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'transcriptReady',
    ...params,
  });
}

/**
 * Send book preview ready notification email
 */
export async function sendBookPreviewReadyEmail(params: {
  email: string;
  firstName?: string;
  bookTitle: string;
  previewUrl: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'bookPreviewReady',
    ...params,
  });
}

/**
 * Send final book ready notification email
 */
export async function sendFinalBookReadyEmail(params: {
  email: string;
  firstName?: string;
  bookTitle: string;
  downloadUrl: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'finalBookReady',
    ...params,
  });
}

/**
 * Send cancellation/subscription ended email
 */
export async function sendCancellationEmail(params: {
  email: string;
  firstName?: string;
  planName?: string;
  effectiveDate?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'cancellation',
    ...params,
  });
}

/**
 * Send reactivation email (subscription resumed or re-engagement)
 */
export async function sendReactivationEmail(params: {
  email: string;
  firstName?: string;
  planName?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'reactivation',
    ...params,
  });
}

/**
 * Send beta approval notification email with login link
 */
export async function sendApprovedEmail(params: {
  email: string;
  firstName?: string;
  loginUrl?: string;
  betaAccessUntil?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    type: 'approved',
    ...params,
  });
}
