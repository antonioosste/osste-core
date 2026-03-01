import { useEffect, useState, useCallback } from "react";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { sendPaymentSuccessEmail } from "@/lib/emails";
import { supabase } from "@/integrations/supabase/client";

const POLL_INTERVAL = 3000;
const MAX_POLLS = 20; // 60 seconds max

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [planReady, setPlanReady] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const expectedPlan = searchParams.get("plan");

  // Poll user_billing to confirm webhook has processed
  const checkBillingReady = useCallback(async () => {
    if (!user) return false;
    try {
      const { data } = await (supabase as any)
        .from("user_billing")
        .select("plan")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.plan && data.plan !== "free") {
        // If we know the expected plan, match it; otherwise any paid plan is fine
        if (!expectedPlan || data.plan === expectedPlan) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [user, expectedPlan]);

  // Send confirmation email once
  useEffect(() => {
    if (user?.email) {
      sendPaymentSuccessEmail({
        email: user.email,
        firstName: user.user_metadata?.name || undefined,
        amount: 0,
        currency: "usd",
        planName: expectedPlan || "OSSTE Plan",
      });
    }

    toast({
      title: "Payment successful!",
      description: "Activating your plan — this may take a moment...",
    });
  }, [user, expectedPlan, toast]);

  // Poll for webhook completion
  useEffect(() => {
    if (planReady) return;

    const interval = setInterval(async () => {
      const ready = await checkBillingReady();
      setPollCount((c) => c + 1);

      if (ready) {
        setPlanReady(true);
        clearInterval(interval);
        toast({
          title: "Plan activated!",
          description: "Your plan is now active. Redirecting to dashboard...",
        });
        // Short delay so user sees the confirmation
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [planReady, checkBillingReady, navigate, toast]);

  // Timeout fallback: redirect anyway after max polls
  useEffect(() => {
    if (pollCount >= MAX_POLLS && !planReady) {
      toast({
        title: "Taking longer than expected",
        description: "Redirecting to dashboard. Your plan should be active shortly.",
      });
      navigate("/dashboard");
    }
  }, [pollCount, planReady, navigate, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your purchase! Your plan is being activated.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Badge className="bg-green-600">
                  {planReady ? "Active" : "Processing"}
                </Badge>
                Purchase Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                {!planReady ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm">
                      Activating your plan — this usually takes a few seconds...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your plan is active! Redirecting to dashboard...
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to your registered email address.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                  <div className="text-left">
                    <p className="font-medium">Start Recording Stories</p>
                    <p className="text-sm text-muted-foreground">Begin capturing your family memories</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                  <div className="text-left">
                    <p className="font-medium">Generate Beautiful Books</p>
                    <p className="text-sm text-muted-foreground">Use our tools to create professional-quality books</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                  <div className="text-left">
                    <p className="font-medium">Share with Family</p>
                    <p className="text-sm text-muted-foreground">Download and share your stories with loved ones</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Button className="w-full" size="lg" asChild>
              <Link to="/dashboard">
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Dashboard
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              {planReady
                ? "Redirecting automatically..."
                : "Will redirect once your plan is activated..."}
            </p>
          </div>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Need Help Getting Started?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our guides or contact our support team if you have any questions.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">View Guides</Button>
              <Button variant="outline" size="sm">Contact Support</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
