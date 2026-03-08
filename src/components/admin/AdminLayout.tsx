import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminRole } from "@/hooks/useAdminRole";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: ReactNode;
  requirePermission?: keyof ReturnType<typeof useAdminRole>['permissions'];
}

export function AdminLayout({ children, requirePermission }: AdminLayoutProps) {
  const { hasAdminAccess, permissions, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Access Only</h1>
          <p className="text-muted-foreground mb-6">You need administrator privileges to access this area.</p>
          <Button onClick={() => window.location.href = "/dashboard"}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (requirePermission && !permissions[requirePermission]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Insufficient Permissions</h1>
          <p className="text-muted-foreground mb-4">Your role does not have access to this section.</p>
          <Button variant="outline" onClick={() => window.location.href = "/admin"}>Back to Admin</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/40 px-4 shrink-0">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm font-medium text-muted-foreground">OSSTE Admin</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
