import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AdminRole = 'owner' | 'admin' | 'support' | null;

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageSessions: boolean;
  canManageStories: boolean;
  canManagePayments: boolean;
  canManageSettings: boolean;
  canViewAuditLog: boolean;
  canManageRoles: boolean;
}

function getPermissions(role: AdminRole): AdminPermissions {
  switch (role) {
    case 'owner':
      return {
        canManageUsers: true,
        canManageSessions: true,
        canManageStories: true,
        canManagePayments: true,
        canManageSettings: true,
        canManagePlans: true,
        canViewAuditLog: true,
        canManageRoles: true,
      };
    case 'admin':
      return {
        canManageUsers: true,
        canManageSessions: true,
        canManageStories: true,
        canManagePayments: true,
        canManageSettings: false,
        canViewAuditLog: true,
        canManageRoles: false,
      };
    case 'support':
      return {
        canManageUsers: false,
        canManageSessions: false,
        canManageStories: false,
        canManagePayments: false,
        canManageSettings: false,
        canViewAuditLog: false,
        canManageRoles: false,
      };
    default:
      return {
        canManageUsers: false,
        canManageSessions: false,
        canManageStories: false,
        canManagePayments: false,
        canManageSettings: false,
        canViewAuditLog: false,
        canManageRoles: false,
      };
  }
}

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return;

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error checking admin role:', error);
          setRole(null);
        } else if (data && data.length > 0) {
          // Pick highest priority role
          const roles = data.map((r: any) => r.role as string);
          if (roles.includes('owner')) setRole('owner');
          else if (roles.includes('admin')) setRole('admin');
          else if (roles.includes('support')) setRole('support');
          else setRole(null);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user, authLoading]);

  const isAdmin = role === 'admin' || role === 'owner';
  const hasAdminAccess = role !== null;
  const permissions = getPermissions(role);

  return { isAdmin, hasAdminAccess, role, permissions, loading };
}
