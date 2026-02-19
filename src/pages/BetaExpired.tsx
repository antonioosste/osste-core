import { CalendarX, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function BetaExpired() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto">
          <CalendarX className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Beta Access Expired
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your beta access period has ended. Thank you for being an early tester! 
            We'll notify you when OSSTE is publicly available.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            <strong>What now?</strong>
          </p>
          <ul className="mt-2 space-y-1 text-left list-disc list-inside">
            <li>Your stories and recordings are safely preserved</li>
            <li>Contact us if you'd like to extend your access</li>
            <li>Stay tuned for our public launch!</li>
          </ul>
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
