import { Home, BookOpen, FileText, Settings, HelpCircle, LogOut } from "lucide-react";
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

const mainNavItems = [
  { title: "Library", url: "/dashboard", icon: Home },
  { title: "My Books", url: "/books", icon: BookOpen },
  { title: "My Stories", url: "/stories", icon: FileText },
];

const secondaryNavItems = [
  { title: "Account Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

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
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img 
              src="/brand/osste-logo-transparent.png" 
              alt="OSSTE" 
              className="h-8 w-auto"
            />
          </Link>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 ${isActive(item.url) ? 'bg-accent' : ''}`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                      {!collapsed && (
                        <span className={isActive(item.url) ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 ${isActive(item.url) ? 'bg-accent' : ''}`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                      {!collapsed && (
                        <span className={isActive(item.url) ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
