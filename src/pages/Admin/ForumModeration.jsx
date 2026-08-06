import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Trash2, CheckCircle, Ban, AlertTriangle, X } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import useToastStore from '../../stores/useToastStore';

export default function ForumModeration() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, resolved, dismissed
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { addToast } = useToastStore();
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    actionType: null, 
    reportId: null, 
    title: '',
    message: '' 
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_reports')
        .select(`
          *,
          reporter:profiles!forum_reports_reporter_id_fkey(id, username, display_name, avatar_url),
          post:forum_posts(id, title, content, user_id, created_at, profiles(id, username, display_name, avatar_url))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => r.status === activeTab);

  const handleAction = async (reportId, action) => {
    setActionLoading(true);
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      if (action === 'dismiss') {
        await supabase.from('forum_reports').update({ status: 'dismissed' }).eq('id', reportId);
      } else if (action === 'delete_post') {
        // Delete post
        await supabase.from('forum_posts').delete().eq('id', report.post_id);
        // Mark report as resolved
        await supabase.from('forum_reports').update({ status: 'resolved' }).eq('id', reportId);
      } else if (action === 'ban_user') {
        // Ban the author of the post
        if (report.post?.user_id) {
          await supabase.from('profiles').update({ is_banned: true }).eq('id', report.post.user_id);
          // Optional: Also delete post and resolve
          await supabase.from('forum_posts').delete().eq('id', report.post_id);
          await supabase.from('forum_reports').update({ status: 'resolved' }).eq('id', reportId);
        }
      }
      
      setSelectedReport(null);
      setConfirmModal({ ...confirmModal, isOpen: false });
      await fetchReports();
    } catch (err) {
      console.error('Error taking action:', err);
      addToast('Failed to perform action.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const executeConfirmAction = () => {
    if (confirmModal.reportId && confirmModal.actionType) {
      handleAction(confirmModal.reportId, confirmModal.actionType);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 font-sans flex items-center gap-3">
            Forum Moderation
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[13px] font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {reports.filter(r => r.status === 'pending').length} Action Required
              </span>
            )}
          </h2>
          <p className="text-[14px] text-gray-500 font-sans mt-1">Review flagged content and take necessary actions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {['pending', 'resolved', 'dismissed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize whitespace-nowrap px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all font-sans ${
              activeTab === tab
                ? "bg-[#1a1f2e] text-white shadow-md"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab} Reports
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Reports List */}
        <div className={`flex-1 transition-all duration-300 ${selectedReport ? 'md:w-1/2 lg:w-2/5' : 'w-full'}`}>
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border border-gray-100 rounded-2xl">
                    <Skeleton className="h-5 w-1/3 mb-3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                <ShieldAlert className="w-16 h-16 mb-4 text-gray-200" />
                <p className="font-bold text-[18px] text-gray-900 font-sans">No {activeTab} reports</p>
                <p className="text-[14px] mt-1 font-sans">Everything looks good here!</p>
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-3">
                {filteredReports.map((report) => (
                  <motion.div
                    key={report.id}
                    layout
                    onClick={() => setSelectedReport(report)}
                    className={`p-5 rounded-[24px] border cursor-pointer transition-all ${
                      selectedReport?.id === report.id 
                        ? 'border-red-200 bg-red-50/50 shadow-sm' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {report.reason}
                      </span>
                      <span className="text-[12px] text-gray-400 font-sans">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 text-[15px] font-sans mb-1 line-clamp-1">
                      {report.post?.title || 'Untitled Post'}
                    </h4>
                    <p className="text-[13px] text-gray-500 font-sans mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: report.post?.content || '<em>Content deleted</em>' }} />
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                          <img src={report.reporter?.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${report.reporter?.username}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[12px] text-gray-500 font-sans">Reported by <b>@{report.reporter?.username}</b></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Details Panel */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="md:w-1/2 lg:w-3/5 bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col max-h-[calc(100vh-140px)] overflow-y-auto [&::-webkit-scrollbar]:hidden sticky top-6"
            >
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                <div>
                  <h3 className="text-[20px] font-bold text-gray-900 font-sans mb-1">Report Details</h3>
                  <p className="text-[14px] text-gray-500">ID: {selectedReport.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Offending Post Context */}
              <div className="mb-8">
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Reported Content</h4>
                {selectedReport.post ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-[24px] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        <img src={selectedReport.post.profiles?.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${selectedReport.post.profiles?.username}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-[14px]">{selectedReport.post.profiles?.display_name}</p>
                        <p className="text-[12px] text-gray-500">@{selectedReport.post.profiles?.username}</p>
                      </div>
                    </div>
                    {selectedReport.post.title && <h5 className="font-bold text-[18px] text-gray-900 mb-2">{selectedReport.post.title}</h5>}
                    <div className="prose prose-sm text-gray-700 max-w-none" dangerouslySetInnerHTML={{ __html: selectedReport.post.content }} />
                  </div>
                ) : (
                  <div className="p-6 bg-red-50 text-red-500 rounded-2xl text-center font-bold">
                    This post has already been deleted.
                  </div>
                )}
              </div>

              {/* Actions */}
              {activeTab === 'pending' && (
                <div className="mt-auto space-y-3 pt-6 border-t border-gray-100">
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Moderation Actions</p>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleAction(selectedReport.id, 'dismiss')}
                      disabled={actionLoading}
                      className="w-full py-4 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl text-[14px] font-bold font-sans transition-all flex items-center justify-center gap-2 border border-gray-200"
                    >
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      Dismiss Report (Safe)
                    </button>
                    
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          actionType: 'delete_post',
                          reportId: selectedReport.id,
                          title: 'Take Down Post',
                          message: 'Are you sure you want to permanently delete this post? This action cannot be undone.'
                        });
                      }}
                      disabled={actionLoading || !selectedReport.post}
                      className="w-full py-4 px-4 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-2xl text-[14px] font-bold font-sans transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Take Down Post
                    </button>
                    
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          actionType: 'ban_user',
                          reportId: selectedReport.id,
                          title: 'Ban User & Remove Post',
                          message: 'Are you sure you want to permanently ban this user and delete their post? They will no longer be able to access the platform.'
                        });
                      }}
                      disabled={actionLoading || !selectedReport.post}
                      className="w-full py-4 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-[14px] font-bold font-sans transition-all flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Ban Author & Remove Post
                    </button>
                  </div>
                </div>
              )}
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
                confirmModal.actionType === 'ban_user' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
              }`}>
                {confirmModal.actionType === 'ban_user' ? <Ban className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
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
                  disabled={actionLoading}
                  className={`flex-1 px-6 py-4 rounded-2xl font-bold font-sans text-white transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 ${
                    confirmModal.actionType === 'ban_user' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                  }`}
                >
                  {actionLoading ? 'Loading...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
