import { motion } from "framer-motion";

interface AuthBrandPanelProps {
  variant: "login" | "signup";
}

const loginContent = {
  eyebrow: "Welcome back",
  quote: "Your stories are\nwaiting for you.",
  description: "Every chapter you've recorded is safe, preserved, and ready to continue.",
  stats: null,
};

const signupContent = {
  eyebrow: "Begin your story",
  quote: "Every life holds\na story worth telling.",
  description: "Join thousands of families preserving their memories, one story at a time.",
  stats: [
    "12,400+ stories preserved",
    "3,800+ memoir books printed",
    "Trusted by families in 40+ countries",
  ],
};

export function AuthBrandPanel({ variant }: AuthBrandPanelProps) {
  const content = variant === "login" ? loginContent : signupContent;

  return (
    <div className="auth-brand-panel relative flex flex-col justify-between overflow-hidden">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 60%, rgba(196,132,106,0.18) 0%, transparent 65%)",
        }}
      />

      {/* Floating blush blob */}
      <motion.div
        className="pointer-events-none absolute hidden md:block"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(217,184,168,0.08)",
          filter: "blur(80px)",
          top: "20%",
          left: "-10%",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Faint memory photos */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <img
          src="/images/gallery/cozy-library.jpg"
          alt=""
          className="absolute"
          style={{
            width: 90,
            opacity: 0.12,
            filter: "sepia(0.4)",
            borderRadius: 6,
            transform: "rotate(-4deg)",
            top: "15%",
            right: "12%",
          }}
        />
        <img
          src="/images/gallery/family-photos.jpg"
          alt=""
          className="absolute"
          style={{
            width: 80,
            opacity: 0.1,
            filter: "sepia(0.4)",
            borderRadius: 6,
            transform: "rotate(3deg)",
            bottom: "25%",
            left: "8%",
          }}
        />
        <img
          src="/images/backgrounds/library-hero.jpg"
          alt=""
          className="absolute"
          style={{
            width: 100,
            opacity: 0.08,
            filter: "sepia(0.4)",
            borderRadius: 6,
            transform: "rotate(-2deg)",
            bottom: "12%",
            right: "18%",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 py-10 md:px-12 md:py-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-sans font-medium uppercase tracking-[2px] mb-6"
          style={{ color: "hsl(28 30% 51%)" }}
        >
          {content.eyebrow}
        </motion.p>

        <motion.blockquote
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ delay: 0.35 }}
          className="font-serif text-2xl md:text-3xl lg:text-4xl leading-snug font-light whitespace-pre-line mb-6"
          style={{ color: "hsl(30 60% 97%)" }}
        >
          "{content.quote}"
        </motion.blockquote>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
          className="font-sans text-sm leading-relaxed max-w-xs"
          style={{ color: "hsl(30 60% 97%)" }}
        >
          {content.description}
        </motion.p>

        {content.stats && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.65 }}
            className="mt-8 space-y-2"
          >
            {content.stats.map((stat) => (
              <li
                key={stat}
                className="font-sans text-xs tracking-wide"
                style={{ color: "hsl(30 60% 97%)" }}
              >
                · {stat}
              </li>
            ))}
          </motion.ul>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 px-8 pb-6 md:px-12 hidden md:block">
        <p
          className="font-sans text-[11px] tracking-wide"
          style={{ color: "hsl(30 60% 97% / 0.35)" }}
        >
          © 2026 OSSTE · Every life deserves to be written.
        </p>
      </div>
    </div>
  );
}
