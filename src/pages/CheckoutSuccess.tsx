import { useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Show success message
    toast({
      title: "Welcome to your new plan!",
      description: "Your subscription is now active. Start creating beautiful family stories.",
    });

    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your purchase! Your subscription is now active and you can start creating beautiful family stories.
          </p>

          {/* Subscription Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Badge className="bg-green-600">Active</Badge>
                Subscription Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your subscription has been activated and you now have access to all premium features.
                </p>
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to your registered email address.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Start Creating Stories</p>
                    <p className="text-sm text-muted-foreground">
                      Begin writing and organizing your family memories
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Generate Beautiful Books</p>
                    <p className="text-sm text-muted-foreground">
                      Use our premium templates to create professional-quality books
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Share with Family</p>
                    <p className="text-sm text-muted-foreground">
                      Download and share your stories with loved ones
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <Button className="w-full" size="lg" asChild>
              <Link to="/dashboard">
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Dashboard
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Redirecting automatically in 5 seconds...
            </p>
          </div>

          {/* Support */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Need Help Getting Started?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our guides or contact our support team if you have any questions.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                View Guides
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}