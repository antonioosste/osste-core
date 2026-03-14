import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Package, Printer, ExternalLink, Truck, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getStatusDisplay,
  TERMINAL_STATUSES,
  buildSupportMailto,
} from "@/lib/printOrderStatus";

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
  last_synced_at: string | null;
  cover_title: string | null;
  cover_subtitle: string | null;
  cover_color_theme: string | null;
  cover_image_url: string | null;
  trim_size: string | null;
}

const THEME_COLORS: Record<string, { bg: string; text: string; accent: string; label: string }> = {
  classic:  { bg: "#2c3e50", text: "#fdfbf7", accent: "#c5a059", label: "Classic" },
  burgundy: { bg: "#722F37", text: "#fdfbf7", accent: "#D4A574", label: "Burgundy" },
  navy:     { bg: "#1B2A4A", text: "#fdfbf7", accent: "#B8860B", label: "Navy" },
  forest:   { bg: "#2D4A3E", text: "#fdfbf7", accent: "#C5A059", label: "Forest" },
  charcoal: { bg: "#333333", text: "#fdfbf7", accent: "#A0A0A0", label: "Charcoal" },
};

const SELECT_COLS =
  "id, status, book_title, format, size, quantity, total_price, lulu_print_job_id, lulu_order_id, lulu_status, error_message, shipping_name, shipping_city, shipping_state, tracking_id, tracking_url, carrier_name, last_synced_at, cover_title, cover_subtitle, cover_color_theme, cover_image_url, trim_size";

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

  useEffect(() => {
    if (!order || TERMINAL_STATUSES.has(order.status)) return;
    const interval = setInterval(() => { fetchOrder(); }, 30000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
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
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500 shrink-0" />
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

  const statusInfo = getStatusDisplay(order.status);
  const isPaid = order.status !== "checkout_created";
  const isTerminal = TERMINAL_STATUSES.has(order.status);
  const hasTracking = order.tracking_id || order.tracking_url || order.carrier_name;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            {statusInfo.isFailure ? (
              <AlertTriangle className="h-8 w-8 text-destructive shrink-0 mt-0.5" />
            ) : isPaid ? (
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Package className="h-8 w-8 text-yellow-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">
                {statusInfo.isFailure ? "Order Needs Attention" : isPaid ? "Order Confirmed!" : "Order Processing"}
              </CardTitle>
              <Badge className={`mt-1.5 ${statusInfo.color}`}>{statusInfo.label}</Badge>
              {!isTerminal && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Auto-refreshing every 30s
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status helper text */}
          <p className="text-sm text-muted-foreground">{statusInfo.helperText}</p>

          {/* Order details */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-medium flex items-center gap-2 text-sm">
              <Printer className="h-4 w-4 shrink-0" /> Order Details
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Book:</span> {order.book_title}</p>
              <p><span className="font-medium text-foreground">Format:</span> {order.format === "hardcover" ? "Hardcover" : "Paperback"} · {order.size}</p>
              <p><span className="font-medium text-foreground">Quantity:</span> {order.quantity}</p>
              <p><span className="font-medium text-foreground">Total:</span> ${order.total_price.toFixed(2)}</p>
              <p><span className="font-medium text-foreground">Ship to:</span> {order.shipping_name}, {order.shipping_city}, {order.shipping_state}</p>
            </div>
          </div>

          {/* Cover design details */}
          {order.cover_title && (() => {
            const theme = THEME_COLORS[order.cover_color_theme || "classic"] || THEME_COLORS.classic;
            return (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-medium flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4 shrink-0" /> Cover Design
                </h3>
                <div className="flex items-start gap-3">
                  <div
                    className="w-14 aspect-[6/9] rounded-sm shadow shrink-0 flex items-center justify-center"
                    style={{ background: theme.bg }}
                  >
                    {order.cover_image_url ? (
                      <img src={order.cover_image_url} alt="" className="w-full h-full object-cover rounded-sm" />
                    ) : (
                      <span className="text-[5px] font-bold text-center px-0.5 leading-tight" style={{ color: theme.text }}>
                        {order.cover_title}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium text-foreground">Title:</span> {order.cover_title}</p>
                    {order.cover_subtitle && <p><span className="font-medium text-foreground">Subtitle:</span> {order.cover_subtitle}</p>}
                    <p><span className="font-medium text-foreground">Theme:</span> {theme.label}</p>
                    {order.trim_size && <p><span className="font-medium text-foreground">Trim:</span> {order.trim_size}</p>}
                  </div>
                </div>
              </div>
            );
          })()}
          {hasTracking && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-medium flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 shrink-0" /> Shipping & Tracking
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {order.carrier_name && (
                  <p><span className="font-medium text-foreground">Carrier:</span> {order.carrier_name}</p>
                )}
                {order.tracking_id && (
                  <p className="break-all">
                    <span className="font-medium text-foreground">Tracking ID:</span> {order.tracking_id}
                  </p>
                )}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium mt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    Track Package
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Error details + support CTA */}
          {(statusInfo.isFailure || order.error_message) && (
            <div className="bg-destructive/10 p-4 rounded-lg space-y-3">
              {order.error_message && (
                <p className="text-sm text-destructive break-words">
                  <span className="font-medium">Error:</span> {order.error_message}
                </p>
              )}
              <a
                href={buildSupportMailto(order.id, order.error_message)}
                className="inline-flex items-center gap-2 text-sm font-medium text-destructive hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" />
                Contact Support
              </a>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-sm">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{isPaid ? "✓" : "⏳"} Payment confirmed</li>
              <li>{order.lulu_print_job_id ? "✓" : "⏳"} Sent to printer</li>
              <li>{order.status === "lulu_in_production" || order.status === "lulu_shipped" ? "✓" : "⏳"} Printing & binding (3–5 business days)</li>
              <li>{order.status === "lulu_shipped" ? "✓" : "⏳"} Shipped to your address (5–7 business days)</li>
            </ul>
          </div>

          {/* Last updated */}
          {order.last_synced_at && (
            <p className="text-xs text-muted-foreground text-right">
              Last updated {new Date(order.last_synced_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
