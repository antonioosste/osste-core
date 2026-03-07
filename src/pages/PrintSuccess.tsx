import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Package, Printer, ExternalLink, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  checkout_created: { label: "Checkout Created", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Payment Received", color: "bg-green-100 text-green-800" },
  awaiting_pdfs: { label: "Preparing Files", color: "bg-blue-100 text-blue-800" },
  lulu_created: { label: "Sent to Printer", color: "bg-blue-100 text-blue-800" },
  lulu_unpaid: { label: "Awaiting Printer Payment", color: "bg-yellow-100 text-yellow-800" },
  lulu_accepted: { label: "Accepted by Printer", color: "bg-blue-100 text-blue-800" },
  lulu_in_production: { label: "In Production", color: "bg-purple-100 text-purple-800" },
  lulu_production_delayed: { label: "Production Delayed", color: "bg-yellow-100 text-yellow-800" },
  lulu_shipped: { label: "Shipped", color: "bg-green-100 text-green-800" },
  lulu_rejected: { label: "Printer Rejected (action needed)", color: "bg-red-100 text-red-800" },
  lulu_error: { label: "Printer Error", color: "bg-red-100 text-red-800" },
  lulu_cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

const TERMINAL_STATUSES = new Set(["lulu_shipped", "lulu_rejected", "lulu_error", "lulu_cancelled"]);

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
  tracking_id: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
}

const SELECT_COLS = "id, status, book_title, format, size, quantity, total_price, lulu_print_job_id, lulu_order_id, lulu_status, error_message, shipping_name, shipping_city, shipping_state, tracking_id, tracking_url, carrier_name";

export default function PrintSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from("print_orders")
      .select(SELECT_COLS)
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (data) setOrder(data as PrintOrder);
    return data;
  }, [sessionId]);

  // Initial fetch with retries
  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    const initialFetch = async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const data = await fetchOrder();
        if (data) { setLoading(false); return; }
        await new Promise((r) => setTimeout(r, 2000));
      }
      setError("Order not found. It may still be processing — check your dashboard shortly.");
      setLoading(false);
    };

    initialFetch();
  }, [sessionId, fetchOrder]);

  // Auto-refresh every 30s for non-terminal statuses
  useEffect(() => {
    if (!order || TERMINAL_STATUSES.has(order.status)) return;

    const interval = setInterval(() => { fetchOrder(); }, 30000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

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
  const isTerminal = TERMINAL_STATUSES.has(order.status);

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
              {!isTerminal && (
                <p className="text-xs text-muted-foreground mt-1">Auto-refreshing every 30s</p>
              )}
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

          {/* Lulu Fulfillment Details */}
          {(order.lulu_print_job_id || order.lulu_order_id || order.lulu_status) && (
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <h3 className="font-medium">Printer Details</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {order.lulu_print_job_id && (
                  <p><span className="font-medium text-foreground">Print Job ID:</span> {order.lulu_print_job_id}</p>
                )}
                {order.lulu_order_id && (
                  <p><span className="font-medium text-foreground">Order ID:</span> {order.lulu_order_id}</p>
                )}
                {order.lulu_status && (
                  <p><span className="font-medium text-foreground">Printer Status:</span> {order.lulu_status}</p>
                )}
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {(order.tracking_id || order.tracking_url || order.carrier_name) && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" /> Shipping & Tracking
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {order.carrier_name && (
                  <p><span className="font-medium text-foreground">Carrier:</span> {order.carrier_name}</p>
                )}
                {order.tracking_id && (
                  <p><span className="font-medium text-foreground">Tracking ID:</span> {order.tracking_id}</p>
                )}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium mt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Track Package
                  </a>
                )}
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
              <li>{isPaid ? "✓" : "⏳"} Payment confirmed</li>
              <li>{order.lulu_print_job_id ? "✓" : "⏳"} Sent to printer</li>
              <li>{order.status === "lulu_in_production" || order.status === "lulu_shipped" ? "✓" : "⏳"} Professional printing & binding (3-5 business days)</li>
              <li>{order.status === "lulu_shipped" ? "✓" : "⏳"} Shipped to your address (5-7 business days)</li>
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
