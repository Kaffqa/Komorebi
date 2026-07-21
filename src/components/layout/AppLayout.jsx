import { Outlet, useLocation, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { Menu, Bell, Settings, Sun, CloudSun, MoonStar, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../stores/useAuthStore";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const iconClass = "p-1.5 bg-[#7DA085]/10 border border-[#7DA085]/20 rounded-xl text-[#5D8B66] shadow-sm";
    
    if (hour < 12) return { text: "Good Morning", icon: <div className={iconClass}><Sun className="w-5 h-5" /></div> };
    if (hour < 18) return { text: "Good Afternoon", icon: <div className={iconClass}><CloudSun className="w-5 h-5" /></div> };
    return { text: "Good Evening", icon: <div className={iconClass}><MoonStar className="w-5 h-5" /></div> };
  };
  const greeting = getGreeting();

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const dummyNotifications = [
    { id: 1, type: "reminder", title: "Jangan lupa isi jurnal hari ini", time: "1 jam lalu", read: false },
    { id: 2, type: "system", title: "Mind Check-In mingguan tersedia", time: "5 jam lalu", read: false },
    { id: 3, type: "ai", title: "Komi menunggu cerita terbarumu!", time: "1 hari lalu", read: true },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-komorebi-dark/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Mobile header */}
        <div className="md:hidden flex h-16 shrink-0 items-center justify-between px-4 bg-white border-b border-gray-100">
          <span className="text-xl font-heading font-bold text-[#5D8B66] uppercase tracking-widest">
            Komorebi
          </span>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 text-gray-700 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop Topbar */}
        <div className="hidden md:flex h-[80px] shrink-0 items-center justify-between px-8 bg-white border-b border-gray-100">
           <div className="text-[20px] font-sans font-medium text-black flex items-center gap-3">
             {greeting.text}, {profile?.display_name || "Guest"} {greeting.icon}
           </div>
           <div className="flex items-center space-x-3">
              {location.pathname === "/forum" && (
                <button 
                  onClick={() => navigate("/forum/new")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#7DA085] hover:bg-[#688A70] text-white rounded-[10px] text-sm font-medium transition-colors font-sans mr-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Story
                </button>
              )}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white translate-x-1/3 -translate-y-1/3"></span>
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold font-sans text-gray-900">Notifications</h3>
                        <span className="text-xs text-[#5D8B66] font-medium cursor-pointer hover:underline">Mark all as read</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {dummyNotifications.map(notif => (
                          <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-[#F7FAF8]/50' : ''}`}>
                            <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#7DA085] flex items-center justify-center text-white overflow-hidden shadow-sm border border-gray-100">
                 {profile?.avatar_url ? (
                   <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                 )}
              </div>
           </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
