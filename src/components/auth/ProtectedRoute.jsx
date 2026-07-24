import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { Skeleton } from "../ui/Skeleton";

export function ProtectedRoute() {
  const { user, profile, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F5F7F5] dark:bg-[#0A0D14] overflow-hidden">
        <div className="hidden lg:flex w-[280px] bg-white dark:bg-komorebi-dark-card border-r border-gray-100 dark:border-komorebi-dark-border p-6 flex-col">
          <Skeleton className="h-10 w-32 mb-10" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4" >
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <header className="h-20 bg-white/80 dark:bg-komorebi-dark-card/80 border-b border-gray-100 dark:border-komorebi-dark-border px-8 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </header>
          <div className="flex-1 p-8">
            <Skeleton className="w-full h-full rounded-[24px]" />
          </div>
        </div>
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
    return (
      <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
        <div className="w-[260px] bg-[#0A0D14] flex flex-col shrink-0">
          <div className="h-[72px] px-6 flex items-center gap-3 border-b border-white/10 shrink-0">
            <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
            <Skeleton className="h-5 w-32 bg-white/10" />
          </div>
          <div className="flex-1 py-8 px-4 space-y-4">
            <Skeleton className="h-3 w-12 bg-white/10 mb-6" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-5 h-5 rounded bg-white/10" />
                <Skeleton className="h-4 w-28 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[80px] px-6 sm:px-10 bg-white/70 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="w-12 h-12 rounded-full" />
          </header>
          <main className="flex-1 p-6 sm:p-10">
            <Skeleton className="w-full h-full rounded-2xl" />
          </main>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
