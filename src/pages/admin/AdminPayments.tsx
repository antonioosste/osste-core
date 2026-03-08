import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CreditCard, Loader2, DollarSign, Gift, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AdminPagination, paginate, usePagination } from "@/components/admin/AdminPagination";

export default function AdminPayments() {
  const [billing, setBilling] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingSearch, setBillingSearch] = useState("");
  const [giftSearch, setGiftSearch] = useState("");
  const [billingPage, setBillingPage] = useState(1);
  const [giftPage, setGiftPage] = useState(1);

  useEffect(() => {
    async function fetch() {
      const [{ data: billingData }, { data: giftData }] = await Promise.all([
        supabase.from("user_billing").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("gift_invitations").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      setBilling(billingData || []);
      setGifts(giftData || []);
      setLoading(false);
    }
    fetch();
  }, []);

  const totalRevenue = billing.reduce((sum, b) => sum + (b.amount_paid || 0), 0) / 100;
  const giftRevenue = gifts.reduce((sum, g) => sum + (g.amount_paid || 0), 0) / 100;

  const filteredBilling = billing.filter((b) => {
    if (!billingSearch) return true;
    const q = billingSearch.toLowerCase();
    return b.user_id?.includes(q) || b.plan?.toLowerCase().includes(q) || b.payment_status?.toLowerCase().includes(q);
  });

  const filteredGifts = gifts.filter((g) => {
    if (!giftSearch) return true;
    const q = giftSearch.toLowerCase();
    return g.sender_email?.toLowerCase().includes(q) || g.recipient_email?.toLowerCase().includes(q) || g.sender_name?.toLowerCase().includes(q) || g.recipient_name?.toLowerCase().includes(q);
  });

  const billingPag = usePagination(filteredBilling, 25);
  const giftPag = usePagination(filteredGifts, 25);
  const pagedBilling = paginate(filteredBilling, billingPage, 25);
  const pagedGifts = paginate(filteredGifts, giftPage, 25);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">Revenue and payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Subscription Revenue</p><p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p></div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Gift Revenue</p><p className="text-2xl font-bold">${giftRevenue.toFixed(2)}</p></div>
              <Gift className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Transactions</p><p className="text-2xl font-bold">{billing.length + gifts.length}</p></div>
              <CreditCard className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="billing">
        <TabsList>
          <TabsTrigger value="billing">Subscriptions ({billing.length})</TabsTrigger>
          <TabsTrigger value="gifts">Gifts ({gifts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by user ID, plan, or status..." value={billingSearch} onChange={(e) => { setBillingSearch(e.target.value); setBillingPage(1); }} className="pl-10" />
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedBilling.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.user_id?.slice(0, 8)}...</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{b.plan}</Badge></TableCell>
                        <TableCell>${((b.amount_paid || 0) / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={b.payment_status === "paid" || b.payment_status === "completed" ? "default" : "secondary"} className="text-xs">{b.payment_status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{b.is_manual ? "Manual" : b.provider}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.created_at ? format(new Date(b.created_at), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <AdminPagination page={billingPage} totalPages={billingPag.totalPages} onPageChange={setBillingPage} totalItems={billingPag.totalItems} pageSize={billingPag.pageSize} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gifts" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by sender or recipient..." value={giftSearch} onChange={(e) => { setGiftSearch(e.target.value); setGiftPage(1); }} className="pl-10" />
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sender</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedGifts.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="text-sm">{g.sender_name || g.sender_email}</TableCell>
                        <TableCell className="text-sm">{g.recipient_name || g.recipient_email}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{g.plan || "digital"}</Badge></TableCell>
                        <TableCell>${((g.amount_paid || 0) / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={g.status === "redeemed" ? "default" : g.status === "paid" || g.status === "sent" ? "secondary" : "outline"} className="text-xs capitalize">{g.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(g.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <AdminPagination page={giftPage} totalPages={giftPag.totalPages} onPageChange={setGiftPage} totalItems={giftPag.totalItems} pageSize={giftPag.pageSize} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
