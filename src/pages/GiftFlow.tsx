import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Gift, Mail, User, Heart, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type GiftPlan = "digital" | "legacy";

interface GiftFormData {
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  senderName: string;
  plan: GiftPlan;
}

export default function GiftFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GiftFormData>({
    recipientEmail: "",
    recipientName: "",
    senderEmail: "",
    senderName: "",
  });

  // Show cancelled message if redirected back from Stripe
  const cancelled = searchParams.get("cancelled");
  if (cancelled) {
    // Clear the param silently
  }

  const handleInputChange = (field: keyof GiftFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.recipientEmail) {
      toast({ title: "Email required", description: "Please enter the recipient's email address.", variant: "destructive" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.senderEmail) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.senderEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleCheckout = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-gift-checkout", {
        body: {
          plan: "digital",
          recipient_email: formData.recipientEmail,
          recipient_name: formData.recipientName,
          sender_email: formData.senderEmail,
          sender_name: formData.senderName,
        },
      });

      if (error) throw new Error(error.message || "Failed to create gift checkout");
      if (data?.error) throw new Error(data.message || data.error);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Gift checkout error:", error);
      toast({ title: "Error", description: error?.message || "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Recipient" },
    { number: 2, title: "Your Info" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Give the Gift of Stories</h1>
            <p className="text-muted-foreground">Send someone special a beautiful invitation to preserve their life story.</p>
          </motion.div>

          {cancelled && (
            <div className="mb-6 p-4 rounded-lg bg-muted text-sm text-muted-foreground text-center">
              Your previous checkout was cancelled. Feel free to try again.
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mb-10">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all",
                  step >= s.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                </div>
                <span className={cn("ml-2 text-sm font-medium hidden sm:block", step >= s.number ? "text-foreground" : "text-muted-foreground")}>
                  {s.title}
                </span>
                {i < steps.length - 1 && <div className={cn("w-12 md:w-20 h-0.5 mx-4", step > s.number ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-primary" />Who is this gift for?</CardTitle>
                    <CardDescription>We'll send them a beautiful digital invitation to begin their life story book.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="recipientEmail" className="flex items-center gap-2"><Mail className="w-4 h-4" />Recipient's Email *</Label>
                      <Input id="recipientEmail" type="email" placeholder="their.email@example.com" value={formData.recipientEmail} onChange={(e) => handleInputChange('recipientEmail', e.target.value)} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientName" className="flex items-center gap-2"><User className="w-4 h-4" />Recipient's Name (optional)</Label>
                      <Input id="recipientName" type="text" placeholder="Their name" value={formData.recipientName} onChange={(e) => handleInputChange('recipientName', e.target.value)} className="h-12" />
                      <p className="text-xs text-muted-foreground">Adding their name will personalize the invitation.</p>
                    </div>
                    <Button onClick={handleNext} className="w-full h-12 text-base">Continue<ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Your Information</CardTitle>
                    <CardDescription>We'll notify you when they begin their story and keep you updated.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="senderEmail" className="flex items-center gap-2"><Mail className="w-4 h-4" />Your Email *</Label>
                      <Input id="senderEmail" type="email" placeholder="your.email@example.com" value={formData.senderEmail} onChange={(e) => handleInputChange('senderEmail', e.target.value)} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senderName" className="flex items-center gap-2"><User className="w-4 h-4" />Your Name (optional)</Label>
                      <Input id="senderName" type="text" placeholder="Your name" value={formData.senderName} onChange={(e) => handleInputChange('senderName', e.target.value)} className="h-12" />
                      <p className="text-xs text-muted-foreground">Your name will appear in the gift invitation.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <h4 className="text-sm font-medium mb-2">Gift Summary</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Sending to: <span className="text-foreground">{formData.recipientEmail}</span></p>
                        {formData.recipientName && <p>Recipient: <span className="text-foreground">{formData.recipientName}</span></p>}
                      </div>
                    </div>
                    <Button onClick={handleCheckout} disabled={loading} className="w-full h-12 text-base">
                      {loading ? "Processing..." : "Continue to Payment"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
