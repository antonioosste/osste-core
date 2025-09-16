import { Check, Download, Share2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your book "The Johnson Family Stories" is being generated and will be ready shortly.
          </p>

          {/* Order Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                Order Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground">Order ID:</p>
                </div>
                <div className="text-left">
                  <p className="font-medium">#OSSTE-2024-001</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Amount:</p>
                </div>
                <div className="text-left">
                  <p className="font-medium">$9.99</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Payment Method:</p>
                </div>
                <div className="text-left">
                  <p className="font-medium">•••• 4242</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Status:</p>
                </div>
                <div className="text-left">
                  <Badge className="bg-success">Paid</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Processing Your Book</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI is formatting your stories into a beautiful book layout
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                    2
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Email Notification</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive an email when your book is ready (usually within 10 minutes)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                    3
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Download & Share</p>
                    <p className="text-sm text-muted-foreground">
                      Download in multiple formats and share with your family
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" disabled>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
                <span className="ml-2 text-xs">(Processing...)</span>
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share with Family
              </Button>
            </div>
            
            <Button className="w-full" asChild>
              <Link to="/dashboard">
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Dashboard
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions about your order or need assistance, we're here to help.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
              <Button variant="outline" size="sm">
                View FAQ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}