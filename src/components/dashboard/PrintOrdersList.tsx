import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, ChevronRight, ExternalLink, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getStatusDisplay } from "@/lib/printOrderStatus";

interface PrintOrderRow {
  id: string;
  status: string;
  book_title: string;
  quantity: number;
  total_price: number;
  created_at: string | null;
  tracking_url: string | null;
  stripe_session_id: string | null;
}

export function PrintOrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PrintOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("print_orders")
        .select("id, status, book_title, quantity, total_price, created_at, tracking_url, stripe_session_id")
        .order("created_at", { ascending: false })
        .limit(5);
      setOrders((data as PrintOrderRow[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/40">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) return null;

  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Print Orders</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => {
          const statusInfo = getStatusDisplay(order.status);
          return (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer gap-3"
              onClick={() => {
                if (order.stripe_session_id) {
                  navigate(`/print-success?session_id=${order.stripe_session_id}`);
                }
              }}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{order.book_title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${statusInfo.color}`}>
                    {statusInfo.isFailure && <AlertTriangle className="h-3 w-3 mr-1 inline-block" />}
                    {statusInfo.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
