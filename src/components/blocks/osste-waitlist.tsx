"use client"

import * as React from "react"
import { Link } from "react-router-dom"
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
    <div className="relative min-h-[85vh] flex items-center justify-center bg-background">
      <GridBackground />

      <div className="relative z-10 w-full max-w-3xl px-6 py-16">
        <div className="text-center mb-10">
          <img
            src="/logo-v3.png"
            alt="OSSTE"
            className="h-16 mx-auto mb-4"
          />
        </div>

        <div className="bg-card/80 backdrop-blur-lg rounded-3xl shadow-lg border border-border px-10 py-12 space-y-10">
          <h1 className="text-4xl font-semibold text-center">
            Join the{" "}
            <span className="bg-gradient-to-r from-primary to-warning text-transparent bg-clip-text">
              OSSTE Early Access Waitlist
            </span>
          </h1>

          <p className="text-lg text-muted-foreground text-center">
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
              className="h-12 bg-secondary/50 border-border"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isSubmitting ? "Adding..." : "Join waitlist"}
            </Button>
          </form>

          {message && (
            <p
              className={cn(
                "text-center text-sm font-medium",
                message.type === "success" ? "text-success" : "text-destructive"
              )}
            >
              {message.text}
            </p>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="flex -space-x-3">
              <Avatar className="border-2 border-background w-12 h-12 bg-primary/80">
                <AvatarFallback className="text-primary-foreground font-semibold">SC</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-background w-12 h-12 bg-warning/80">
                <AvatarFallback className="text-primary-foreground font-semibold">LM</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-background w-12 h-12 bg-destructive/80">
                <AvatarFallback className="text-destructive-foreground font-semibold">JP</AvatarFallback>
              </Avatar>
            </div>

            <span className="text-foreground">
              Join the first <strong className="text-primary">100 families</strong> using OSSTE.
            </span>

            <div className="flex gap-5 text-muted-foreground">
              <button
                type="button"
                onClick={() => window.open("https://x.com/osste", "_blank")}
                className="hover:text-primary transition-colors"
              >
                <Icons.twitter className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => window.open("https://instagram.com/osste", "_blank")}
                className="hover:text-primary transition-colors"
              >
                <Icons.instagram className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
