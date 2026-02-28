import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LandingCTA() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-4">
            Start Preserving Stories Today
          </h2>
          <p className="text-lg text-muted-foreground mb-10 font-light max-w-xl mx-auto">
            Don't let precious memories fade away. Begin capturing the stories
            that matter most to your family.
          </p>
          <Button size="lg" className="bg-primary hover:bg-antique-hover text-primary-foreground px-10 py-6 text-base" asChild>
            <Link to="/session">
              Start Your Story <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
