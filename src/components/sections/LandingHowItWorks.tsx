import { Mic, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

function MicRipple() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center mx-auto mb-4">
      {[0, 0.5, 1].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-[1.5px] border-rose/40"
          style={{ width: 64, height: 64 }}
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay, ease: "easeOut" }}
        />
      ))}
      <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center relative z-10">
        <Mic className="w-6 h-6 text-rose" />
      </div>
    </div>
  );
}

function TypewriterText() {
  return (
    <div className="mx-auto mb-4 h-8 flex items-center justify-center">
      <span className="typewriter-text font-body italic text-[11px] text-ink-soft">
        It was a warm summer morning...
      </span>
    </div>
  );
}

function BookOpenAnim() {
  return (
    <div className="group/book flex items-center justify-center mx-auto mb-4 h-16" style={{ perspective: 400 }}>
      <div className="flex">
        {/* Left cover */}
        <div
          className="w-8 h-12 rounded-l-sm transition-transform duration-500 group-hover/book:[transform:rotateY(30deg)]"
          style={{
            background: "hsl(var(--ink))",
            borderRight: "2px solid hsl(var(--gold))",
            transformOrigin: "right center",
          }}
        />
        {/* Right cover */}
        <div
          className="w-8 h-12 rounded-r-sm"
          style={{ background: "hsl(var(--ink))" }}
        />
      </div>
    </div>
  );
}

const steps = [
  {
    numeral: "I",
    eyebrow: "VOICE INTERVIEW",
    step: "Record",
    description: "Start a natural conversation guided by our AI interviewer.",
    illustration: <MicRipple />,
  },
  {
    numeral: "II",
    eyebrow: "AI WRITING",
    step: "Refine",
    description: "Our AI polishes your story while preserving your authentic voice.",
    illustration: <TypewriterText />,
  },
  {
    numeral: "III",
    eyebrow: "YOUR BOOK",
    step: "Print",
    description: "Generate professional books ready to share with family.",
    illustration: <BookOpenAnim />,
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
                {/* Illustration */}
                {item.illustration}
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
