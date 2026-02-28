import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, CreditCard, Gift } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const plans = {
  digital: {
    name: "Digital Memoir",
    price: "$39",
    priceLabel: "$39 one-time",
    features: [
      "60 minutes of recording (account total)",
      "PDF download",
      "Advanced rewrite (30,000 words)",
      "Permanent storage",
    ]
  },
  legacy: {
    name: "Legacy Memoir",
    price: "$129",
    priceLabel: "$129 one-time",
    features: [
      "60 minutes of recording (account total)",
      "Print integration",
      "1 physical copy included",
      "Custom cover design",
      "Photo uploads",
      "Unlimited rewrites",
      "Permanent storage",
    ]
  }
};

interface GiftData {
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  senderName: string;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [giftData, setGiftData] = useState<GiftData | null>(null);
  
  const planKey = searchParams.get("plan") as keyof typeof plans;
  const flow = searchParams.get("flow"); // 'self' or 'gift'
  const storyGroupId = searchParams.get("story_group_id");
  const selectedPlan = plans[planKey];
  const isGiftFlow = flow === 'gift';

  useEffect(() => {
    if (!selectedPlan) {
      toast({
        title: "Invalid plan",
        description: "Please select a valid plan from our pricing page.",
        variant: "destructive"
      });
      navigate("/pricing");
      return;
    }

    if (isGiftFlow) {
      const storedGiftData = sessionStorage.getItem('giftData');
      if (storedGiftData) {
        setGiftData(JSON.parse(storedGiftData));
      } else {
        toast({
          title: "Missing gift information",
          description: "Please enter the recipient details first.",
          variant: "destructive"
        });
        navigate("/gift");
      }
    }
  }, [selectedPlan, navigate, toast, isGiftFlow]);

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    
    try {
      if (isGiftFlow && giftData) {
        // Gift flow — create invitation and send email
        const { data: invitation, error: invitationError } = await supabase
          .from('gift_invitations')
          .insert({
            sender_email: giftData.senderEmail,
            sender_name: giftData.senderName || null,
            recipient_email: giftData.recipientEmail,
            recipient_name: giftData.recipientName || null,
            status: 'paid',
          })
          .select()
          .single();

        if (invitationError) {
          throw new Error(`Failed to create gift invitation: ${invitationError.message}`);
        }

        await supabase.functions.invoke('send-gift-invitation', {
          body: {
            giftId: invitation.id,
            recipientEmail: giftData.recipientEmail,
            recipientName: giftData.recipientName,
            senderEmail: giftData.senderEmail,
            senderName: giftData.senderName,
          }
        });

        navigate('/gift/confirmation');
      } else {
        // Self flow — call create-plan-checkout edge function for Stripe
        const body: Record<string, string> = { plan: planKey };
        if (storyGroupId) {
          body.story_group_id = storyGroupId;
        }

        const { data, error } = await supabase.functions.invoke('create-plan-checkout', {
          body,
        });

        if (error) {
          throw new Error(error.message || 'Failed to create checkout session');
        }

        if (data?.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned from Stripe');
        }
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: error?.message || "Unable to proceed to payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(isGiftFlow ? "/gift" : "/pricing")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>
              <p className="text-muted-foreground">
                {isGiftFlow 
                  ? "Complete your gift purchase" 
                  : "Complete your purchase to start creating beautiful family stories"}
              </p>
            </div>
          </div>

          {/* Gift Info Banner */}
          {isGiftFlow && giftData && (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      Gift for {giftData.recipientName || giftData.recipientEmail}
                    </p>
                    <p className="text-muted-foreground">
                      A beautiful invitation will be sent to {giftData.recipientEmail}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Summary */}
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
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    What's included:
                  </h4>
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

          {/* Payment Section */}
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
                  {isGiftFlow 
                    ? "Complete your purchase and we'll send a beautiful invitation to your gift recipient."
                    : "You'll be redirected to Stripe's secure checkout to complete your one-time payment."}
                </p>
                
                <Button 
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGiftFlow ? <Gift className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  {isLoading 
                    ? "Processing..." 
                    : isGiftFlow 
                      ? "Complete Gift Purchase" 
                      : "Proceed to Payment"}
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
