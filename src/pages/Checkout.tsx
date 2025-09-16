import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";

const plans = {
  basic: {
    name: "Basic Plan",
    price: "$9.99",
    priceId: "price_basic",
    features: [
      "Up to 10 stories per month",
      "Basic PDF generation",
      "Standard templates"
    ]
  },
  premium: {
    name: "Premium Plan", 
    price: "$19.99",
    priceId: "price_premium",
    features: [
      "Unlimited stories",
      "Premium PDF generation",
      "Custom templates",
      "Priority support"
    ]
  },
  family: {
    name: "Family Plan",
    price: "$29.99", 
    priceId: "price_family",
    features: [
      "Everything in Premium",
      "Multiple family accounts",
      "Shared story collections",
      "Family tree integration"
    ]
  }
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const planKey = searchParams.get("plan") as keyof typeof plans;
  const selectedPlan = plans[planKey];

  useEffect(() => {
    if (!selectedPlan) {
      toast({
        title: "Invalid plan",
        description: "Please select a valid plan from our pricing page.",
        variant: "destructive"
      });
      navigate("/pricing");
    }
  }, [selectedPlan, navigate, toast]);

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          plan: planKey
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: "Unable to proceed to payment. Please try again.",
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
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/pricing")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Pricing
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>
              <p className="text-muted-foreground">
                Complete your purchase to start creating beautiful family stories
              </p>
            </div>
          </div>

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
                  <span>{selectedPlan.price}/month</span>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    What's included:
                  </h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <hr />

                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total</span>
                  <span>{selectedPlan.price}/month</span>
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
                  You'll be redirected to Stripe's secure checkout to complete your payment.
                  Your subscription will begin immediately after successful payment.
                </p>
                
                <Button 
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4" />
                  {isLoading ? "Processing..." : "Proceed to Payment"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment processed by Stripe. Cancel anytime.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}