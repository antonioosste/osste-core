"use client"

import { Typewriter } from "@/components/ui/typewriter"

export function LandingHeroTitle() {
  return (
    <div className="mx-auto max-w-5xl px-6 text-center">
      <h1 className="text-4xl font-semibold leading-tight sm:text-6xl sm:leading-tight text-white">
        Capture the stories your family{" "}
        <span className="text-amber-400">never wants to lose</span>
      </h1>

      <p className="mt-4 text-lg text-white/90 sm:text-xl">
        Record voices, add photos, and turn memories into a polished keepsake.
      </p>

      {/* Typewriter line */}
      <div className="mt-6 text-2xl sm:text-3xl font-medium">
        <span className="text-white/80">We help you </span>
        <Typewriter
          text={[
            "record meaningful conversations",
            "preserve voices with clarity",
            "organize life into chapters",
            "weave photos into the narrative",
            "create a book they'll treasure",
          ]}
          speed={65}
          waitTime={1400}
          deleteSpeed={40}
          cursorChar="_"
          className="text-amber-400"
        />
      </div>
    </div>
  )
}
