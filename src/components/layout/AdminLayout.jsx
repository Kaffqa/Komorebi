import { useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Stethoscope, 
  ArrowLeft,
  LogOut,
  Flower2
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "User Management", path: "/admin/users", icon: Users },
  { name: "Assessments", path: "/admin/assessments", icon: ClipboardList },
  { name: "Specialists", path: "/admin/specialists", icon: Stethoscope },
];

export function AdminLayout() {
  const { user, profile, loading, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Guard against non-admin access (handled by AdminRoute, but good for UI sanity check)
  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading admin...</div>;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans">
      
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-[260px] bg-[#0A0D14] text-white flex flex-col shadow-2xl shadow-black/20 z-20 shrink-0 border-r border-white/5"
      >
        {/* Header */}
        <div className="h-[72px] px-6 flex items-center gap-3 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#5D8B66] flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[18px] font-bold tracking-wide">Admin Panel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
            Menu
          </p>
          
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-300 group ${
                  isActive 
                    ? "text-white bg-gradient-to-r from-[#5D8B66]/20 to-transparent shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#5D8B66] rounded-r-full shadow-[0_0_10px_rgba(93,139,102,0.6)]"
                  />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "text-[#5D8B66]" : "text-gray-500 group-hover:scale-110"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-[80px] px-6 sm:px-10 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 font-sans tracking-tight">
              {NAV_ITEMS.find(i => i.path === location.pathname)?.name || "Admin"}
            </h1>
            <p className="text-[13px] text-gray-500 font-medium">Welcome back, {profile?.display_name?.split(' ')[0] || 'Admin'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[14px] font-bold text-gray-900 leading-none">{profile?.display_name}</p>
              <p className="text-[12px] text-[#5D8B66] font-semibold mt-1.5 uppercase tracking-wider">Super {profile?.role}</p>
            </div>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 border-2 border-white shadow-sm ring-2 ring-gray-100">
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${profile?.username}`} 
                alt="Admin" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
