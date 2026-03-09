import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LandingCTA() {
  return (
    <section className="py-24 md:py-32 bg-ink">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center reveal"
        >
          <span className="eyebrow text-gold-light mb-6 block">
            Begin today
          </span>
          <h2 className="text-3xl md:text-5xl font-display text-cream mb-4">
            Don't let precious memories{" "}
            <span className="italic text-rose">fade away.</span>
          </h2>
          <p className="text-lg text-cream/70 mb-10 font-body font-light max-w-xl mx-auto">
            Start preserving the stories that matter most to your family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="btn-text bg-gold hover:bg-gold-light text-cream px-10 py-6 text-base rounded-[2px]"
              asChild
            >
              <Link to="/session">
                Start Your Story <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="btn-text border-cream/20 text-cream hover:bg-cream/10 px-10 py-6 text-base rounded-[2px]"
              asChild
            >
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-cream/50 font-sans">
            Free to start · No credit card required · Your voice, your story
          </p>
        </motion.div>
      </div>
    </section>
  );
}
