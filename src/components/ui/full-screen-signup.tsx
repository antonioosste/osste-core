import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendAccountCreationEmail } from "@/lib/emails";
import { z } from "zod";
import { PasswordStrength, isPasswordStrong } from "@/components/ui/password-strength";
import { motion } from "framer-motion";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters.").refine(isPasswordStrong, "Password does not meet all requirements."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    phone: z.string().optional(),
    referralSource: z.string().optional(),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms." }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

const referralOptions = [
  "Friend or Family",
  "Social Media",
  "Search Engine",
  "Podcast / Blog",
  "Gift",
  "Other",
];

export const FullScreenSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<SignupForm>>({
    agreeTerms: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const set = useCallback(
    (field: keyof SignupForm, value: unknown) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    },
    []
  );

  const passwordsMatch =
    form.password && form.confirmPassword && form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setGeneralError("");
    setErrors({});

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) {
        if (v?.[0]) mapped[k] = v[0];
      }
      setErrors(mapped);
      setSubmitted(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      const fullName = `${result.data.firstName} ${result.data.lastName}`.trim();

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: fullName,
            full_name: fullName,
            phone: result.data.phone || undefined,
            referral_source: result.data.referralSource || undefined,
          },
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

      // Supabase returns a fake success with empty identities when email already exists
      if (signUpData?.user && signUpData.user.identities?.length === 0) {
        setGeneralError("An account with this email already exists. Please log in instead.");
        setSubmitted(false);
        return;
      }

      // Send account creation email with idempotency key to prevent duplicates
      sendAccountCreationEmail({
        email: result.data.email,
        firstName: result.data.firstName,
      });

      navigate("/dashboard");
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
      setSubmitted(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Left brand panel */}
      <AuthBrandPanel variant="signup" />

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <img src="/brand/osste-logo-transparent.png" alt="OSSTE" className="h-8" />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground mb-1">
              Get Started
            </h1>
            <p className="font-sans text-sm text-muted-foreground mb-8">
              Create your account to keep your memories flowing.
            </p>
          </motion.div>

          {generalError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-5 border border-destructive/20">
              {generalError}
            </div>
          )}

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
          >
            {/* First + Last name */}
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
              <div className="auth-field-group">
                <label htmlFor="su-first" className="auth-label">First name</label>
                <input
                  id="su-first"
                  type="text"
                  placeholder="Jane"
                  className={`auth-input ${errors.firstName ? "auth-input-error" : ""}`}
                  value={form.firstName || ""}
                  onChange={(e) => set("firstName", e.target.value)}
                  disabled={submitted}
                />
                {errors.firstName && <p className="auth-error-msg">{errors.firstName}</p>}
              </div>
              <div className="auth-field-group">
                <label htmlFor="su-last" className="auth-label">Last name</label>
                <input
                  id="su-last"
                  type="text"
                  placeholder="Doe"
                  className={`auth-input ${errors.lastName ? "auth-input-error" : ""}`}
                  value={form.lastName || ""}
                  onChange={(e) => set("lastName", e.target.value)}
                  disabled={submitted}
                />
                {errors.lastName && <p className="auth-error-msg">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="auth-field-group">
              <label htmlFor="su-email" className="auth-label">Email</label>
              <input
                id="su-email"
                type="email"
                placeholder="you@example.com"
                className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
                value={form.email || ""}
                onChange={(e) => set("email", e.target.value)}
                disabled={submitted}
              />
              {errors.email && <p className="auth-error-msg">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label htmlFor="su-password" className="auth-label">Password</label>
              <div className="relative">
                <input
                  id="su-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  className={`auth-input pr-12 ${errors.password ? "auth-input-error" : ""}`}
                  value={form.password || ""}
                  onChange={(e) => set("password", e.target.value)}
                  disabled={submitted}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="auth-error-msg">{errors.password}</p>}
              <PasswordStrength password={form.password || ""} />
            </div>

            {/* Confirm Password */}
            <div className="auth-field-group">
              <label htmlFor="su-confirm" className="auth-label">Confirm Password</label>
              <div className="relative">
                <input
                  id="su-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className={`auth-input pr-12 ${errors.confirmPassword ? "auth-input-error" : ""}`}
                  value={form.confirmPassword || ""}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  disabled={submitted}
                />
                {confirmTouched && passwordsMatch && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
                )}
                {!passwordsMatch && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {errors.confirmPassword && <p className="auth-error-msg">{errors.confirmPassword}</p>}
              {confirmTouched && form.confirmPassword && !passwordsMatch && !errors.confirmPassword && (
                <p className="auth-error-msg">Passwords do not match</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="auth-field-group">
              <label htmlFor="su-phone" className="auth-label">
                Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="su-phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="auth-input"
                value={form.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                disabled={submitted}
              />
            </div>

            {/* Referral (optional) */}
            <div className="auth-field-group">
              <label htmlFor="su-referral" className="auth-label">
                How did you hear about us?{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <select
                id="su-referral"
                className="auth-input appearance-none"
                value={form.referralSource || ""}
                onChange={(e) => set("referralSource", e.target.value)}
                disabled={submitted}
              >
                <option value="">Select an option</option>
                {referralOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Terms checkbox */}
            <div className="auth-field-group">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                  checked={!!form.agreeTerms}
                  onChange={(e) => set("agreeTerms", e.target.checked || undefined)}
                  disabled={submitted}
                />
                <span className="font-sans text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeTerms && <p className="auth-error-msg">{errors.agreeTerms}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitted} className="auth-submit-btn">
              {submitted ? (
                <span className="auth-dots">
                  <span /><span /><span />
                </span>
              ) : (
                "CONTINUE"
              )}
            </button>
          </motion.form>

          {/* Switch link */}
          <p className="mt-8 text-center font-sans text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
