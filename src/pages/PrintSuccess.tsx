import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Package, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  checkout_created: { label: "Checkout Created", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Payment Received", color: "bg-green-100 text-green-800" },
  awaiting_pdfs: { label: "Preparing Files", color: "bg-blue-100 text-blue-800" },
  lulu_created: { label: "Sent to Printer", color: "bg-blue-100 text-blue-800" },
  lulu_unpaid: { label: "Awaiting Lulu Payment", color: "bg-yellow-100 text-yellow-800" },
  lulu_in_production: { label: "In Production", color: "bg-purple-100 text-purple-800" },
  lulu_shipped: { label: "Shipped", color: "bg-green-100 text-green-800" },
  lulu_error: { label: "Print Error", color: "bg-red-100 text-red-800" },
};

interface PrintOrder {
  id: string;
  status: string;
  book_title: string;
  format: string;
  size: string;
  quantity: number;
  total_price: number;
  lulu_print_job_id: string | null;
  lulu_order_id: string | null;
  lulu_status: string | null;
  error_message: string | null;
  shipping_name: string;
  shipping_city: string;
  shipping_state: string;
}

export default function PrintSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      // The webhook may not have fired yet — retry a few times
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data, error: fetchErr } = await supabase
          .from("print_orders")
          .select("id, status, book_title, format, size, quantity, total_price, lulu_print_job_id, lulu_order_id, lulu_status, error_message, shipping_name, shipping_city, shipping_state")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (data) {
          setOrder(data as PrintOrder);
          setLoading(false);
          return;
        }

        if (fetchErr) {
          console.error("Error fetching print order:", fetchErr);
        }

        // Wait 2s before retrying
        await new Promise((r) => setTimeout(r, 2000));
      }

      setError("Order not found. It may still be processing — check your dashboard shortly.");
      setLoading(false);
    };

    fetchOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <Card>
          <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <CardTitle>Order Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || "Unable to load order details."}</p>
            <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: "bg-muted text-muted-foreground" };
  const isPaid = order.status !== "checkout_created";

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isPaid ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <Package className="h-8 w-8 text-yellow-500" />
            )}
            <div>
              <CardTitle>{isPaid ? "Order Confirmed!" : "Order Processing"}</CardTitle>
              <Badge className={`mt-1 ${statusInfo.color}`}>{statusInfo.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPaid && (
            <p className="text-muted-foreground">
              Thank you for your order! We've received your payment and will begin printing your book soon.
            </p>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Printer className="h-4 w-4" /> Order Details
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Book:</span> {order.book_title}</p>
              <p><span className="font-medium text-foreground">Format:</span> {order.format === "hardcover" ? "Hardcover" : "Paperback"} · {order.size}</p>
              <p><span className="font-medium text-foreground">Quantity:</span> {order.quantity}</p>
              <p><span className="font-medium text-foreground">Total:</span> ${order.total_price.toFixed(2)}</p>
              <p><span className="font-medium text-foreground">Ship to:</span> {order.shipping_name}, {order.shipping_city}, {order.shipping_state}</p>
            </div>
          </div>

          {(order.lulu_print_job_id || order.lulu_order_id) && (
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <h3 className="font-medium">Print Tracking</h3>
              <div className="text-sm text-muted-foreground">
                {order.lulu_print_job_id && <p>Print Job: {order.lulu_print_job_id}</p>}
                {order.lulu_order_id && <p>Order ID: {order.lulu_order_id}</p>}
                {order.lulu_status && <p>Printer Status: {order.lulu_status}</p>}
              </div>
            </div>
          )}

          {order.error_message && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p className="text-sm font-medium">Error: {order.error_message}</p>
              <p className="text-xs mt-1">Our team has been notified and will reach out if action is needed.</p>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Payment confirmed</li>
              <li>{order.lulu_print_job_id ? "✓" : "⏳"} Sent to printer</li>
              <li>⏳ Professional printing & binding (3-5 business days)</li>
              <li>⏳ Shipped to your address (5-7 business days)</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
