import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const { signIn } = useAuth();

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
    } catch {
      // Error handling is done in the signIn function
    } finally {
      setIsLoading(false);
    }
  };

  const errors = form.formState.errors;

  return (
    <div className="auth-page-wrapper">
      {/* Left brand panel */}
      <AuthBrandPanel variant="login" />

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
              Welcome Back
            </h1>
            <p className="font-sans text-sm text-muted-foreground mb-8">
              Sign in to continue capturing your stories
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div className="auth-field-group">
              <label htmlFor="login-email" className="auth-label">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
                {...form.register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="auth-error-msg">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label htmlFor="login-password" className="auth-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`auth-input pr-12 ${errors.password ? "auth-input-error" : ""}`}
                  {...form.register("password")}
                  disabled={isLoading}
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
              {errors.password && (
                <p className="auth-error-msg">{errors.password.message}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  {...form.register("remember")}
                />
                <span className="font-sans text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-sans text-[13px] text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn"
            >
              {isLoading ? (
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
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
