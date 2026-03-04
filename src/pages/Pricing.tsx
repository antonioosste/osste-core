import { Check, ArrowRight, Star, Crown, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const plans = [
  {
    name: "Free",
    price: 0,
    priceLabel: "Free",
    description: "Try OSSTE and capture your first memories",
    icon: Sparkles,
    features: [
      "20 minutes of recording (account total)",
      "Online reading only",
      "30-day project retention",
    ],
    notIncluded: [
      "PDF download",
      "Printing",
      "Photo uploads",
    ],
    cta: "Get Started",
    planId: "free",
    popular: false,
    stripePriceId: null,
  },
  {
    name: "Digital",
    price: 39,
    priceLabel: "$39",
    description: "Create a beautiful digital keepsake",
    icon: Star,
    features: [
      "60 minutes of recording (account total)",
      "PDF download",
      "Advanced rewrite (30,000 words)",
      "Permanent storage",
    ],
    notIncluded: [
      "Print integration",
      "Photo uploads",
    ],
    cta: "Buy Now",
    planId: "digital",
    popular: true,
    stripePriceId: "price_digital",
  },
  {
    name: "Legacy",
    price: 129,
    priceLabel: "$129",
    description: "The complete heirloom experience",
    icon: Crown,
    features: [
      "60 minutes of recording (account total)",
      "Print integration",
      "1 physical copy included",
      "Custom cover design",
      "Photo uploads",
      "Unlimited rewrites",
      "Permanent storage",
    ],
    notIncluded: [],
    cta: "Buy Now",
    planId: "legacy",
    popular: false,
    stripePriceId: "price_legacy",
  },
];

const faqs = [
  {
    question: "Are these one-time payments?",
    answer: "Yes! Digital and Legacy are one-time purchases per project. No subscriptions, no recurring charges. Recording time is shared across all your books at the account level.",
  },
  {
    question: "What happens to my Free project after 30 days?",
    answer: "Free projects are archived after 30 days — your data is preserved but editing is locked. Upgrade anytime to restore full access.",
  },
  {
    question: "Can I upgrade a Free project later?",
    answer: "Absolutely! You can upgrade any project from Free to Digital or Legacy at any time. Your existing recordings and content are preserved.",
  },
  {
    question: "What's included in the physical copy?",
    answer: "The Legacy plan includes one professionally printed paperback book shipped to your address, with a custom cover design.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we use enterprise-grade security with end-to-end encryption. Your stories are private and secure.",
  },
];

const PLAN_PRIORITY: Record<string, number> = { free: 0, digital: 1, legacy: 2 };

function getPlanButtonState(planId: string, effectivePlan: string) {
  const ePriority = PLAN_PRIORITY[effectivePlan] ?? 0;
  const pPriority = PLAN_PRIORITY[planId] ?? 0;

  if (planId === "free") {
    if (effectivePlan === "free") return { disabled: false, label: "Get Started", tooltip: "" };
    return { disabled: true, label: "Current Baseline", tooltip: "" };
  }

  if (planId === effectivePlan) {
    return { disabled: true, label: "Current Plan", tooltip: "You are already on this plan." };
  }

  if (pPriority < ePriority) {
    return { disabled: true, label: "Included in " + (effectivePlan === "legacy" ? "Legacy" : "Your Plan"), tooltip: "You are already on the highest plan." };
  }

  if (pPriority > ePriority) {
    return { disabled: false, label: effectivePlan === "free" ? "Buy Now" : "Upgrade to " + (planId === "legacy" ? "Legacy" : "Digital"), tooltip: "" };
  }

  return { disabled: false, label: "Buy Now", tooltip: "" };
}

export default function Pricing() {
  const { user } = useAuth();
  const { accountUsage, loading: entLoading } = useEntitlements();
  const navigate = useNavigate();

  const effectivePlan = accountUsage?.accountPlan || "free";

  const handleSelectPlan = (planId: string) => {
    if (planId === "free") {
      navigate(user ? "/dashboard" : "/signup");
      return;
    }
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/checkout?plan=${planId}&flow=self`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Preserve Your Stories
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              One-time purchases. No subscriptions. Your memories, forever.
            </p>
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isActivePlan = user && plan.planId === effectivePlan && plan.planId !== "free";
                const isHighestTier = user && effectivePlan === "legacy" && plan.planId === "legacy";
                const btnState = user ? getPlanButtonState(plan.planId, effectivePlan) : { disabled: false, label: plan.cta, tooltip: "" };

                return (
                  <Card
                    key={plan.planId}
                    className={`relative transition-all ${
                      isActivePlan
                        ? "border-primary border-2 shadow-lg ring-1 ring-primary/20"
                        : plan.popular && !user
                          ? "border-primary border-2 shadow-lg scale-105"
                          : ""
                    }`}
                  >
                    {/* Badges */}
                    {isActivePlan && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        {isHighestTier ? "Highest Tier" : "Active"}
                      </Badge>
                    )}
                    {!isActivePlan && plan.popular && !user && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}

                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-3">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        {plan.name}
                        {isActivePlan && (
                          <Badge variant="outline" className="text-xs font-normal">
                            Current Plan
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.priceLabel}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground"> one-time</span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2">{plan.description}</p>
                    </CardHeader>

                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center">
                            <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                        {plan.notIncluded.map((feature, i) => (
                          <li key={`no-${i}`} className="flex items-center opacity-40">
                            <span className="w-4 h-4 mr-3 flex-shrink-0 text-center text-xs">—</span>
                            <span className="text-sm text-muted-foreground line-through">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {btnState.tooltip ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full block">
                              <Button
                                className="w-full opacity-50 cursor-not-allowed"
                                variant={isActivePlan ? "default" : "outline"}
                                disabled
                                data-action="select-plan"
                                data-plan-id={plan.planId}
                              >
                                {btnState.label}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{btnState.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          className="w-full"
                          variant={plan.popular || isActivePlan ? "default" : "outline"}
                          disabled={btnState.disabled || entLoading}
                          onClick={() => !btnState.disabled && handleSelectPlan(plan.planId)}
                          data-action="select-plan"
                          data-plan-id={plan.planId}
                        >
                          {btnState.label} {!btnState.disabled && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Small Print */}
          <div className="max-w-4xl mx-auto mt-12 text-center">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>One-Time Payments:</strong> Digital and Legacy are per-project purchases. No recurring charges.
              </p>
              <p>
                <strong>Payment Processing:</strong> All payments are securely processed by Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Preserve Your Family Stories?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start for free, upgrade when you're ready.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
