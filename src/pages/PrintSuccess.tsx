import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function PrintSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Here you could verify the payment and create the order in the database
    // For now, we'll just show a success message
  }, [sessionId]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <CardTitle>Order Confirmed!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your order! We've received your payment and will begin printing your book soon.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ We'll send you an email confirmation with your order details</li>
              <li>✓ Your book will be professionally printed and bound (3-5 business days)</li>
              <li>✓ We'll ship it to your address (5-7 business days for delivery)</li>
              <li>✓ You'll receive tracking information once shipped</li>
            </ul>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/stories')}>
              View All Books
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}