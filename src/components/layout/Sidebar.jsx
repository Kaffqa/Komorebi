import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { 
  LayoutGrid, 
  BookOpen, 
  Search, 
  MessageSquare, 
  Users, 
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "../../utils/cn";
import Logo from "../../assets/logo.svg";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { getLocalDateString } from "../../utils/date";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid, fillOnActive: true },
  { name: "Reflection", href: "/journaling", icon: BookOpen, showStreak: true, fillOnActive: false },
  { name: "Diagnose", href: "/expert", icon: Search, fillOnActive: false },
  { name: "Chat with Komi", href: "/chat", icon: MessageSquare, fillOnActive: true },
  { name: "Sharing", href: "/forum", icon: Users, fillOnActive: true },
  { name: "Help", href: "/help", icon: HelpCircle, fillOnActive: false },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [streak, setStreak] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function calculateStreak() {
      if (!user) return;

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('entry_date')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(365);

      if (!entries || entries.length === 0) {
        setStreak(1);
        return;
      }

      const entryDates = new Set(entries.map(e => e.entry_date));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = getLocalDateString(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      let checkDate;
      if (entryDates.has(todayStr)) {
        checkDate = new Date(today);
      } else if (entryDates.has(yesterdayStr)) {
        checkDate = new Date(yesterday);
      } else {
        setStreak(1);
        return;
      }

      let count = 0;
      while (entryDates.has(getLocalDateString(checkDate))) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      setStreak(Math.max(1, count));
    }

    calculateStreak();

    const handler = () => calculateStreak();
    window.addEventListener('journal-updated', handler);
    return () => window.removeEventListener('journal-updated', handler);
  }, [user]);

  return (
    <div className={cn(
      "flex h-full flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "flex h-20 shrink-0 items-center border-b border-gray-100 transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "justify-between px-6"
      )}>
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <img src={Logo} alt="Komorebi Logo" className="w-7 h-7 flex-shrink-0" />
            <span className="text-xl font-bold font-sans text-[#5D8B66] whitespace-nowrap">Komorebi</span>
          </Link>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border border-[#7DA085]/60 text-[#5D8B66] hover:bg-[#7DA085]/10 transition-colors flex-shrink-0"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 px-4">
        <nav className="flex-1 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "relative group flex items-center px-4 py-3 text-[15px] font-sans font-medium rounded-xl transition-all duration-200 overflow-hidden",
                  isActive
                    ? "text-white"
                    : "text-gray-700 hover:bg-gray-50 border border-transparent",
                  isCollapsed ? "justify-center" : "justify-between"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="flex items-center relative z-10">
                  <item.icon
                    className={cn(
                      "flex-shrink-0 h-[20px] w-[20px] transition-colors",
                      !isCollapsed && "mr-3",
                      isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive && item.fillOnActive ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </div>
                {item.showStreak && !isActive && streak > 0 && !isCollapsed && (
                  <span className="text-[13px] font-medium px-2.5 py-1 rounded-lg border bg-white text-black border-[#7DA085]/60 shadow-sm flex-shrink-0 relative z-10">
                    {streak} 🔥
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
