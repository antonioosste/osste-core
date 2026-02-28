"use client"

import { motion } from "framer-motion"

export function LandingHeroTitle() {
  return (
    <div className="mx-auto max-w-4xl px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="font-display text-5xl sm:text-7xl md:text-8xl font-semibold leading-[1.1] text-white tracking-tight"
      >
        Every life deserves
        <br />
        <span className="italic text-primary-soft">to be written.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed"
      >
        An AI interviewer that turns your voice into a beautifully written book —
        preserving the stories your family never wants to lose.
      </motion.p>
    </div>
  )
}
