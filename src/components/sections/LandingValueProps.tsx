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
    <section className="py-24 md:py-32 bg-cream relative overflow-hidden">
      {/* Faint grain texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Watermark book SVG */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <svg
          width="500"
          height="500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(168, 132, 92, 0.04)"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-[1]">
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
