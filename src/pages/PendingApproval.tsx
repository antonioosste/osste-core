import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Clock className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Approval Pending
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your account has been created successfully! We're reviewing your access request and you'll receive an email once you're approved.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            <strong>What happens next?</strong>
          </p>
          <ul className="mt-2 space-y-1 text-left list-disc list-inside">
            <li>Our team reviews your request</li>
            <li>You'll get an email with a login link</li>
            <li>Start capturing your stories!</li>
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
