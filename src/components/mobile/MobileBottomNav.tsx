import { Home, BookOpen, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Books", icon: BookOpen, path: "/stories" },
  { label: "Profile", icon: User, path: "/settings" },
];

export function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    if (path === "/stories") {
      return location.pathname.startsWith("/stories") || location.pathname.startsWith("/books");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-colors min-w-0",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary/70"
              )}
            >
              <tab.icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
