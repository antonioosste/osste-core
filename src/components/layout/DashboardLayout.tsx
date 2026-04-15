import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "@/components/mobile/MobileLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Mobile-specific content — if provided, shown on mobile instead of children */
  mobileContent?: React.ReactNode;
}

export function DashboardLayout({ children, mobileContent }: DashboardLayoutProps) {
  const isMobile = useIsMobile();

  // On mobile, render the mobile layout with mobile-specific content (or children as fallback)
  if (isMobile) {
    return (
      <MobileLayout>
        {mobileContent || children}
      </MobileLayout>
    );
  }

  // Desktop: unchanged
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
