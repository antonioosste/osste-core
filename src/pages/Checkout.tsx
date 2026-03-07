import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const plans = {
  digital: {
    name: "Digital Memoir",
    price: "$39",
    priceLabel: "$39 one-time",
    features: [
      "60 minutes of recording",
      "AI-polished memoir (up to 30,000 words)",
      "Downloadable PDF book",
      "Unlimited rewrites",
      "Permanent storage",
      "Photo uploads",
    ]
  },
  legacy: {
    name: "Legacy Memoir",
    price: "$129",
    priceLabel: "$129 one-time",
    features: [
      "120 minutes of recording",
      "Everything in Digital",
      "1 printed hardcover book included",
      "Professional book formatting",
      "Custom cover design",
      "Print-on-demand reorders anytime",
      "Priority AI processing",
    ]
  }
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const planKey = searchParams.get("plan") as keyof typeof plans;
  const storyGroupId = searchParams.get("story_group_id");
  const selectedPlan = plans[planKey];

  useEffect(() => {
    if (!selectedPlan) {
      toast({ title: "Invalid plan", description: "Please select a valid plan from our pricing page.", variant: "destructive" });
      navigate("/pricing");
    }
  }, [selectedPlan, navigate, toast]);

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    
    try {
      const body: Record<string, string> = { plan: planKey };
      if (storyGroupId) body.story_group_id = storyGroupId;

      const { data, error } = await supabase.functions.invoke('create-plan-checkout', { body });

      if (error) {
        let parsed: any = null;
        try { parsed = typeof error === 'object' ? error : JSON.parse(String(error)); } catch {}
        const errorCode = parsed?.error || data?.error;
        const msg = parsed?.message || data?.message || error.message || 'Failed to create checkout session';
        const err = new Error(msg) as any;
        err.errorCode = errorCode || data?.error;
        throw err;
      }

      if (data?.error) {
        const err = new Error(data.message || 'Failed to create checkout session') as any;
        err.errorCode = data.error;
        throw err;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from Stripe');
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const errorCode = error?.errorCode;
      let title = "Checkout Error";
      let description = error?.message || "Unable to proceed to payment. Please try again.";

      if (errorCode === "already_on_highest_plan") {
        title = "Plan Already Active";
        description = "You are already on the highest available plan.";
      } else if (errorCode === "already_on_plan") {
        title = "Plan Already Active";
        description = "You are already on this plan.";
      }

      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPlan) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate("/pricing")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>
              <p className="text-muted-foreground">Complete your purchase to start creating beautiful family stories</p>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Summary</span>
                <Badge variant="secondary">{selectedPlan.name}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{selectedPlan.name}</span>
                  <span>{selectedPlan.priceLabel}</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">What's included:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <hr />
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total</span>
                  <span>{selectedPlan.priceLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to Stripe's secure checkout to complete your one-time payment.
                </p>
                <Button onClick={handleCheckout} disabled={isLoading} className="w-full gap-2" size="lg">
                  <CreditCard className="w-4 h-4" />
                  {isLoading ? "Processing..." : "Proceed to Payment"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Secure one-time payment processed by Stripe.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
