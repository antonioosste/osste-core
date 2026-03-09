import { Mic, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    numeral: "I",
    eyebrow: "VOICE INTERVIEW",
    step: "Record",
    title: "Voice Interview",
    description: "Start a natural conversation guided by our AI interviewer.",
    icon: Mic,
  },
  {
    numeral: "II",
    eyebrow: "AI WRITING",
    step: "Refine",
    title: "AI Enhancement",
    description: "Our AI polishes your story while preserving your authentic voice.",
    icon: Sparkles,
  },
  {
    numeral: "III",
    eyebrow: "YOUR BOOK",
    step: "Print",
    title: "Beautiful Books",
    description: "Generate professional books ready to share with family.",
    icon: BookOpen,
  },
];

export function LandingHowItWorks() {
  return (
    <section className="py-24 md:py-32 bg-blush">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16 md:mb-20 reveal"
        >
          <span className="eyebrow text-gold mb-4 block">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-display text-ink mb-4">
            From voice to a <span className="italic text-rose">beautiful memoir</span>
          </h2>
          <p className="text-lg text-ink-soft font-body font-light">
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
              className="text-center relative reveal reveal-delay-1"
            >
              {/* Connection line */}
              {index < 2 && (
                <div
                  className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-blush-deep/30 z-0"
                  style={{ transform: "translateX(50%)" }}
                />
              )}

              <div className="relative z-10">
                {/* Eyebrow */}
                <span className="eyebrow text-gold-light block mb-2">
                  {item.eyebrow}
                </span>
                {/* Roman numeral */}
                <span className="font-display text-6xl md:text-7xl font-light text-gold/15 block mb-2">
                  {item.numeral}
                </span>
                <h3 className="text-2xl font-display text-ink mb-1">
                  {item.step}
                </h3>
                <p className="text-ink-soft leading-relaxed font-body font-light max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Infinity symbol */}
        <div className="text-center mt-12">
          <span className="text-4xl text-gold/30 font-display">∞</span>
        </div>
      </div>
    </section>
  );
}
