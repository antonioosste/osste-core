import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Gift, AlertCircle, CheckCircle, LogIn, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type GiftStatus = "loading" | "ready" | "redeemed" | "not_found" | "error";

export default function RedeemGift() {
  const { gift_id } = useParams<{ gift_id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<GiftStatus>("loading");
  const [giftData, setGiftData] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!gift_id) { setStatus("not_found"); return; }

    const fetchGift = async () => {
      // Use service-level access via RPC or direct query
      // Since RLS restricts to sender/recipient, unauthenticated users can't query directly.
      // We'll attempt the query — if the user is the recipient (authenticated), it works.
      // For unauthenticated users, we show auth prompt without fetching details.
      if (!user) {
        setStatus("ready");
        return;
      }

      const { data, error } = await supabase
        .from("gift_invitations")
        .select("*")
        .eq("id", gift_id)
        .maybeSingle();

      if (error || !data) {
        setStatus("not_found");
        return;
      }

      if (data.status === "redeemed") {
        setStatus("redeemed");
        setGiftData(data);
        return;
      }

      if (data.status !== "paid" && data.status !== "sent") {
        setStatus("error");
        return;
      }

      setGiftData(data);
      setStatus("ready");
    };

    fetchGift();
  }, [gift_id, user]);

  const handleRedeem = useCallback(async () => {
    if (!user || !gift_id) return;
    setRedeeming(true);

    try {
      // Re-fetch to prevent race conditions
      const { data: gift, error: fetchErr } = await supabase
        .from("gift_invitations")
        .select("*")
        .eq("id", gift_id)
        .single();

      if (fetchErr || !gift) throw new Error("Gift not found");
      if (gift.status === "redeemed") {
        toast({ title: "Already redeemed", description: "This gift has already been claimed.", variant: "destructive" });
        setStatus("redeemed");
        return;
      }

      const plan = (gift as any).plan || "digital";

      const PLAN_DEFAULTS: Record<string, { minutes_limit: number; words_limit: number | null; pdf_enabled: boolean; printing_enabled: boolean; photo_uploads_enabled: boolean }> = {
        digital: { minutes_limit: 60, words_limit: 30000, pdf_enabled: true, printing_enabled: false, photo_uploads_enabled: true },
        legacy:  { minutes_limit: 120, words_limit: null, pdf_enabled: true, printing_enabled: true, photo_uploads_enabled: true },
      };
      const defaults = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.digital;

      // Create a story group for the user with the gifted plan + limits
      const { data: storyGroup, error: sgErr } = await supabase
        .from("story_groups")
        .insert({
          user_id: user.id,
          title: "My Story",
          plan,
          minutes_limit: defaults.minutes_limit,
          words_limit: defaults.words_limit,
          pdf_enabled: defaults.pdf_enabled,
          printing_enabled: defaults.printing_enabled,
          photo_uploads_enabled: defaults.photo_uploads_enabled,
          archive_at: null,
        })
        .select("id")
        .single();

      if (sgErr) throw new Error(`Failed to create story group: ${sgErr.message}`);

      // Mark gift as redeemed
      const { error: updateErr } = await supabase
        .from("gift_invitations")
        .update({
          redeemed_by: user.id,
          redeemed_at: new Date().toISOString(),
          status: "redeemed",
        })
        .eq("id", gift_id);

      if (updateErr) throw new Error(`Failed to update gift: ${updateErr.message}`);

      // Update profile plan
      await supabase.from("profiles").update({ plan }).eq("id", user.id);

      toast({ title: "Gift redeemed!", description: "Your story group has been created. Welcome to OSSTE!" });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Redemption error:", err);
      toast({ title: "Redemption failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  }, [user, gift_id, navigate, toast]);

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 md:py-20 px-4">
        <div className="max-w-lg mx-auto">
          {status === "not_found" && (
            <Card>
              <CardContent className="pt-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold">Gift Not Found</h2>
                <p className="text-muted-foreground">This gift link is invalid or has expired.</p>
                <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
              </CardContent>
            </Card>
          )}

          {status === "redeemed" && (
            <Card>
              <CardContent className="pt-8 text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                <h2 className="text-xl font-semibold">Gift Already Redeemed</h2>
                <p className="text-muted-foreground">This gift has already been claimed.</p>
                <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          )}

          {status === "error" && (
            <Card>
              <CardContent className="pt-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold">Something Went Wrong</h2>
                <p className="text-muted-foreground">This gift may not have been paid for yet. Please contact support.</p>
                <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
              </CardContent>
            </Card>
          )}

          {status === "ready" && !user && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 mx-auto">
                    <Gift className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl">You've Received a Gift!</CardTitle>
                  <CardDescription>Sign in or create an account to redeem your OSSTE gift and start preserving your stories.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full h-12" size="lg">
                    <Link to={`/signup?redirect=/redeem/${gift_id}`}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12" size="lg">
                    <Link to={`/login?redirect=/redeem/${gift_id}`}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Log In
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === "ready" && user && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 mx-auto">
                    <Gift className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl">Redeem Your Gift</CardTitle>
                  <CardDescription>
                    {giftData?.sender_name
                      ? `${giftData.sender_name} has gifted you an OSSTE ${(giftData as any)?.plan || "digital"} plan.`
                      : `You've been gifted an OSSTE ${(giftData as any)?.plan || "digital"} plan!`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleRedeem} disabled={redeeming} className="w-full h-12" size="lg">
                    {redeeming ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redeeming...</> : "Redeem Gift"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
