import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { motion } from "framer-motion";
import { useEffect } from "react";
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
  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <ReactLenis root>
      <div className="min-h-screen bg-cream">
        <Header />

        {/* Hero Section — Cream bg with floating blobs */}
        <section className="relative overflow-hidden bg-cream">
          {/* Decorative blobs */}
          <div className="hero-blob-1" />
          <div className="hero-blob-2" />
          <div className="hero-blob-3" />

          <div className="relative z-10 py-24 sm:py-32 md:py-40">
            <LandingHeroTitle />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
            >
              <Button
                size="lg"
                className="btn-sweep btn-text bg-ink text-cream hover:bg-ink px-8 py-6 text-base rounded-[2px]"
                asChild
              >
                <Link to="/session">
                  Start Your Story <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="btn-text border-ink/20 text-ink hover:bg-ink/5 px-8 py-6 text-base rounded-[2px]"
                asChild
              >
                <Link to="/pricing">See Pricing</Link>
              </Button>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex justify-center mt-16"
            >
              <span className="scroll-indicator text-[11px] uppercase tracking-[3px] text-ink-soft font-sans">
                Scroll
              </span>
            </motion.div>
          </div>
        </section>

        {/* Onboarding Decision — blush bg */}
        <OnboardingDecision />

        {/* Value Props — cream bg */}
        <LandingValueProps />

        {/* How It Works — blush bg */}
        <LandingHowItWorks />

        {/* Testimonials — cream bg */}
        <HomeTestimonials />

        {/* Gallery — blush bg */}
        <LandingGallery />

        {/* CTA — ink bg */}
        <LandingCTA />

        {/* Footer — ink bg */}
        <Footer />
      </div>
    </ReactLenis>
  );
}
