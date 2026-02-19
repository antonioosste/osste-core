import { Sun } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export const FullScreenSignup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setGeneralError("");
    setEmailError("");
    setPasswordError("");

    // Validate with zod
    const result = signupSchema.safeParse({ email, password });
    
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      if (errors.email?.[0]) setEmailError(errors.email[0]);
      if (errors.password?.[0]) setPasswordError(errors.password[0]);
      setSubmitted(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setGeneralError("This email is already registered. Please log in instead.");
        } else {
          setGeneralError(error.message);
        }
        setSubmitted(false);
        return;
      }

      // Success - the user will be redirected by auth state change
      // ApprovedRoute will handle sending to /dashboard or /pending-approval
      navigate("/dashboard");
    } catch (err) {
      setGeneralError("An unexpected error occurred. Please try again.");
      setSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden p-4 bg-background">
      <div className="relative w-full max-w-5xl overflow-hidden flex flex-col md:flex-row rounded-3xl shadow-2xl ring-1 ring-border">
        {/* Subtle vertical gloss strips */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex gap-2 opacity-20">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[40rem] w-16 bg-gradient-to-b from-transparent via-foreground/30 to-background/20"
              />
            ))}
          </div>
        </div>

        {/* Soft accent blobs */}
        <div className="absolute -bottom-20 -left-24 h-64 w-64 rounded-full bg-primary/50 blur-3xl opacity-30" />
        <div className="absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-card blur-2xl opacity-60" />

        {/* Left pane */}
        <div className="relative bg-foreground text-background p-8 md:p-12 md:w-1/2">
          <h1 className="text-2xl md:text-3xl font-serif font-medium leading-tight tracking-tight">
            Design and dev partner for startups and founders.
          </h1>
          <p className="mt-4 text-background/70">
            Welcome to <span className="font-semibold">OSSTE</span>. Sign up to start capturing your stories.
          </p>
        </div>

        {/* Right pane */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col bg-card">
          <div className="mb-8">
            <div className="text-primary mb-4">
              <Sun className="h-10 w-10" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-serif font-medium tracking-tight text-card-foreground">
              Get Started
            </h2>
            <p className="text-muted-foreground">
              Create your account to keep your memories flowing.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {generalError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                {generalError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-card-foreground">
                Your email
              </label>
              <input
                type="email"
                id="email"
                placeholder="you@osste.com"
                className={`text-sm w-full py-2.5 px-3 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground focus:ring-ring ${
                  emailError ? "border-destructive" : "border-input"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby="email-error"
                disabled={submitted}
              />
              {emailError && (
                <p id="email-error" className="text-destructive text-xs mt-1">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-card-foreground">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Minimum 8 characters"
                className={`text-sm w-full py-2.5 px-3 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground focus:ring-ring ${
                  passwordError ? "border-destructive" : "border-input"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
                aria-describedby="password-error"
                disabled={submitted}
              />
              {passwordError && (
                <p id="password-error" className="text-destructive text-xs mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitted}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              {submitted ? "Creating account..." : "Continue"}
            </button>

            <div className="text-center text-muted-foreground text-sm">
              Already have an account?{" "}
              <a href="/login" className="text-card-foreground font-medium underline hover:text-primary transition-colors">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
