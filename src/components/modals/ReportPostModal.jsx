import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/useAuthStore';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Misleading' },
  { id: 'harassment', label: 'Harassment or Bullying' },
  { id: 'inappropriate', label: 'Inappropriate Content' },
  { id: 'triggering', label: 'Harmful or Triggering without Warning' },
  { id: 'other', label: 'Other' }
];

export function ReportPostModal({ isOpen, onClose, post }) {
  const { user } = useAuthStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !post) return;
    
    const finalReason = selectedReason === 'other' ? otherReason : selectedReason;
    if (!finalReason) {
      setError('Please provide a reason for reporting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('forum_reports')
        .insert({
          reporter_id: user.id,
          post_id: post.id,
          reason: finalReason,
        });

      if (submitError) throw submitError;

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedReason('');
        setOtherReason('');
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error reporting post:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-komorebi-dark-card rounded-[24px] w-full max-w-md relative z-10 shadow-2xl overflow-hidden border border-gray-100 dark:border-komorebi-dark-border"
        >
          {isSuccess ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-sans mb-2">Report Submitted</h3>
              <p className="text-gray-500 dark:text-gray-400 font-sans">
                Thank you for helping keep our community safe. Our team will review this post shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-sans flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  Report Post
                </h3>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-4">
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 font-sans mb-4">
                    Why are you reporting this post from <strong className="text-gray-700 dark:text-gray-300">@{post?.profiles?.username || 'user'}</strong>?
                  </p>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex gap-2 text-red-600 dark:text-red-400 text-[13px]">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    {REPORT_REASONS.map((reason) => (
                      <label 
                        key={reason.id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedReason === reason.id 
                            ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20' 
                            : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="report_reason" 
                          value={reason.id}
                          checked={selectedReason === reason.id}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="text-red-500 focus:ring-red-500"
                        />
                        <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">{reason.label}</span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === 'other' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3"
                    >
                      <textarea
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        placeholder="Please provide more details..."
                        className="w-full p-3 bg-gray-50 dark:bg-komorebi-dark-bg border border-gray-200 dark:border-white/10 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white"
                        rows="3"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl font-bold font-sans text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedReason}
                    className="flex-1 py-3 px-4 rounded-xl font-bold font-sans text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
