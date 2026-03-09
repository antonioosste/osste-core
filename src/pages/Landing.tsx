import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
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
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { ReadingProgressBar } from "@/components/landing/ReadingProgressBar";
import { FloatingMemoryImages } from "@/components/landing/FloatingMemoryImages";

export default function Landing() {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleVideoError = () => {
    if (videoRef.current) videoRef.current.style.display = "none";
  };

  return (
    <ReactLenis root>
      <ReadingProgressBar />
      <div className="min-h-screen bg-cream">
        <Header />

        {/* Hero Section — Video bg + blobs + phone mockup */}
        <section className="relative overflow-hidden bg-cream">
          {/* Background video — deepest layer */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onError={handleVideoError}
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ filter: "saturate(0.7) brightness(0.95)" }}
          >
            <source
              src="https://videos.pexels.com/video-files/5973965/5973965-sd_640_360_25fps.mp4"
              type="video/mp4"
            />
          </video>

          {/* Warm overlay above video */}
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(251,246,241,0.72) 0%, rgba(242,228,220,0.65) 50%, rgba(251,246,241,0.85) 100%)",
            }}
          />

          {/* Floating memory images */}
          <FloatingMemoryImages />

          {/* Decorative blobs — z-2 */}
          <div className="hero-blob-1 z-[2]" />
          <div className="hero-blob-2 z-[2]" />
          <div className="hero-blob-3 z-[2]" />

          {/* Hero content — z-3 */}
          <div className="relative z-[3] py-24 sm:py-32 md:py-40">
            {/* Two-column layout on desktop */}
            <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
              {/* Left column — text */}
              <div className="lg:w-[55%] lg:text-left text-center">
                <LandingHeroTitle />

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="flex flex-col sm:flex-row gap-4 lg:justify-start justify-center mt-10"
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
                  className="lg:justify-start justify-center flex mt-16"
                >
                  <span className="scroll-indicator text-[11px] uppercase tracking-[3px] text-ink-soft font-sans">
                    Scroll
                  </span>
                </motion.div>
              </div>

              {/* Right column — phone mockup */}
              <div className="lg:w-[45%] flex justify-center">
                <PhoneMockup />
              </div>
            </div>
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
