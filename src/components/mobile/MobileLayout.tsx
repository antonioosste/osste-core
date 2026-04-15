import { MobileBottomNav } from "./MobileBottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function MobileLayout({ children, hideNav = false }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Scrollable content area with bottom padding for nav */}
      <main className={hideNav ? "flex-1" : "flex-1 pb-20"}>
        {children}
      </main>
      {!hideNav && <MobileBottomNav />}
    </div>
  );
}
