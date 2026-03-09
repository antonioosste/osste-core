import { motion } from "framer-motion";
import { Home, BookOpen, User, ChevronLeft, Menu, Mic } from "lucide-react";

function WaveformBars() {
  return (
    <div className="flex items-end gap-[3px] justify-center mt-2">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gold"
          animate={{ height: [8, 18, 8] }}
          transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      className="relative"
      style={{ transform: "rotate(-2deg)" }}
    >
      {/* Perpetual float */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Phone frame */}
        <div
          className="relative mx-auto"
          style={{
            width: 280,
            height: 560,
            borderRadius: 40,
            background: "#1A1410",
            border: "8px solid #2C2218",
            boxShadow:
              "0 0 0 1px rgba(168,132,92,0.3), 0 40px 80px rgba(44,34,24,0.35)",
          }}
        >
          {/* Side button */}
          <div
            className="absolute"
            style={{
              right: -5,
              top: 120,
              width: 3,
              height: 60,
              background: "#3A2E24",
              borderRadius: 2,
            }}
          />

          {/* Screen */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: 8,
              left: 8,
              right: 8,
              bottom: 8,
              borderRadius: 32,
              background: "hsl(var(--cream))",
            }}
          >
            {/* Notch */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
              style={{
                width: 90,
                height: 28,
                background: "#1A1410",
                borderRadius: "0 0 16px 16px",
              }}
            />

            {/* Status bar */}
            <div className="h-3 flex items-center justify-end px-6 pt-1 gap-1">
              <div className="w-1 h-1 rounded-full bg-ink-soft/40" />
              <div className="w-1 h-1 rounded-full bg-ink-soft/40" />
            </div>

            {/* App header */}
            <div className="flex items-center justify-between px-4 py-2 mt-4">
              <ChevronLeft className="w-4 h-4 text-ink" />
              <span className="font-display text-sm text-ink">OSSTE</span>
              <Menu className="w-4 h-4 text-ink" />
            </div>

            {/* Main content - AI interview screen */}
            <div className="px-3 mt-2 flex-1">
              <div
                className="rounded-2xl p-5 flex flex-col items-center"
                style={{ background: "hsl(var(--blush))" }}
              >
                {/* Label */}
                <span
                  className="font-sans text-gold block mb-4"
                  style={{
                    fontSize: 8,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    fontWeight: 500,
                  }}
                >
                  AI Interviewer
                </span>

                {/* Question bubble */}
                <div className="bg-white/90 rounded-xl px-4 py-3 mb-6 w-full">
                  <p
                    className="font-body italic text-ink text-center"
                    style={{ fontSize: 11, lineHeight: 1.5 }}
                  >
                    Tell me about your earliest childhood memory...
                  </p>
                </div>

                {/* Pulsing mic */}
                <div className="relative flex items-center justify-center mb-3">
                  {/* Ripple rings */}
                  {[0, 0.5, 1].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-rose/40"
                      style={{ width: 44, height: 44 }}
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center relative z-10"
                    style={{ background: "hsl(var(--rose))" }}
                  >
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Listening text */}
                <div className="flex items-center gap-1">
                  <span
                    className="font-sans text-gold"
                    style={{ fontSize: 9 }}
                  >
                    Listening...
                  </span>
                  <motion.span
                    className="text-gold"
                    style={{ fontSize: 9 }}
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    |
                  </motion.span>
                </div>

                {/* Waveform bars */}
                <WaveformBars />
              </div>
            </div>

            {/* Bottom nav */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-3 px-6 border-t border-blush-mid/30">
              <Home className="w-5 h-5 text-ink-soft" />
              <BookOpen className="w-5 h-5 text-gold" />
              <User className="w-5 h-5 text-ink-soft" />
            </div>
          </div>
        </div>

        {/* Floating mini-cards */}
        <FloatingCard
          delay={0.8}
          className="-top-6 -left-16"
          animDuration={3}
        >
          <img
            src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=200"
            alt=""
            className="w-10 h-8 rounded object-cover mb-1"
          />
          <div className="w-16 h-1 bg-ink/10 rounded mb-0.5" />
          <div className="w-12 h-1 bg-ink/10 rounded" />
        </FloatingCard>

        <FloatingCard
          delay={1.0}
          className="-bottom-4 -right-14"
          animDuration={4}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded bg-gold/20 flex items-center justify-center">
              <Mic className="w-2 h-2 text-gold" />
            </div>
            <div>
              <p className="font-sans text-ink" style={{ fontSize: 7 }}>
                Voice Story
              </p>
              <p className="font-sans text-ink-soft" style={{ fontSize: 6 }}>
                3 min
              </p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard
          delay={1.2}
          className="-top-2 -right-10"
          animDuration={5}
          small
        >
          <div className="flex items-center gap-1">
            <BookOpen className="w-2.5 h-2.5 text-gold" />
            <p className="font-sans text-ink" style={{ fontSize: 7 }}>
              Chapter 1 ready
            </p>
          </div>
        </FloatingCard>
      </motion.div>
    </motion.div>
  );
}

function FloatingCard({
  children,
  delay,
  className,
  animDuration,
  small,
}: {
  children: React.ReactNode;
  delay: number;
  className: string;
  animDuration: number;
  small?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: animDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="rounded-xl bg-cream border border-gold/15 px-3 py-2"
        style={{
          boxShadow: "0 8px 24px rgba(44,34,24,0.12)",
          width: small ? 100 : 120,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
