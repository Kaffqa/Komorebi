import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { 
  LayoutGrid, 
  BookOpenText, 
  Search, 
  MessageCircleMore, 
  UsersRound, 
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "../../utils/cn";
import Logo from "../../assets/logo.svg";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { getLocalDateString } from "../../utils/date";
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [streak, setStreak] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { name: t("sidebar.dashboard"), href: "/dashboard", icon: LayoutGrid, fillOnActive: true, tourId: "nav-dashboard" },
    { name: t("sidebar.reflection"), href: "/journaling", icon: BookOpenText, showStreak: true, fillOnActive: false, tourId: "nav-reflection" },
    { name: t("sidebar.diagnose"), href: "/expert", icon: Search, fillOnActive: false, tourId: "nav-diagnose" },
    { name: t("sidebar.chat"), href: "/chat", icon: MessageCircleMore, fillOnActive: false, tourId: "nav-chat" },
    { name: t("sidebar.sharing"), href: "/forum", icon: UsersRound, fillOnActive: true, tourId: "nav-sharing" },
    { name: t("sidebar.help"), href: "/help", icon: HelpCircle, fillOnActive: false, tourId: "nav-help" },
  ];

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
      "flex h-full flex-col bg-white dark:bg-komorebi-dark-card border-r border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300 ease-in-out",
      isCollapsed ? "w-64 md:w-20" : "w-64"
    )}>
      <div className={cn(
        "flex h-20 shrink-0 items-center border-b border-gray-100 dark:border-komorebi-dark-border transition-all duration-300 px-6",
        isCollapsed ? "md:justify-center md:px-0" : "justify-between"
      )}>
        <Link to="/dashboard" className={cn(
          "flex items-center gap-3 overflow-hidden transition-all duration-300",
          isCollapsed ? "md:w-0 md:opacity-0 md:pointer-events-none" : "w-auto opacity-100"
        )}>
          <img src={Logo} alt="Komorebi Logo" className="w-7 h-7 flex-shrink-0" />
          <span className="text-xl font-bold font-sans text-[#5D8B66] dark:text-[#7DA085] whitespace-nowrap">Komorebi</span>
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg border border-[#7DA085]/60 text-[#5D8B66] dark:text-[#7DA085] hover:bg-[#7DA085]/10 transition-colors flex-shrink-0"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hide pt-6 px-4">
        <nav className="flex-1 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                data-tour-id={item.tourId}
                data-tour-padding="0"
                className={cn(
                  "relative group flex items-center px-4 py-3 text-[15px] font-sans font-medium rounded-xl transition-all duration-200 overflow-hidden",
                  isActive
                    ? "text-[#5D8B66] dark:text-[#7DA085]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent",
                  isCollapsed ? "md:justify-center justify-between" : "justify-between"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 bg-[#5D8B66]/10 dark:bg-[#7DA085]/10 border border-[#5D8B66]/20 dark:border-[#7DA085]/20 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="flex items-center relative z-10">
                  <item.icon
                    className={cn(
                      "flex-shrink-0 h-[20px] w-[20px] transition-colors",
                      isCollapsed ? "md:mr-0 mr-3" : "mr-3",
                      isActive ? "text-[#5D8B66] dark:text-[#7DA085]" : "text-gray-500 dark:text-komorebi-dark-muted group-hover:text-gray-700 dark:group-hover:text-gray-200"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive && item.fillOnActive ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "md:hidden block" : "block"
                  )}>{item.name}</span>
                </div>
                {item.showStreak && !isActive && streak > 0 && (
                  <span className={cn(
                    "text-[13px] font-medium px-2.5 py-1 rounded-lg border bg-white dark:bg-komorebi-dark-bg text-black dark:text-white border-[#7DA085]/60 dark:border-[#7DA085]/30 shadow-sm flex-shrink-0 relative z-10 transition-colors duration-300",
                    isCollapsed ? "md:hidden block" : "block"
                  )}>
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
