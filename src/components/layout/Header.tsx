import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isAuthenticated?: boolean;
}

const navigation = [
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/pricing" },
  { name: "Stories", href: "/stories" },
];

export function Header({ isAuthenticated = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isUserAuthenticated = user !== null || isAuthenticated;

  const isDashboard =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/session") ||
    location.pathname.startsWith("/stories") ||
    location.pathname.startsWith("/settings");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "w-full sticky top-0 z-50 transition-shadow duration-300",
        scrolled && "shadow-[0_4px_24px_rgba(44,34,24,0.08)]"
      )}
      style={{
        background: "rgba(251, 246, 241, 0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(168, 132, 92, 0.15)",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <img
              src="/logo-v3.png?v=5"
              alt="OSSTE"
              className="block h-[56px] md:h-[64px] w-auto shrink-0"
            />
          </Link>

          {/* Desktop Navigation */}
          {!isDashboard && (
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-[13px] font-normal uppercase tracking-[1px] text-ink-soft hover:text-gold transition-colors font-sans"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {isUserAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <User className="w-4 h-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" size="sm" asChild className="text-ink-soft font-sans uppercase tracking-[1px] text-[13px]">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="btn-sweep bg-ink text-cream hover:bg-ink rounded-[2px] font-sans uppercase tracking-[1.5px] text-[13px]"
                >
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t bg-cream",
          mobileMenuOpen ? "block" : "hidden"
        )}
        style={{ borderColor: "rgba(168, 132, 92, 0.15)" }}
      >
        <div className="container mx-auto px-6 py-4 space-y-4">
          {!isDashboard && (
            <nav className="space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block text-[13px] font-normal uppercase tracking-[1px] text-ink-soft hover:text-gold font-sans"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {!isUserAuthenticated && (
            <div className="flex flex-col space-y-2 pt-3 border-t" style={{ borderColor: "rgba(168, 132, 92, 0.15)" }}>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button size="sm" className="btn-sweep bg-ink text-cream hover:bg-ink rounded-[2px] uppercase tracking-[1.5px]" asChild>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
