"use client"

import { motion } from "framer-motion"

export function LandingHeroTitle() {
  return (
    <div className="mx-auto max-w-4xl px-6 text-center">
      {/* Eyebrow */}
      <motion.span
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0 }}
        className="eyebrow text-ink-soft mb-6 block"
      >
        Your story, preserved forever
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="font-display font-light leading-[1.05] text-ink tracking-tight"
        style={{ fontSize: "clamp(52px, 7vw, 96px)" }}
      >
        Every life deserves
        <br />
        <span className="italic text-rose">to be written.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="mt-6 text-lg sm:text-xl text-ink-soft max-w-2xl mx-auto font-body font-light leading-relaxed"
      >
        An AI interviewer that turns your voice into a beautifully written book —
        preserving the stories your family never wants to lose.
      </motion.p>
    </div>
  )
}
