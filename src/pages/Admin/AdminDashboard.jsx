import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../services/supabase";
import { format } from "date-fns";
import { 
  Users, 
  Activity, 
  MessageSquare, 
  ClipboardCheck, 
  Smile, 
  UserPlus, 
  BookOpen, 
  UserX 
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // 1. Fetch stats via RPC
        const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
        if (statsError) throw statsError;
        setStats(statsData);

        // 2. Fetch recent users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (usersError) throw usersError;
        setRecentUsers(usersData);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats?.total_users || 0, icon: Users, color: "text-gray-700", bg: "bg-gray-100" },
    { label: "Active Today", value: stats?.active_today || 0, icon: Activity, color: "text-[#5D8B66]", bg: "bg-[#5D8B66]/10" },
    { label: "Total Posts", value: stats?.total_posts || 0, icon: MessageSquare, color: "text-gray-700", bg: "bg-gray-100" },
    { label: "Total Assessments", value: stats?.total_assessments || 0, icon: ClipboardCheck, color: "text-gray-700", bg: "bg-gray-100" },
    { label: "Avg Mood (7d)", value: stats?.avg_mood || 0, icon: Smile, color: "text-[#5D8B66]", bg: "bg-[#5D8B66]/10" },
    { label: "New Users (7d)", value: stats?.new_users_week || 0, icon: UserPlus, color: "text-gray-700", bg: "bg-gray-100" },
    { label: "Journal Entries", value: stats?.total_journal_entries || 0, icon: BookOpen, color: "text-gray-700", bg: "bg-gray-100" },
    { label: "Banned Users", value: stats?.banned_users || 0, icon: UserX, color: "text-red-600", bg: "bg-red-50" },
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col space-y-8 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[140px] bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex flex-col justify-between overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
               <div className="w-12 h-12 bg-gray-100 rounded-2xl mb-4" />
               <div className="w-24 h-8 bg-gray-100 rounded-lg mb-2" />
               <div className="w-16 h-4 bg-gray-50 rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-gray-100 min-h-[400px] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="mb-8">
        <h2 className="text-[24px] font-bold text-gray-900 font-sans">Platform Overview</h2>
        <p className="text-[14px] text-gray-500 font-sans mt-1">High-level metrics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex items-center gap-5 group relative overflow-hidden cursor-default"
            >
              {/* Animated Background Bubble */}
              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${stat.bg} opacity-30 group-hover:scale-[1.8] group-hover:opacity-50 transition-all duration-700 ease-out pointer-events-none`} />
              
              {/* Left Accent Bar on Hover */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-900 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              
              {/* Icon Container */}
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0 relative z-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm border border-white/50`}>
                <Icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              
              {/* Text Container */}
              <div className="relative z-10 flex-1 min-w-0 pt-1">
                <p className="text-[11px] font-bold text-gray-500 font-sans uppercase tracking-widest mb-1 truncate">
                  {stat.label}
                </p>
                <h4 className="text-[32px] font-black text-gray-900 font-sans leading-none tracking-tight">
                  {stat.value}
                </h4>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 className="text-[20px] font-bold text-gray-900 font-sans">Recent Users</h3>
            <p className="text-[13px] text-gray-500 font-sans mt-1">Latest registered members</p>
          </div>
        </div>
        
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest font-sans border-b border-gray-100">User</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest font-sans border-b border-gray-100">Role</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest font-sans border-b border-gray-100">Status</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest font-sans border-b border-gray-100">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors rounded-2xl">
                  <td className="py-4 px-6 rounded-l-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                        <img 
                          src={user.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`} 
                          alt={user.username} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-900 font-sans">{user.display_name}</p>
                        <p className="text-[13px] text-gray-500 font-sans">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider font-sans shadow-sm ${
                      user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {user.is_banned ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider font-sans bg-red-50 text-red-700 ring-1 ring-red-200 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider font-sans bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-[14px] text-gray-600 font-medium font-sans rounded-r-2xl">
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
              
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500 font-medium">
                    No recent users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
