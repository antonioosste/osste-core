import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApproval } from '@/hooks/useApproval';

interface ApprovedRouteProps {
  children: ReactNode;
}

export function ApprovedRoute({ children }: ApprovedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { approved, status, loading: approvalLoading } = useApproval();

  if (authLoading || approvalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!approved) {
    if (status === 'beta_expired') {
      return <Navigate to="/beta-expired" replace />;
    }
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
