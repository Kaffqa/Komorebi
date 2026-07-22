import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";
import { format } from "date-fns";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  MoreVertical, 
  Ban,
  X
} from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    actionType: null, // 'ban', 'unban', 'promote'
    user: null, 
    title: '',
    message: '' 
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserStats(userId) {
    try {
      setStatsLoading(true);
      
      const [moodRes, journalRes, assessmentRes, postRes] = await Promise.all([
        supabase.from('mood_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('assessment_results').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setUserStats({
        moods: moodRes.count || 0,
        journals: journalRes.count || 0,
        assessments: assessmentRes.count || 0,
        posts: postRes.count || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserStats(user.id);
  };

  const handleToggleBanClick = (user) => {
    const isBanning = !user.is_banned;
    setConfirmModal({
      isOpen: true,
      actionType: isBanning ? 'ban' : 'unban',
      user: user,
      title: isBanning ? 'Ban User' : 'Unban User',
      message: isBanning 
        ? `Are you sure you want to ban ${user.username || user.display_name}? They will lose all access to the platform.`
        : `Are you sure you want to unban ${user.username || user.display_name}? They will regain access to the platform.`
    });
  };

  const handlePromoteClick = (user) => {
    if (user.role === 'admin') return;
    setConfirmModal({
      isOpen: true,
      actionType: 'promote',
      user: user,
      title: 'Promote to Admin',
      message: `Are you sure you want to promote ${user.username || user.display_name} to Admin? This gives them full access to the admin panel.`
    });
  };

  const executeConfirmAction = async () => {
    const { actionType, user } = confirmModal;
    if (!user) return;

    try {
      if (actionType === 'ban' || actionType === 'unban') {
        const isBanning = actionType === 'ban';
        const { error } = await supabase
          .from('profiles')
          .update({ is_banned: isBanning })
          .eq('id', user.id);
          
        if (error) throw error;
        
        setUsers(users.map(u => u.id === user.id ? { ...u, is_banned: isBanning } : u));
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...selectedUser, is_banned: isBanning });
        }
      } else if (actionType === 'promote') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);
          
        if (error) throw error;
        
        setUsers(users.map(u => u.id === user.id ? { ...u, role: 'admin' } : u));
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...selectedUser, role: 'admin' });
        }
      }
    } catch (error) {
      console.error(`Error executing ${actionType}:`, error);
      alert(`Failed to ${actionType} user`);
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (activeFilter === "Active") return !user.is_banned;
    if (activeFilter === "Banned") return user.is_banned;
    if (activeFilter === "Admin") return user.role === 'admin';
    return true; // "All"
  });

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 font-sans flex items-center gap-3">
            User Management
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[13px] font-bold">
              {users.length} Total
            </span>
          </h2>
          <p className="text-[14px] text-gray-500 font-sans mt-1">Manage platform members and their access</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {["All", "Active", "Banned", "Admin"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-[13px] font-bold transition-colors font-sans ${
                activeFilter === filter
                  ? "bg-[#1a1f2e] text-white shadow-sm"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#7DA085]/20 transition-all font-sans text-[14px]"
          />
        </div>
      </div>

      {/* Users Table */}
    <div className="w-full h-full flex flex-col md:flex-row gap-8 pb-10">
      
      {/* Main List Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedUser ? 'md:w-2/3' : 'w-full'}`}>
        
        {/* User List */}
        <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100 bg-gray-50/30">
            <h3 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Directory ({filteredUsers.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5D8B66]"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <Search className="w-10 h-10 mb-4 text-gray-300" />
                <p className="font-medium font-sans">No users found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredUsers.map((user) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`group cursor-pointer rounded-[20px] border transition-all duration-300 p-4 flex items-center justify-between ${
                      selectedUser?.id === user.id 
                        ? 'border-[#5D8B66] bg-[#5D8B66]/5 shadow-md shadow-[#5D8B66]/10' 
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm shrink-0">
                        <img 
                          src={user.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`} 
                          alt={user.username} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-bold text-gray-900 font-sans">{user.display_name}</p>
                          {user.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">Admin</span>
                          )}
                        </div>
                        <p className="text-[13px] text-gray-500 font-sans">@{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {user.is_banned && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 ring-1 ring-red-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Banned
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected User Details Panel */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="md:w-1/3 bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex flex-col h-[calc(100vh-140px)] sticky top-0"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-[20px] font-bold text-gray-900 font-sans tracking-tight">User Details</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg mb-4">
                <img 
                  src={selectedUser.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${selectedUser.username}`} 
                  alt={selectedUser.username} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-[22px] font-bold text-gray-900 font-sans leading-tight">{selectedUser.display_name}</h4>
              <p className="text-[14px] text-gray-500 font-sans mb-3">@{selectedUser.username}</p>
              
              <div className="flex gap-2">
                {selectedUser.role === 'admin' && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                    Admin
                  </span>
                )}
                {selectedUser.is_banned && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-700 ring-1 ring-red-200">
                    Banned
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-[20px] text-center">
                <p className="text-[28px] font-black text-[#5D8B66] font-sans leading-none">{statsLoading ? '-' : userStats?.moods}</p>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">Moods</p>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-[20px] text-center">
                <p className="text-[28px] font-black text-[#5D8B66] font-sans leading-none">{statsLoading ? '-' : userStats?.journals}</p>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">Journals</p>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-[20px] text-center">
                <p className="text-[28px] font-black text-[#5D8B66] font-sans leading-none">{statsLoading ? '-' : userStats?.assessments}</p>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">Tests</p>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-[20px] text-center">
                <p className="text-[28px] font-black text-[#5D8B66] font-sans leading-none">{statsLoading ? '-' : userStats?.posts}</p>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">Posts</p>
              </div>
            </div>
            
            <div className="mt-auto space-y-3 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Danger Zone</p>
              {selectedUser.role !== 'admin' && (
                <button 
                  onClick={() => handlePromoteClick(selectedUser)}
                  className="w-full py-3.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl text-[14px] font-bold font-sans transition-all flex items-center justify-center gap-2 group"
                >
                  <ShieldCheck className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                  Promote to Admin
                </button>
              )}
              
              {selectedUser.role !== 'admin' && (
                <button 
                  onClick={() => handleToggleBanClick(selectedUser)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-[14px] font-bold font-sans transition-all flex items-center justify-center gap-2 ${
                    selectedUser.is_banned 
                      ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700" 
                      : "bg-red-50 hover:bg-red-100 text-red-600"
                  }`}
                >
                  {selectedUser.is_banned ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Unban User
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      Ban User
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl text-center"
            >
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner ${
                confirmModal.actionType === 'ban' ? 'bg-red-50 text-red-500' :
                confirmModal.actionType === 'unban' ? 'bg-emerald-50 text-emerald-500' :
                'bg-indigo-50 text-indigo-500'
              }`}>
                {confirmModal.actionType === 'ban' ? <Ban className="w-10 h-10" /> :
                 confirmModal.actionType === 'unban' ? <ShieldCheck className="w-10 h-10" /> :
                 <ShieldAlert className="w-10 h-10" />}
              </div>
              
              <h3 className="text-[24px] font-bold text-gray-900 font-sans mb-3 tracking-tight">
                {confirmModal.title}
              </h3>
              <p className="text-[15px] text-gray-500 font-sans mb-8 leading-relaxed px-4">
                {confirmModal.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 text-gray-700 font-bold font-sans hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmAction}
                  className={`flex-1 px-6 py-4 rounded-2xl font-bold font-sans text-white transition-all shadow-lg hover:-translate-y-0.5 ${
                    confirmModal.actionType === 'ban' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                    confirmModal.actionType === 'unban' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' :
                    'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
