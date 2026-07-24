import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  X,
  Send,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function ForumPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Modal for comments
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const filters = ["All Feed", "Anxiety", "Depression", "Grief", "Self Improvement"];

  useEffect(() => {
    fetchPosts();
  }, [activeFilter, searchQuery]);

  // Fetch which posts the current user has liked
  const fetchLikedPosts = async (postIds) => {
    if (!user || postIds.length === 0) return;
    const { data } = await supabase
      .from("forum_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    if (data) {
      setLikedPosts(new Set(data.map(l => l.post_id)));
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("forum_posts")
        .select(`
          id, title, content, image_url, tags, created_at, likes_count, replies_count, user_id,
          profiles:user_id ( id, display_name, avatar_url )
        `)
        .order("created_at", { ascending: false });

      if (activeFilter !== "All Feed") {
        query = query.contains("tags", [activeFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredData = data;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        filteredData = data.filter(p => 
          (p.title && p.title.toLowerCase().includes(lowerQ)) || 
          (p.content && p.content.toLowerCase().includes(lowerQ))
        );
      }

      setPosts(filteredData || []);
      // Fetch liked state for all visible posts
      if (filteredData && filteredData.length > 0) {
        fetchLikedPosts(filteredData.map(p => p.id));
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post) => {
    if (!user) return;
    
    const isLiked = likedPosts.has(post.id);
    
    // Optimistic UI update
    const newLikedPosts = new Set(likedPosts);
    const newCount = isLiked 
      ? Math.max(0, (post.likes_count || 0) - 1) 
      : (post.likes_count || 0) + 1;
    
    if (isLiked) {
      newLikedPosts.delete(post.id);
    } else {
      newLikedPosts.add(post.id);
    }
    setLikedPosts(newLikedPosts);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: newCount } : p));

    try {
      if (isLiked) {
        await supabase.from("forum_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
        await supabase.rpc('decrement_post_likes', { p_id: post.id });
      } else {
        await supabase.from("forum_likes").insert({ post_id: post.id, user_id: user.id });
        await supabase.rpc('increment_post_likes', { p_id: post.id });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      fetchPosts();
    }
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`
          id, content, created_at,
          profiles:user_id ( id, display_name, avatar_url )
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user || !selectedPost) return;
    
    try {
      const { error } = await supabase
        .from("forum_replies")
        .insert({
          post_id: selectedPost.id,
          user_id: user.id,
          content: newComment.trim()
        });
        
      if (error) throw error;

      // Update replies count atomically
      await supabase.rpc('increment_post_replies', { p_id: selectedPost.id });
      
      setNewComment("");
      openComments(selectedPost);
      fetchPosts(); 
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/forum`; 
    const text = `Lihat postingan dari ${post.profiles?.display_name || "Anonymous"} di Komorebi: "${post.title || post.content.substring(0, 50)}..."\n\n${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || "Komorebi Forum Post",
          text: text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      showToast("Tautan disalin ke clipboard!");
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      const { error } = await supabase.from("forum_posts").delete().eq("id", postToDelete).eq("user_id", user.id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      setActiveDropdown(null);
      showToast("Postingan berhasil dihapus");
    } catch (err) {
      console.error("Error deleting post:", err);
      showToast("Gagal menghapus postingan.", "error");
    } finally {
      setPostToDelete(null);
    }
  };

  return (
    <div className="w-full pb-20">
      
      {/* Search Bar */}
      <div className="bg-white dark:bg-komorebi-dark-card rounded-2xl border border-gray-100 dark:border-komorebi-dark-border p-2 mb-6 flex items-center shadow-sm transition-colors duration-300">
        <div className="pl-4 pr-2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input 
          type="text"
          placeholder="How can we help you today?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 dark:placeholder-gray-500 py-3 font-sans transition-colors duration-300"
        />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 hide-scrollbar">
          {filters.map(filter => {
            const isActive = activeFilter === filter;
            return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`relative shrink-0 whitespace-nowrap px-6 py-2 rounded-full border text-sm font-medium transition-colors font-sans overflow-hidden ${
                    isActive 
                      ? "text-white border-transparent" 
                      : "bg-white dark:bg-komorebi-dark-bg border-[#B5CCBD] dark:border-[#32473D] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black/20"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeForumFilter"
                      className="absolute inset-[-1px] bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{filter}</span>
                </button>
            );
          })}
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#B5CCBD] dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black/20 whitespace-nowrap transition-colors duration-300">
          Most Recent
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white dark:bg-komorebi-dark-card rounded-2xl border border-gray-100 dark:border-[#32473D] transition-colors duration-300">
            No posts found. Be the first to share a story!
          </div>
        ) : (
          posts.map(post => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post.id} 
              className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 border border-gray-100 dark:border-komorebi-dark-border shadow-sm transition-colors duration-300"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-[48px] h-[48px] rounded-2xl bg-gray-200 dark:bg-[#32473D] overflow-hidden shrink-0 transition-colors duration-300">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">👤</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-[20px] text-gray-900 dark:text-white font-sans transition-colors duration-300">{post.profiles?.display_name || "Anonymous"}</h4>
                    <span className="text-[15px] text-gray-400 font-sans">{formatDate(post.created_at)}</span>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === post.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-komorebi-dark-border rounded-xl shadow-lg z-10 py-1"
                      >
                        {post.user_id === user?.id ? (
                          <button 
                            onClick={() => { setPostToDelete(post.id); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Hapus Postingan
                          </button>
                        ) : (
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            Laporkan Postingan
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                {post.title && <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 font-sans transition-colors duration-300">{post.title}</h3>}
                <p className="text-[15px] text-gray-700 dark:text-gray-300 font-sans leading-relaxed line-clamp-3 mb-4 transition-colors duration-300">
                  {post.content}
                </p>
                
                {post.image_url && (
                  <div className="rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-transparent max-h-[400px]">
                    <img src={post.image_url} alt="Post attachment" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-4 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-xs font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => handleLike(post)}
                  className={`flex items-center gap-2 transition-colors group ${
                    likedPosts.has(post.id) ? "text-red-500" : "text-gray-500 hover:text-red-400"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? "fill-current" : "group-hover:fill-current"}`} />
                  <span className="text-sm font-medium font-sans">{post.likes_count || 0}</span>
                </button>
                <button 
                  onClick={() => openComments(post)}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#7DA085] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium font-sans">{post.replies_count || 0}</span>
                </button>
                <button 
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#7DA085] transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedPost(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-komorebi-dark-card rounded-[24px] w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col h-[92vh] transition-colors duration-300"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-komorebi-dark-border flex items-center gap-4 sticky top-0 bg-white/80 dark:bg-komorebi-dark-card/80 backdrop-blur-md z-20 transition-colors duration-300">
                <button onClick={() => setSelectedPost(null)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold font-sans text-gray-900 dark:text-white transition-colors duration-300">Post</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Original Post */}
                <div className="p-4 sm:p-6 bg-white dark:bg-komorebi-dark-card border-b border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-[48px] h-[48px] rounded-2xl bg-gray-200 dark:bg-[#32473D] overflow-hidden shrink-0 transition-colors duration-300">
                      {selectedPost.profiles?.avatar_url ? (
                        <img src={selectedPost.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">👤</div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-[18px] text-gray-900 dark:text-white font-sans font-bold transition-colors duration-300">{selectedPost.profiles?.display_name || "Anonymous"}</h4>
                      <span className="text-[14px] text-gray-500 font-sans">{formatDate(selectedPost.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    {selectedPost.title && <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 font-sans transition-colors duration-300">{selectedPost.title}</h3>}
                    <p className="text-[16px] text-gray-800 dark:text-gray-300 font-sans leading-relaxed mb-4 whitespace-pre-wrap transition-colors duration-300">
                      {selectedPost.content}
                    </p>
                    {selectedPost.image_url && (
                      <div className="w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#32473D] mb-4 border border-gray-100 dark:border-transparent">
                        <img src={selectedPost.image_url} alt="Post image" className="w-full h-auto object-cover" />
                      </div>
                    )}
                    {selectedPost.tags && selectedPost.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {selectedPost.tags.map(tag => (
                          <span key={tag} className="px-4 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-xs font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 py-4 border-t border-gray-100 dark:border-komorebi-dark-border text-gray-500 transition-colors duration-300">
                     <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[14px] font-medium">{selectedPost.replies_count || 0}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        <span className="text-[14px] font-medium">{selectedPost.likes_count || 0}</span>
                     </div>
                     <button onClick={() => handleShare(selectedPost)} className="flex items-center gap-2 hover:text-[#7DA085] transition-colors">
                        <Share2 className="w-5 h-5" />
                     </button>
                  </div>
                </div>

                {/* Comment List */}
                <div className="p-4 sm:p-6 space-y-6 bg-gray-50/30 dark:bg-komorebi-dark-bg/30 flex-1 transition-colors duration-300">
                {loadingComments ? (
                  <div className="text-center py-10 text-gray-500">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">No comments yet. Be the first!</div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#32473D] overflow-hidden shrink-0 mt-1 transition-colors duration-300">
                        {c.profiles?.avatar_url ? (
                          <img src={c.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">👤</div>
                        )}
                      </div>
                      <div className="flex-1 bg-white dark:bg-[#32473D] border border-gray-100 dark:border-[#43674F] p-4 rounded-2xl rounded-tl-none shadow-sm transition-colors duration-300">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-sm font-sans text-gray-900 dark:text-white transition-colors duration-300">{c.profiles?.display_name || "Anonymous"}</h5>
                          <span className="text-[10px] text-gray-400">{formatDate(c.created_at)}</span>
                        </div>
                        <p className="text-[14px] text-gray-700 dark:text-gray-300 font-sans leading-relaxed transition-colors duration-300">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-6 border-t border-gray-100 dark:border-komorebi-dark-border bg-white dark:bg-komorebi-dark-card transition-colors duration-300">
                <div className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                    className="flex-1 bg-gray-50 dark:bg-komorebi-dark-bg border border-gray-200 dark:border-[#32473D] rounded-full px-5 py-3 text-sm outline-none focus:border-[#7DA085] text-gray-900 dark:text-white dark:placeholder-gray-500 transition-colors"
                  />
                  <button 
                    onClick={submitComment}
                    disabled={!newComment.trim()}
                    className="p-3 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white rounded-full transition-all duration-300 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setPostToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-komorebi-dark-card rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl relative z-10 p-6 flex flex-col items-center text-center transition-colors duration-300"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold font-sans text-gray-900 dark:text-white mb-2 transition-colors duration-300">Hapus Postingan?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mb-6 transition-colors duration-300">
                Apakah Anda yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setPostToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-komorebi-dark-border text-gray-700 dark:text-gray-300 font-medium font-sans hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-300"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDeletePost}
                  className="flex-1 px-4 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium font-sans shadow-sm transition-colors duration-300"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1001] px-5 py-3 bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-[#32473D] rounded-full shadow-2xl flex items-center gap-3 text-[14px] font-medium font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300"
          >
            {toastMessage.type === 'error' ? (
              <div className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#5D8B66]/10 dark:bg-[#7DA085]/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5D8B66] dark:text-[#7DA085]" />
              </div>
            )}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
