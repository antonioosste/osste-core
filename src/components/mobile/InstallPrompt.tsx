import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const DISMISS_KEY = "osste_install_dismissed_at";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Detect standalone (already installed)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore - iOS Safari
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    setIsIos(ios);

    // Respect dismissal cooldown
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const days = (Date.now() - Number(dismissed)) / 86400000;
      if (days < DISMISS_DAYS) return;
    }

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after a brief delay
    if (ios) {
      setTimeout(() => setVisible(true), 2500);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isMobile || isStandalone || !visible) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in pointer-events-none">
      <div className="pointer-events-auto rounded-2xl bg-card border border-border shadow-xl p-4">
        <div className="flex items-start gap-3">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="h-12 w-12 rounded-xl shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">
              Install OSSTE
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isIos ? (
                <>
                  Tap <Share className="inline h-3 w-3 mx-0.5" /> then{" "}
                  <span className="font-medium">Add to Home Screen</span>
                </>
              ) : (
                "Add to your home screen for the full experience"
              )}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground -mt-1 -mr-1 p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIos && deferredPrompt && (
          <Button
            size="sm"
            className="w-full mt-3 rounded-xl gap-2"
            onClick={handleInstall}
          >
            <Download className="h-4 w-4" />
            Install
          </Button>
        )}
      </div>
    </div>
  );
}
