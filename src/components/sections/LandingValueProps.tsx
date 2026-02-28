import { Mic, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const valueProps = [
  {
    icon: Mic,
    title: "AI-Guided Interviews",
    description:
      "Smart conversations that naturally draw out meaningful stories and memories with personalized follow-up questions.",
  },
  {
    icon: Sparkles,
    title: "Professional Polish",
    description:
      "Transform raw recordings into beautifully written stories with AI enhancement while preserving your authentic voice.",
  },
  {
    icon: BookOpen,
    title: "Lasting Legacy",
    description:
      "Create heirloom-quality books that preserve family stories for future generations in multiple formats.",
  },
];

export function LandingValueProps() {
  return (
    <section className="py-24 md:py-32 bg-paper-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16 md:mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-4">
            Everything You Need to Preserve Stories
          </h2>
          <p className="text-lg text-muted-foreground font-light">
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
              className="text-center p-8"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-6">
                <prop.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-sans">
                {prop.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-light">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
