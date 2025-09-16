import { X, ArrowLeft, HelpCircle } from "lucide-react";
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
          {/* Cancel Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-6">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payment Cancelled
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your payment was cancelled and no charges were made to your account.
          </p>

          {/* Information Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Happened?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You cancelled the payment process before it was completed. Your book generation 
                was not started and no charges were applied to your payment method.
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Your book preview is still saved and you can complete 
                  the purchase anytime from your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Common Issues */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Common Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-left">
                <div>
                  <h4 className="font-medium mb-1">Payment Method Issues</h4>
                  <p className="text-sm text-muted-foreground">
                    Make sure your card details are correct and your card has sufficient funds.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Browser Issues</h4>
                  <p className="text-sm text-muted-foreground">
                    Try refreshing the page or using a different browser if you're experiencing technical difficulties.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Security Concerns</h4>
                  <p className="text-sm text-muted-foreground">
                    Our payment processing is secure and encrypted. We never store your payment information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="w-full" asChild>
                <Link to="/checkout">
                  Try Payment Again
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/book/preview">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Preview
                </Link>
              </Button>
            </div>
            
            <Button variant="outline" className="w-full" asChild>
              <Link to="/dashboard">
                Continue to Dashboard
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Still Having Trouble?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you continue to experience issues with payment, our support team is here to help.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
              <Button variant="outline" size="sm">
                Live Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}