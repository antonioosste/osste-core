import { Mic, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const valueProps = [
  {
    icon: Mic,
    number: "01",
    title: "AI-Guided Interviews",
    description:
      "Smart conversations that naturally draw out meaningful stories and memories with personalized follow-up questions.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Professional Polish",
    description:
      "Transform raw recordings into beautifully written stories with AI enhancement while preserving your authentic voice.",
  },
  {
    icon: BookOpen,
    number: "03",
    title: "Lasting Legacy",
    description:
      "Create heirloom-quality books that preserve family stories for future generations in multiple formats.",
  },
];

export function LandingValueProps() {
  return (
    <section className="py-24 md:py-32 bg-cream">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16 md:mb-20 reveal"
        >
          <span className="eyebrow text-gold mb-4 block">Features</span>
          <h2 className="text-3xl md:text-5xl font-display text-ink mb-4">
            Everything You Need to Preserve Stories
          </h2>
          <p className="text-lg text-ink-soft font-body font-light">
            Our platform makes it simple to conduct meaningful interviews and
            create lasting memories.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {valueProps.map((prop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center p-8 reveal reveal-delay-1"
            >
              <span className="font-display text-5xl font-light text-gold/20 block mb-3">
                {prop.number}
              </span>
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blush mx-auto mb-6">
                <prop.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xl font-display text-ink mb-3">
                {prop.title}
              </h3>
              <p className="text-ink-soft leading-relaxed font-body font-light">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
