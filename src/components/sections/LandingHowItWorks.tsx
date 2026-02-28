import { Mic, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    step: "Record",
    title: "Voice Interview",
    description: "Start a natural conversation guided by our AI interviewer.",
    icon: Mic,
  },
  {
    number: "02",
    step: "Refine",
    title: "AI Enhancement",
    description: "Our AI polishes your story while preserving your authentic voice.",
    icon: Sparkles,
  },
  {
    number: "03",
    step: "Print",
    title: "Beautiful Books",
    description: "Generate professional books ready to share with family.",
    icon: BookOpen,
  },
];

export function LandingHowItWorks() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16 md:mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Three simple steps to create beautiful family stories.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 max-w-5xl mx-auto">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center relative"
            >
              {/* Connection line */}
              {index < 2 && (
                <div
                  className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-border z-0"
                  style={{ transform: "translateX(50%)" }}
                />
              )}

              <div className="relative z-10">
                {/* Large step number */}
                <span className="font-display text-6xl md:text-7xl font-bold text-primary/15 block mb-2">
                  {item.number}
                </span>
                <h3 className="text-2xl font-display text-foreground mb-1">
                  {item.step}
                </h3>
                <h4 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">
                  {item.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed font-light max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
