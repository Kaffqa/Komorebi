import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { Menu, Bell, Settings, Sun, CloudSun, MoonStar } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../stores/useAuthStore";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const iconClass = "p-1.5 bg-[#7DA085]/10 border border-[#7DA085]/20 rounded-xl text-[#5D8B66] shadow-sm";
    
    if (hour < 12) return { text: "Good Morning", icon: <div className={iconClass}><Sun className="w-5 h-5" /></div> };
    if (hour < 18) return { text: "Good Afternoon", icon: <div className={iconClass}><CloudSun className="w-5 h-5" /></div> };
    return { text: "Good Evening", icon: <div className={iconClass}><MoonStar className="w-5 h-5" /></div> };
  };
  const greeting = getGreeting();

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
              <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
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
