import { AlertTriangle, TrendingUp, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";

interface UsageBannerProps {
  onUpgrade?: () => void;
  compact?: boolean;
}

export function UsageBanner({ onUpgrade, compact = false }: UsageBannerProps) {
  const { accountUsage, loading } = useEntitlements();

  if (loading || !accountUsage) return null;

  const { minutesUsed, minutesLimit, minutesRemaining, isRecordingLimitReached, accountPlan } = accountUsage;
  const usagePercent = minutesLimit > 0 ? Math.min(100, Math.round((minutesUsed / minutesLimit) * 100)) : 0;
  const isWarning = usagePercent >= 80 && usagePercent < 100;
  const isLimitReached = isRecordingLimitReached;

  // Determine progress bar color
  const progressColor = isLimitReached
    ? "[&>div]:bg-destructive"
    : isWarning
      ? "[&>div]:bg-warning"
      : "[&>div]:bg-primary";

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Recording: {minutesUsed} / {minutesLimit} min
          </span>
          <span className={`font-medium ${isLimitReached ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"}`}>
            {usagePercent}%
          </span>
        </div>
        <Progress value={usagePercent} className={`h-2 ${progressColor}`} />
        {isWarning && !isLimitReached && (
          <p className="text-xs text-warning">
            Only {minutesRemaining} minutes remaining
          </p>
        )}
      </div>
    );
  }

  // Full banner — only show when at warning threshold or above
  if (usagePercent < 80) {
    // Below warning: show subtle usage indicator
    return (
      <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Recording Usage</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {minutesUsed} / {minutesLimit} min ({usagePercent}%)
          </span>
        </div>
        <Progress value={usagePercent} className={`h-2 ${progressColor}`} />
        {accountPlan === "free" && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {minutesRemaining} minutes remaining on Free plan
            </span>
            {onUpgrade && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onUpgrade}>
                <Crown className="h-3 w-3 mr-1" />
                Upgrade for more
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Recording Limit Reached</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            You've used all {minutesLimit} minutes on your {accountPlan} plan.
            Upgrade to continue recording.
          </p>
          <Progress value={100} className={`h-2 ${progressColor}`} />
          {onUpgrade && (
            <Button size="sm" onClick={onUpgrade} className="mt-2">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Warning state (80-99%)
  return (
    <Alert className="border-warning/50 bg-warning/5">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">Approaching Recording Limit</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">
          You've used {minutesUsed} of {minutesLimit} minutes — only{" "}
          <strong>{minutesRemaining} minutes</strong> remaining.
        </p>
        <Progress value={usagePercent} className={`h-2 ${progressColor}`} />
        {onUpgrade && (
          <Button variant="outline" size="sm" onClick={onUpgrade} className="mt-2">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade for More Time
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
