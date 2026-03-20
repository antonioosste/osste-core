import {
  LayoutDashboard, Users, Mic, BookOpen, CreditCard,
  BarChart3, Settings, ScrollText, ArrowLeft, Printer, HelpCircle, Package,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAdminRole } from "@/hooks/useAdminRole";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Sessions", url: "/admin/sessions", icon: Mic },
  { title: "Stories & Books", url: "/admin/stories", icon: BookOpen },
  { title: "Print Orders", url: "/admin/print-orders", icon: Printer },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

const systemItems = [
  { title: "Settings", url: "/admin/settings", icon: Settings, permission: "canManageSettings" as const },
  { title: "Audit Log", url: "/admin/audit", icon: ScrollText, permission: "canViewAuditLog" as const },
  { title: "Questions", url: "/admin/questions", icon: HelpCircle },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { role, permissions } = useAdminRole();
  const collapsed = state === "collapsed";

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-60"} collapsible="icon">
      <SidebarHeader className="border-b border-border/40 p-4">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-v3.png?v=5" alt="OSSTE" className="h-8 w-auto" />
              <Badge variant="outline" className="text-xs capitalize">{role}</Badge>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive(item.url, item.end) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems
                .filter((item) => !item.permission || permissions[item.permission])
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive(item.url) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">Back to App</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
