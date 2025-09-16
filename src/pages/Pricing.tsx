import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const plans = [
  {
    name: "Starter",
    price: 9,
    description: "Perfect for individuals starting their story collection",
    features: [
      "5 interview sessions per month",
      "30 minutes per session",
      "Basic story templates",
      "PDF story export",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Family",
    price: 24,
    description: "Best for families preserving multiple stories",
    features: [
      "15 interview sessions per month",
      "60 minutes per session",
      "Advanced story templates",
      "PDF & audio exports",
      "Family sharing features",
      "Priority support",
      "Story editing tools",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Professional",
    price: 49,
    description: "For authors, researchers, and professional storytellers",
    features: [
      "Unlimited interview sessions",
      "120 minutes per session",
      "Custom story templates",
      "All export formats",
      "Advanced AI enhancement",
      "Collaboration tools",
      "API access",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    popular: false,
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
              Start with a free trial. Upgrade anytime to unlock more features 
              and capture unlimited stories.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
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
                    <span className="text-muted-foreground">/month</span>
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
                    <Link to="/signup">
                      {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
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