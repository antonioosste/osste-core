"use client"

import * as React from "react"
import { GridBackground } from "@/components/ui/grid-background"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"

export function OssteWaitlist() {
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: string; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setMessage(null)

    const { error } = await supabase.from("waitlist_signups").insert({ email })

    if (error) {
      if (error.code === "23505") {
        setMessage({ type: "error", text: "This email is already on our waitlist!" })
      } else {
        setMessage({ type: "error", text: "Something went wrong. Try again." })
      }
    } else {
      setMessage({
        type: "success",
        text: "You're on the list! We'll email you when OSSTE opens early access.",
      })
      setEmail("")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center bg-[#fdf4e3]">
      <GridBackground />

      <div className="relative z-10 w-full max-w-3xl px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-4xl font-semibold tracking-[0.35em] text-orange-500">
            OSSTE
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg border border-orange-100 px-10 py-12 space-y-10">
          <h1 className="text-4xl font-semibold text-center">
            Join the{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-600 text-transparent bg-clip-text">
              OSSTE Early Access Waitlist
            </span>
          </h1>

          <p className="text-lg text-slate-600 text-center">
            AI-guided voice interviews that turn real conversations into
            beautifully written family chapters and keepsake books.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-12 bg-[#fff7ea] border-orange-200"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? "Adding..." : "Join waitlist"}
            </Button>
          </form>

          {message && (
            <p
              className={cn(
                "text-center text-sm",
                message.type === "success" ? "text-green-700" : "text-red-600"
              )}
            >
              {message.text}
            </p>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="flex -space-x-3">
              <Avatar className="border w-12 h-12 bg-orange-400/80">
                <AvatarFallback className="text-white">SC</AvatarFallback>
              </Avatar>
              <Avatar className="border w-12 h-12 bg-amber-500/80">
                <AvatarFallback className="text-white">LM</AvatarFallback>
              </Avatar>
              <Avatar className="border w-12 h-12 bg-rose-500/80">
                <AvatarFallback className="text-white">JP</AvatarFallback>
              </Avatar>
            </div>

            <span className="text-slate-700">
              Join the first <strong className="text-orange-600">100 families</strong> using OSSTE.
            </span>

            <div className="flex gap-5 text-slate-500">
              <button
                type="button"
                onClick={() => window.open("https://x.com/osste", "_blank")}
                className="hover:text-orange-600 transition-colors"
              >
                <Icons.twitter className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => window.open("https://instagram.com/osste", "_blank")}
                className="hover:text-orange-600 transition-colors"
              >
                <Icons.instagram className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <a href="#full-site" className="underline text-sm text-slate-600 hover:text-orange-600">
              Skip to the full site
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
