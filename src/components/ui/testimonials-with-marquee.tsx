import { cn } from "@/lib/utils"
import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card"
import { motion } from "framer-motion"

interface TestimonialsSectionProps {
  title: string
  description: string
  testimonials: Array<{
    author: TestimonialAuthor
    text: string
    href?: string
  }>
  className?: string
}

export function TestimonialsSection({
  title,
  description,
  testimonials,
  className
}: TestimonialsSectionProps) {
  return (
    <section
      className={cn(
        "text-foreground relative overflow-hidden",
        "py-12 sm:py-24 md:py-32 px-0",
        className
      )}
    >
      {/* Ambient floating quotation marks */}
      {[
        { top: "5%", left: "5%", delay: 0 },
        { top: "40%", right: "8%", delay: 2 },
        { bottom: "10%", left: "15%", delay: 4 },
      ].map((pos, i) => (
        <motion.span
          key={i}
          className="absolute font-display pointer-events-none z-0 select-none"
          style={{
            ...pos,
            fontSize: 200,
            color: "rgba(168,132,92,0.05)",
            lineHeight: 1,
          }}
          animate={{ y: [0, -20, 0] }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: pos.delay,
          }}
        >
          "
        </motion.span>
      ))}

      <div className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16 relative z-[1]">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8 reveal">
          <span className="eyebrow text-gold">Testimonials</span>
          <h2 className="max-w-[720px] text-3xl font-display leading-tight sm:text-5xl sm:leading-tight text-ink">
            {title}
          </h2>
          <p className="text-md max-w-[700px] font-body text-ink-soft sm:text-xl">
            {description}
          </p>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden reveal reveal-delay-1">
          <div className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row [--duration:40s]">
            <div className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
              {[...Array(4)].map((_, setIndex) =>
                testimonials.map((t, i) => <TestimonialCard key={`${setIndex}-${i}`} {...t} />)
              )}
            </div>
          </div>

          {/* soft edge masks - use cream color */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-cream sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-cream sm:block" />
        </div>
      </div>
    </section>
  )
}
