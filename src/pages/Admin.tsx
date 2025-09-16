import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Access Denied Message */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Admin Access Required
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            You need administrator privileges to access this area.
          </p>

          {/* Information Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Restricted Area</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The admin panel is only accessible to authorized personnel. If you believe 
                you should have access to this area, please contact your system administrator.
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Security Note:</strong> This access attempt has been logged for security purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </Button>
            <Button variant="outline" className="w-full">
              Contact Administrator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}