import { X, ArrowLeft, HelpCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mx-auto mb-6">
            <X className="w-8 h-8 text-orange-600" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payment Cancelled
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your payment was cancelled and no charges were made. You can try again or explore other options.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Happened?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You cancelled the payment process before it was completed. No charges were applied 
                to your payment method and your plan was not changed.
              </p>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Good news:</strong> You can return to the pricing page anytime to 
                  purchase a plan and start creating beautiful family stories.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Your Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-left">
                <div>
                  <h4 className="font-medium mb-1">Try a Different Payment Method</h4>
                  <p className="text-sm text-muted-foreground">
                    If you experienced issues with your card, try using a different payment method.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Choose a Different Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse our pricing options to find a plan that best fits your needs.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Continue with Free Features</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore the free features available while you decide on a plan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="w-full gap-2" asChild>
                <Link to="/pricing">
                  <RefreshCw className="w-4 h-4" />
                  View Pricing Plans
                </Link>
              </Button>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to="/pricing">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Pricing
                </Link>
              </Button>
            </div>
            
            <Button variant="outline" className="w-full" asChild>
              <Link to="/dashboard">
                Continue to Dashboard
              </Link>
            </Button>
          </div>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Still Having Trouble?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you continue to experience issues with payment, our support team is here to help.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">Contact Support</Button>
              <Button variant="outline" size="sm">Live Chat</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
