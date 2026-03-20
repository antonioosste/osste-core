import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureLockedProps {
  featureName: string;
  requiredPlan?: string;
  onUpgrade?: () => void;
  className?: string;
  inline?: boolean;
}

export function FeatureLocked({
  featureName,
  requiredPlan = "Digital or Legacy",
  onUpgrade,
  className = "",
  inline = false,
}: FeatureLockedProps) {
  if (inline) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Lock className="h-4 w-4" />
        <span>{featureName} — available on {requiredPlan} plans</span>
        {onUpgrade && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onUpgrade}>
            <Crown className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-border/60 bg-muted/30 p-6 text-center space-y-3 ${className}`}>
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{featureName}</p>
        <p className="text-sm text-muted-foreground mt-1">
          This feature is available on {requiredPlan} plans
        </p>
      </div>
      {onUpgrade && (
        <Button size="sm" onClick={onUpgrade}>
          <Crown className="h-4 w-4 mr-2" />
          Upgrade Plan
        </Button>
      )}
    </div>
  );
}
