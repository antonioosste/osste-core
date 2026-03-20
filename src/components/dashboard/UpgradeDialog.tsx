import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Star, Sparkles, Check, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/useEntitlements";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "limit_reached" | "feature_locked" | "proactive";
}

const upgradePlans = [
  {
    id: "digital",
    name: "Digital",
    price: "$39",
    icon: Star,
    minutes: 60,
    features: [
      "60 minutes recording",
      "PDF download",
      "30,000 words",
      "Photo uploads",
      "Permanent storage",
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    price: "$129",
    icon: Crown,
    minutes: 120,
    popular: true,
    features: [
      "120 minutes recording",
      "Everything in Digital",
      "1 printed hardcover",
      "Custom cover design",
      "Priority AI",
    ],
  },
];

export function UpgradeDialog({ open, onOpenChange, reason = "proactive" }: UpgradeDialogProps) {
  const navigate = useNavigate();
  const { accountUsage } = useEntitlements();

  const effectivePlan = accountUsage?.accountPlan || "free";

  const title =
    reason === "limit_reached"
      ? "You've Reached Your Recording Limit"
      : reason === "feature_locked"
        ? "Upgrade to Unlock This Feature"
        : "Upgrade Your Plan";

  const description =
    reason === "limit_reached"
      ? "Upgrade to get more recording time and unlock premium features."
      : reason === "feature_locked"
        ? "This feature is available on paid plans."
        : "Get more recording time and premium features for your stories.";

  const handleSelect = (planId: string) => {
    onOpenChange(false);
    navigate(`/checkout?plan=${planId}&flow=self`);
  };

  // Filter out plans the user already has or below
  const availablePlans = upgradePlans.filter((p) => {
    const priority: Record<string, number> = { free: 0, digital: 1, legacy: 2 };
    return (priority[p.id] ?? 0) > (priority[effectivePlan] ?? 0);
  });

  if (availablePlans.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>You're on the Highest Plan</DialogTitle>
            <DialogDescription>
              You're already on the Legacy plan with maximum recording time.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                  plan.popular ? "border-primary/30 ring-1 ring-primary/10" : ""
                }`}
                onClick={() => handleSelect(plan.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{plan.name}</h3>
                          {plan.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {plan.price}
                          <span className="text-sm font-normal text-muted-foreground"> one-time</span>
                        </p>
                      </div>
                    </div>
                    <Button size="sm">
                      Upgrade <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <ul className="grid grid-cols-2 gap-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary mr-1.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate("/pricing");
            }}
          >
            Compare All Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
