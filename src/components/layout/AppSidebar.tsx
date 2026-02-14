import { Library, BookOpen, Settings, HelpCircle, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  
  const collapsed = state === "collapsed";
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border/40 p-4">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center">
            <img 
              src="/logo-v3.png?v=5" 
              alt="OSSTE" 
              className="h-12 w-auto"
            />
          </Link>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        {/* Primary navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-md ${isActive('/dashboard') ? 'bg-accent' : ''}`}>
                    <Library className={`h-5 w-5 ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`} />
                    {!collapsed && <span className={isActive('/dashboard') ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Library</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/books" className={`flex items-center gap-3 px-3 py-2.5 rounded-md ${isActive('/books') ? 'bg-accent' : ''}`}>
                    <BookOpen className={`h-5 w-5 ${isActive('/books') ? 'text-primary' : 'text-muted-foreground'}`} />
                    {!collapsed && <span className={isActive('/books') ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Books</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2 opacity-40" />

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/settings') ? 'bg-accent' : ''}`}>
                    <Settings className={`h-5 w-5 ${isActive('/settings') ? 'text-primary' : 'text-muted-foreground'}`} />
                    {!collapsed && <span className={isActive('/settings') ? 'font-medium text-foreground' : 'text-muted-foreground'}>Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/help" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/help') ? 'bg-accent' : ''}`}>
                    <HelpCircle className={`h-5 w-5 ${isActive('/help') ? 'text-primary' : 'text-muted-foreground'}`} />
                    {!collapsed && <span className={isActive('/help') ? 'font-medium text-foreground' : 'text-muted-foreground'}>Help</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSignOut}
            className="w-full p-2"
          >
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
