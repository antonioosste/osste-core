/**
 * Test Email Page - Development Only
 * 
 * Allows testing all email templates for the currently logged-in user.
 * Navigate to /test-email?type=welcome to test a specific template.
 * 
 * Available types: welcome, accountCreation, emailVerification, passwordReset,
 * paymentSuccess, paymentFailed, recordingStarted, recordingFinished,
 * transcriptReady, bookPreviewReady, finalBookReady, cancellation, reactivation
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { 
  sendWelcomeEmail,
  sendAccountCreationEmail,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendRecordingStartedEmail,
  sendRecordingFinishedEmail,
  sendTranscriptReadyEmail,
  sendBookPreviewReadyEmail,
  sendFinalBookReadyEmail,
  sendCancellationEmail,
  sendReactivationEmail,
} from '@/lib/emails';

const EMAIL_TYPES = [
  { value: 'welcome', label: 'Welcome (Waitlist)' },
  { value: 'accountCreation', label: 'Account Creation' },
  { value: 'emailVerification', label: 'Email Verification' },
  { value: 'passwordReset', label: 'Password Reset' },
  { value: 'paymentSuccess', label: 'Payment Success' },
  { value: 'paymentFailed', label: 'Payment Failed' },
  { value: 'recordingStarted', label: 'Recording Started' },
  { value: 'recordingFinished', label: 'Recording Finished' },
  { value: 'transcriptReady', label: 'Transcript Ready' },
  { value: 'bookPreviewReady', label: 'Book Preview Ready' },
  { value: 'finalBookReady', label: 'Final Book Ready' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'reactivation', label: 'Reactivation' },
];

export default function TestEmail() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'welcome';
  const [emailType, setEmailType] = useState(initialType);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSendEmail = async () => {
    if (!user?.email) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to test emails.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const firstName = user.user_metadata?.name || 'Test User';
    const email = user.email;

    try {
      let response;

      switch (emailType) {
        case 'welcome':
          response = await sendWelcomeEmail({ email, firstName, source: 'waitlist' });
          break;
        case 'accountCreation':
          response = await sendAccountCreationEmail({ email, firstName });
          break;
        case 'emailVerification':
          response = await sendEmailVerificationEmail({ 
            email, 
            firstName, 
            verificationUrl: 'https://osste.com/verify?token=test123' 
          });
          break;
        case 'passwordReset':
          response = await sendPasswordResetEmail({ 
            email, 
            firstName, 
            resetUrl: 'https://osste.com/reset?token=test123' 
          });
          break;
        case 'paymentSuccess':
          response = await sendPaymentSuccessEmail({ 
            email, 
            firstName, 
            amount: 4999, 
            currency: 'usd',
            planName: 'Legacy Story Plan'
          });
          break;
        case 'paymentFailed':
          response = await sendPaymentFailedEmail({ 
            email, 
            firstName, 
            amount: 4999,
            currency: 'usd',
            reason: 'Card declined'
          });
          break;
        case 'recordingStarted':
          response = await sendRecordingStartedEmail({ 
            email, 
            firstName, 
            questionOrTopic: 'Tell me about your childhood',
            sessionId: 'test-session-123'
          });
          break;
        case 'recordingFinished':
          response = await sendRecordingFinishedEmail({ 
            email, 
            firstName, 
            questionOrTopic: 'Tell me about your childhood',
            sessionId: 'test-session-123'
          });
          break;
        case 'transcriptReady':
          response = await sendTranscriptReadyEmail({ 
            email, 
            firstName, 
            chapterTitle: 'My Childhood Memories',
            sessionId: 'test-session-123',
            chapterId: 'test-chapter-123'
          });
          break;
        case 'bookPreviewReady':
          response = await sendBookPreviewReadyEmail({ 
            email, 
            firstName, 
            bookTitle: 'Our Family Story',
            previewUrl: 'https://osste.com/books/preview/test123'
          });
          break;
        case 'finalBookReady':
          response = await sendFinalBookReadyEmail({ 
            email, 
            firstName, 
            bookTitle: 'Our Family Story',
            downloadUrl: 'https://osste.com/books/download/test123'
          });
          break;
        case 'cancellation':
          response = await sendCancellationEmail({ 
            email, 
            firstName, 
            planName: 'Legacy Story Plan',
            effectiveDate: new Date().toLocaleDateString()
          });
          break;
        case 'reactivation':
          response = await sendReactivationEmail({ 
            email, 
            firstName, 
            planName: 'Legacy Story Plan'
          });
          break;
        default:
          response = { success: false, error: 'Unknown email type' };
      }

      setResult({
        success: response.success,
        message: response.success 
          ? `Email sent successfully! ID: ${response.emailId || 'N/A'}` 
          : `Failed: ${response.error}`,
      });

      toast({
        title: response.success ? 'Email sent!' : 'Email failed',
        description: response.success 
          ? `Check your inbox at ${email}` 
          : response.error,
        variant: response.success ? 'default' : 'destructive',
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={!!user} />
      
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Test Email Templates</CardTitle>
            <CardDescription>
              Send test emails to your account ({user?.email || 'Not logged in'})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Type</label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendEmail} 
              disabled={loading || !user}
              className="w-full"
            >
              {loading ? 'Sending...' : `Send ${EMAIL_TYPES.find(t => t.value === emailType)?.label} Email`}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <p className="text-sm font-medium">{result.success ? 'Success' : 'Error'}</p>
                <p className="text-sm">{result.message}</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Note:</strong> This page is for development testing only.</p>
              <p>Emails will be sent to: <code className="bg-muted px-1 rounded">{user?.email || 'N/A'}</code></p>
              <p>If template IDs are not configured, fallback HTML will be used.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
