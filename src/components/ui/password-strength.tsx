import { Check, X } from "lucide-react";
import { useMemo } from "react";

export interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
  { label: "One special character (!@#$%...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function isPasswordStrong(pw: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(pw));
}

export function PasswordStrength({ password }: { password: string }) {
  const results = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );

  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {results.map((r) => (
        <li key={r.label} className="flex items-center gap-1.5 text-xs">
          {r.passed ? (
            <Check className="h-3 w-3 text-green-600 shrink-0" />
          ) : (
            <X className="h-3 w-3 text-destructive shrink-0" />
          )}
          <span className={r.passed ? "text-muted-foreground" : "text-destructive"}>
            {r.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
