import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gift, Check, Heart, Mail, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface GiftData {
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  senderName: string;
}

export default function GiftConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [giftData, setGiftData] = useState<GiftData | null>(null);

  useEffect(() => {
    // Get gift data from session storage
    const storedData = sessionStorage.getItem('giftData');
    if (storedData) {
      setGiftData(JSON.parse(storedData));
      // Clear it after reading
      sessionStorage.removeItem('giftData');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 md:py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative inline-flex mb-8"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </motion.div>
            </div>
            
            {/* Floating icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <Gift className="w-8 h-8 text-amber-500" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-2 -left-2"
            >
              <Heart className="w-6 h-6 text-rose-500" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="absolute top-0 -left-4"
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Gift Has Been Sent!
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              A beautiful invitation is on its way. We'll notify you when they begin their story.
            </p>

            {/* Gift Details Card */}
            {giftData && (
              <Card className="mb-8 border-border/50 shadow-lg text-left">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Gift Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Sent to</span>
                      <span className="text-foreground font-medium">
                        {giftData.recipientName || giftData.recipientEmail}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-foreground">{giftData.recipientEmail}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">From</span>
                      <span className="text-foreground">
                        {giftData.senderName || giftData.senderEmail}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What happens next */}
            <Card className="mb-8 border-border/50 bg-muted/30 text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">What happens next?</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                      1
                    </div>
                    <span className="text-muted-foreground">
                      Your recipient will receive a beautiful email invitation to start their OSSTE journey.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                      2
                    </div>
                    <span className="text-muted-foreground">
                      They'll create their account and begin capturing their life story at their own pace.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5">
                      3
                    </div>
                    <span className="text-muted-foreground">
                      You'll receive an email notification when they begin their story.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/gift")}
                className="h-12"
              >
                Send Another Gift
              </Button>
              <Button
                onClick={() => navigate("/")}
                className="h-12"
              >
                Back to Home
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
