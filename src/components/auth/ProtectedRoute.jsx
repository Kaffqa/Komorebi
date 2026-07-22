import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";

export function ProtectedRoute() {
  const { user, profile, loading } = useAuthStore();
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

  // Block banned users
  if (profile?.is_banned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-900 p-6 text-center">
        <h1 className="text-3xl font-bold mb-4 font-sans">Access Denied</h1>
        <p className="text-lg max-w-md font-sans mb-8">
          Your account has been suspended by the administrator. If you believe this is a mistake, please contact support.
        </p>
        <button 
          onClick={() => {
            useAuthStore.getState().signOut();
            window.location.href = '/';
          }}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold font-sans hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
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
