import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";

export function ProtectedRoute() {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-komorebi-cream text-komorebi-green">
        <p className="animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/?login=true" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, profile, loading } = useAuthStore();
  
  if (loading) {
    return <div className="min-h-screen bg-komorebi-cream"></div>;
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
