import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Lock, Printer, RefreshCw, Upload, Eye, RotateCcw, Loader2,
  ArrowLeft, ExternalLink, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  checkout_created: { label: "Checkout Created", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  awaiting_pdfs: { label: "Awaiting PDFs", variant: "outline" },
  lulu_submitting: { label: "Submitting…", variant: "outline" },
  lulu_created: { label: "Sent to Printer", variant: "default" },
  lulu_unpaid: { label: "Awaiting Printer Payment", variant: "outline" },
  lulu_accepted: { label: "Accepted", variant: "default" },
  lulu_in_production: { label: "In Production", variant: "default" },
  lulu_production_delayed: { label: "Delayed", variant: "destructive" },
  lulu_shipped: { label: "Shipped", variant: "default" },
  lulu_rejected: { label: "Rejected", variant: "destructive" },
  lulu_error: { label: "Lulu Error", variant: "destructive" },
  lulu_retry_exhausted: { label: "Retry Exhausted", variant: "destructive" },
  lulu_cancelled: { label: "Cancelled", variant: "destructive" },
  needs_manual_review: { label: "Needs Review", variant: "destructive" },
};

const ALERT_VARIANTS: Record<string, "secondary" | "destructive" | "outline"> = {
  none: "secondary",
  warned: "outline",
  escalated: "destructive",
};

type PrintOrder = {
  id: string;
  book_title: string;
  status: string;
  lulu_status: string | null;
  lulu_print_job_id: string | null;
  lulu_order_id: string | null;
  user_id: string;
  error_message: string | null;
  alert_state: string;
  tracking_id: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  interior_pdf_url: string | null;
  cover_pdf_url: string | null;
  created_at: string | null;
  last_status_change_at: string | null;
  last_synced_at: string | null;
  submit_attempts: number;
  sync_attempts: number;
};

type ActionType = "retry_lulu_submit" | "force_sync" | "update_pdfs" | "mark_needs_review" | "requeue_webhook";

export default function AdminPrintOrders() {
  const { toast } = useToast();
  const { isAdmin, loading } = useAdminRole();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state for update_pdfs
  const [pdfDialogOrder, setPdfDialogOrder] = useState<PrintOrder | null>(null);
  const [interiorUrl, setInteriorUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // Dialog state for mark_needs_review
  const [reviewDialogOrder, setReviewDialogOrder] = useState<PrintOrder | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("print_orders")
      .select("id, book_title, status, lulu_status, lulu_print_job_id, lulu_order_id, user_id, error_message, alert_state, tracking_id, tracking_url, carrier_name, interior_pdf_url, cover_pdf_url, created_at, last_status_change_at, last_synced_at, submit_attempts, sync_attempts")
      .order("created_at", { ascending: false });

    if (!error && data) setOrders(data as unknown as PrintOrder[]);
    setLoadingOrders(false);
  };

  useEffect(() => { if (isAdmin) fetchOrders(); }, [isAdmin]);

  const executeAction = async (orderId: string, action: ActionType, payload?: Record<string, unknown>) => {
    setActionLoading(`${orderId}-${action}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-print-order-action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ print_order_id: orderId, action, payload }),
        },
      );

      const result = await resp.json();

      if (!resp.ok) {
        throw new Error(result.error || "Action failed");
      }

      toast({
        title: "Action completed",
        description: `${action.replace(/_/g, " ")} — ${result.result?.ok ? "Success" : result.result?.error || "Done"}`,
      });

      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const isLoading = (orderId: string, action: string) => actionLoading === `${orderId}-${action}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Admin Access Only</h1>
          <p className="text-lg text-muted-foreground mb-8">You need administrator privileges.</p>
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const statusInfo = (status: string) => STATUS_LABELS[status] || { label: status, variant: "secondary" as const };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Printer className="w-7 h-7" /> Print Orders
            </h1>
            <p className="text-muted-foreground">{orders.length} orders total</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchOrders}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        {loadingOrders ? (
          <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No print orders found.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const si = statusInfo(order.status);
              return (
                <Card key={order.id} className={order.alert_state === "escalated" ? "border-destructive" : order.alert_state === "warned" ? "border-orange-400" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{order.book_title}</p>
                          <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={si.variant}>{si.label}</Badge>
                          {order.lulu_status && (
                            <Badge variant="outline" className="text-xs">Lulu: {order.lulu_status}</Badge>
                          )}
                          {order.alert_state !== "none" && (
                            <Badge variant={ALERT_VARIANTS[order.alert_state] || "secondary"}>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {order.alert_state}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Lulu Job: </span>
                          <span className="font-mono text-xs">{order.lulu_print_job_id || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lulu Order: </span>
                          <span className="font-mono text-xs">{order.lulu_order_id || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submits: </span>
                          <span>{order.submit_attempts}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Syncs: </span>
                          <span>{order.sync_attempts}</span>
                        </div>
                        {order.tracking_id && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Tracking: </span>
                            {order.tracking_url ? (
                              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                                {order.tracking_id} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span>{order.tracking_id}</span>
                            )}
                            {order.carrier_name && <span className="text-muted-foreground ml-1">({order.carrier_name})</span>}
                          </div>
                        )}
                        {order.last_synced_at && (
                          <div>
                            <span className="text-muted-foreground">Last sync: </span>
                            <span className="text-xs">{format(new Date(order.last_synced_at), "MMM d, HH:mm")}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          <span className="text-xs">{order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "—"}</span>
                        </div>
                      </div>

                      {/* Error message */}
                      {order.error_message && (
                        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                          <strong>Error:</strong> {order.error_message}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!actionLoading}
                          onClick={() => executeAction(order.id, "retry_lulu_submit")}
                        >
                          {isLoading(order.id, "retry_lulu_submit") ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RotateCcw className="w-4 h-4 mr-1" />}
                          Retry Submit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!actionLoading}
                          onClick={() => executeAction(order.id, "force_sync")}
                        >
                          {isLoading(order.id, "force_sync") ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                          Force Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!actionLoading}
                          onClick={() => {
                            setPdfDialogOrder(order);
                            setInteriorUrl(order.interior_pdf_url || "");
                            setCoverUrl(order.cover_pdf_url || "");
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" /> Update PDFs
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!actionLoading}
                          onClick={() => {
                            setReviewDialogOrder(order);
                            setReviewNote("");
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Needs Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!actionLoading}
                          onClick={() => executeAction(order.id, "requeue_webhook")}
                        >
                          {isLoading(order.id, "requeue_webhook") ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                          Requeue
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Update PDFs Dialog */}
        <Dialog open={!!pdfDialogOrder} onOpenChange={(open) => !open && setPdfDialogOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update PDF URLs</DialogTitle>
              <DialogDescription>Update the interior and/or cover PDF URLs for this order.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Interior PDF URL</Label>
                <Input value={interiorUrl} onChange={(e) => setInteriorUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Cover PDF URL</Label>
                <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPdfDialogOrder(null)}>Cancel</Button>
              <Button
                disabled={!!actionLoading}
                onClick={async () => {
                  if (pdfDialogOrder) {
                    await executeAction(pdfDialogOrder.id, "update_pdfs", {
                      interior_pdf_url: interiorUrl || undefined,
                      cover_pdf_url: coverUrl || undefined,
                    });
                    setPdfDialogOrder(null);
                  }
                }}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mark Needs Review Dialog */}
        <Dialog open={!!reviewDialogOrder} onOpenChange={(open) => !open && setReviewDialogOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark as Needs Review</DialogTitle>
              <DialogDescription>Add a note explaining why this order needs manual review.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Reason for flagging..." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOrder(null)}>Cancel</Button>
              <Button
                disabled={!!actionLoading}
                onClick={async () => {
                  if (reviewDialogOrder) {
                    await executeAction(reviewDialogOrder.id, "mark_needs_review", { note: reviewNote });
                    setReviewDialogOrder(null);
                  }
                }}
              >
                Flag for Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
