/**
 * OSSTE Email Service Client
 * 
 * Typed helper functions for sending emails via the send-email edge function.
 * All functions are async, return { success, emailId?, error? }, and never throw.
 */

import { supabase } from '@/integrations/supabase/client';

interface EmailResponse {
  success: boolean;
  message?: string;
  emailId?: string;
  usedTemplate?: boolean;
  duplicate?: boolean;
  error?: string;
}

// Client-side dedup guard: prevent rapid-fire duplicate calls within 10s
const recentCalls = new Map<string, number>();
const CLIENT_DEDUP_MS = 10_000;

async function sendEmail(params: Record<string, unknown>): Promise<EmailResponse> {
  // Client-side dedup: block duplicate calls for same type+email within 10s
  const dedupKey = `${params.type}:${params.email}`;
  const now = Date.now();
  const lastCall = recentCalls.get(dedupKey);
  if (lastCall && now - lastCall < CLIENT_DEDUP_MS) {
    console.log(`[Email] Client dedup: suppressed duplicate ${params.type} for ${params.email}`);
    return { success: true, duplicate: true };
  }
  recentCalls.set(dedupKey, now);

  // Prune old entries
  for (const [k, ts] of recentCalls) {
    if (now - ts > CLIENT_DEDUP_MS) recentCalls.delete(k);
  }

  try {
    console.log(`[Email] Sending ${params.type} to ${params.email} at ${new Date().toISOString()}`);
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error(`[Email] Error sending ${params.type} email:`, error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      console.log(`[Email] ${params.type} email sent:`, data.emailId || '(no id)', data.duplicate ? '(server dedup)' : '');
    } else {
      console.warn(`[Email] ${params.type} email failed:`, data?.error);
    }

    return data as EmailResponse;
  } catch (err) {
    console.error(`[Email] Exception sending ${params.type} email:`, err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Helpers ──

export async function sendWelcomeEmail(params: {
  email: string;
  firstName?: string;
  source?: 'waitlist' | 'direct';
}): Promise<EmailResponse> {
  return sendEmail({ type: 'welcome', ...params, idempotencyKey: `welcome:${params.email}` });
}

export async function sendAccountCreationEmail(params: {
  email: string;
  firstName?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'accountCreation', ...params, idempotencyKey: `accountCreation:${params.email}` });
}

export async function sendEmailVerificationEmail(params: {
  email: string;
  verificationUrl: string;
  firstName?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'emailVerification', ...params });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  resetUrl: string;
  firstName?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'passwordReset', ...params });
}

export async function sendPaymentSuccessEmail(params: {
  email: string;
  firstName?: string;
  amount: number;
  currency: string;
  planName?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'paymentSuccess', ...params });
}

export async function sendPaymentFailedEmail(params: {
  email: string;
  firstName?: string;
  amount?: number;
  currency?: string;
  reason?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'paymentFailed', ...params });
}

export async function sendRecordingFinishedEmail(params: {
  email: string;
  firstName?: string;
  questionOrTopic?: string;
  sessionId: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'recordingFinished', ...params, idempotencyKey: `recordingFinished:${params.sessionId}` });
}

export async function sendTranscriptReadyEmail(params: {
  email: string;
  firstName?: string;
  chapterTitle: string;
  sessionId: string;
  chapterId: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'transcriptReady', ...params, idempotencyKey: `transcriptReady:${params.chapterId}` });
}

export async function sendBookPreviewReadyEmail(params: {
  email: string;
  firstName?: string;
  bookTitle: string;
  previewUrl: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'bookPreviewReady', ...params });
}

export async function sendFinalBookReadyEmail(params: {
  email: string;
  firstName?: string;
  bookTitle: string;
  downloadUrl: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'finalBookReady', ...params });
}

export async function sendCancellationEmail(params: {
  email: string;
  firstName?: string;
  planName?: string;
  effectiveDate?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'cancellation', ...params });
}

export async function sendReactivationEmail(params: {
  email: string;
  firstName?: string;
  planName?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'reactivation', ...params });
}

export async function sendApprovedEmail(params: {
  email: string;
  firstName?: string;
  loginUrl?: string;
  betaAccessUntil?: string;
}): Promise<EmailResponse> {
  return sendEmail({ type: 'approved', ...params });
}
