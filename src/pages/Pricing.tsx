import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const oneTimePlans = [
  {
    name: "Starter",
    price: 89,
    description: "Perfect for capturing your first family stories",
    features: [
      "60 minutes of interviews",
      "Up to 3 chapters",
      "Basic PDF export",
      "Email support",
    ],
    cta: "Buy Now",
    popular: false,
    planId: "starter",
  },
  {
    name: "Standard", 
    price: 149,
    description: "Ideal for comprehensive family histories",
    features: [
      "180 minutes of interviews",
      "Up to 8 chapters", 
      "Premium PDF + audio exports",
      "Priority support",
    ],
    cta: "Buy Now",
    popular: true,
    planId: "standard",
  },
  {
    name: "Premium",
    price: 249,
    description: "For complete multi-generational collections",
    features: [
      "Unlimited interview minutes",
      "Unlimited chapters",
      "All export formats + hardcover",
      "Dedicated support specialist",
    ],
    cta: "Buy Now", 
    popular: false,
    planId: "premium",
  },
];

const subscriptionPlans = [
  {
    name: "Basic",
    price: 19,
    period: "month",
    description: "Ongoing story capture for busy families",
    features: [
      "45 minutes per month",
      "Up to 2 chapters monthly",
      "PDF exports",
      "Email support",
    ],
    cta: "Coming Soon",
    popular: false,
    planId: "basic-monthly",
    comingSoon: true,
  },
  {
    name: "Plus",
    price: 39, 
    period: "month",
    description: "Enhanced monthly storytelling package",
    features: [
      "120 minutes per month",
      "Up to 5 chapters monthly",
      "PDF + audio exports",
      "Priority support",
    ],
    cta: "Coming Soon",
    popular: true,
    planId: "plus-monthly", 
    comingSoon: true,
  },
  {
    name: "Pro",
    price: 79,
    period: "month", 
    description: "Professional monthly story documentation",
    features: [
      "Unlimited monthly minutes",
      "Unlimited chapters",
      "All export formats",
      "Dedicated support",
    ],
    cta: "Coming Soon",
    popular: false,
    planId: "pro-monthly",
    comingSoon: true,
  },
];

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. You'll continue to have access to your features until the end of your billing period.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What happens to my stories if I cancel?",
    answer: "Your stories remain yours forever. You can export them at any time, and they'll stay accessible even after cancellation.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Absolutely! You can change your plan at any time. Changes take effect at your next billing cycle.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we use enterprise-grade security with end-to-end encryption. Your stories are private and secure.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              One-time purchases for complete story collections, or monthly subscriptions for ongoing capture.
            </p>
          </div>
        </div>
      </section>

      {/* One-Time Plans */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">One-Time Purchases</h2>
            <p className="text-lg text-muted-foreground">Complete story packages - pay once, keep forever</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {oneTimePlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-primary border-2 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground"> one-time</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-4 h-4 text-success mr-3 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to={`/checkout?plan=${plan.planId}`}>
                      {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="pb-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Monthly Subscriptions</h2>
            <p className="text-lg text-muted-foreground">Ongoing story capture for active families</p>
            <Badge variant="secondary" className="mt-4">Coming Soon</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative opacity-75 ${plan.popular ? 'border-primary border-2 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Small Print */}
          <div className="max-w-4xl mx-auto mt-12 text-center">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Usage Caps:</strong> Interview minutes reset monthly for subscriptions. 
                One-time plans include specified limits with no recurring charges.
              </p>
              <p>
                <strong>Payment Processing:</strong> All payments are securely processed by Stripe. 
                A small processing fee (2.9% + $0.30) applies to all transactions.
              </p>
              <p>
                <strong>Exports:</strong> PDF exports are unlimited on all plans. 
                Premium plans include additional formats and printing options.
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
            <p className="text-lg text-muted-foreground">
              Everything you need to know about our pricing and plans.
            </p>
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
              Ready to Start Your Story Collection?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of families preserving their precious memories with OSSTE.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">
                Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}