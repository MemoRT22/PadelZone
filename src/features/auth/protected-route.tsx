import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { LoadingState } from "@/components/ui/states";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, membership, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Verificando sesión…" />
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (!membership) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return <>{children}</>;
}
