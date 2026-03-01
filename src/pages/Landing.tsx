import { ArrowRight, Mic, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomeTestimonials } from "@/components/sections/HomeTestimonials";
import { LandingHeroTitle } from "@/components/sections/LandingHeroTitle";
import { OnboardingDecision } from "@/components/onboarding/OnboardingDecision";
import { LandingHowItWorks } from "@/components/sections/LandingHowItWorks";
import { LandingValueProps } from "@/components/sections/LandingValueProps";
import { LandingGallery } from "@/components/sections/LandingGallery";
import { LandingCTA } from "@/components/sections/LandingCTA";

export default function Landing() {
  return (
    <ReactLenis root>
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section
          className="relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/backgrounds/library-hero.jpg')"
          }}>

          <div className="overlay-warm" />

          <div className="relative z-10 py-24 sm:py-32 md:py-40">
            <LandingHeroTitle />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-10">

              <Button size="lg" className="bg-primary hover:bg-antique-hover text-primary-foreground px-8 py-6 text-base" asChild>
                <Link to="/session">
                  Start Your Story <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base" asChild>
                <Link to="/pricing" className="bg-primary">See Pricing</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Onboarding Decision */}
        <OnboardingDecision />

        {/* Value Props */}
        <LandingValueProps />

        {/* How It Works */}
        <LandingHowItWorks />

        {/* Testimonials */}
        <HomeTestimonials />

        {/* Gallery */}
        <LandingGallery />

        {/* CTA */}
        <LandingCTA />

        <Footer />
      </div>
    </ReactLenis>);

}