import { useOutlet, useLocation, useNavigate, Link } from "react-router";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { Menu, Bell, Settings, Sun, CloudSun, MoonStar, Plus, Heart, MessageCircle, Info, Calendar, Check, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const currentOutlet = useOutlet();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const iconClass = "p-1.5 bg-[#7DA085]/10 border border-[#7DA085]/20 rounded-xl text-[#5D8B66] shadow-sm";
    
    if (hour < 12) return { text: "Good Morning", icon: <div className={iconClass}><Sun className="w-5 h-5" /></div> };
    if (hour < 18) return { text: "Good Afternoon", icon: <div className={iconClass}><CloudSun className="w-5 h-5" /></div> };
    return { text: "Good Evening", icon: <div className={iconClass}><MoonStar className="w-5 h-5" /></div> };
  };
  const greeting = getGreeting();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setNotifications(data || []);

      // Check for daily reminder
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hasReminderToday = data?.some(n => n.type === 'reminder' && new Date(n.created_at) >= today);
      
      if (!hasReminderToday && data) {
        const { error: insertError } = await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'reminder',
          title: 'Waktunya Jurnal Harian! 📖',
          content: 'Luangkan waktu 5 menit untuk mencatat perasaan dan pengalamanmu hari ini.',
        });
        if (insertError) console.error("Error creating daily reminder:", insertError);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (profile?.id) {
      // Subscribe to real-time notifications
      const subscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`
          }, 
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
          }
        )
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`
          }, 
          (payload) => {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [profile?.id]);

  useEffect(() => {
    function handleClick(e) {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const markAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const formatNotifTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return '1d ago';
  };

  const getNotifIcon = (type) => {
    switch(type) {
      case 'like': return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'reply': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'reminder': return <Calendar className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-[#5D8B66]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white rounded-[10px] text-sm font-medium transition-all duration-300 font-sans mr-2"
                >
                  <Plus className="w-4 h-4" />
                  New Story
                </button>
              )}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg border border-[#7DA085]/60 text-[#5D8B66] hover:bg-[#7DA085]/10 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white translate-x-1/3 -translate-y-1/3 flex items-center justify-center"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col max-h-[85vh]"
                    >
                      <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold font-sans text-gray-900 text-lg flex items-center gap-2">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="bg-[#5D8B66] text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>
                          )}
                        </h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-[#5D8B66] font-bold cursor-pointer hover:bg-[#5D8B66]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                              <Bell className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-sans text-sm font-medium">You're all caught up!</p>
                            <p className="text-gray-400 font-sans text-xs mt-1">No new notifications</p>
                          </div>
                        ) : (
                          notifications.map((notif, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              key={notif.id} 
                              onClick={() => markAsRead(notif.id, notif.is_read)}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer flex gap-4 ${!notif.is_read ? 'bg-[#5D8B66]/5' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${!notif.is_read ? 'bg-white border-[#5D8B66]/20' : 'bg-gray-50 border-gray-100'}`}>
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className={`text-[14px] leading-snug font-sans ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{notif.title}</p>
                                <p className="text-[13px] text-gray-500 font-sans mt-1 line-clamp-2">{notif.content}</p>
                                <p className="text-[11px] font-bold text-gray-400 mt-2 tracking-wide uppercase">{formatNotifTime(notif.created_at)}</p>
                              </div>
                              {!notif.is_read && (
                                <div className="w-2 h-2 rounded-full bg-[#5D8B66] shrink-0 mt-2"></div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#5D8B66] text-white rounded-lg hover:bg-[#43674F] transition-colors shadow-sm border border-[#43674F]/20 text-[13px] font-bold"
                >
                  Admin Panel
                </Link>
              )}

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg border border-[#7DA085]/60 text-[#5D8B66] hover:bg-[#7DA085]/10 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-lg bg-[#7DA085] flex items-center justify-center text-white overflow-hidden shadow-sm border border-[#7DA085]/60">
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
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="min-h-full"
            >
              {currentOutlet}
            </motion.div>
          </AnimatePresence>
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
