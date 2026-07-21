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
  Send
} from "lucide-react";

export default function ForumPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());
  
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
          id, title, content, image_url, tags, created_at, likes_count, replies_count,
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

  return (
    <div className="w-full pb-20">
      
      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 mb-6 flex items-center shadow-sm">
        <div className="pl-4 pr-2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input 
          type="text"
          placeholder="How can we help you today?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-gray-700 py-3 font-sans"
        />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 hide-scrollbar">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-6 py-2 rounded-full border text-sm font-medium transition-colors font-sans ${
                activeFilter === filter 
                  ? "bg-[#7DA085] border-[#7DA085] text-white" 
                  : "bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 bg-transparent text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
          Most Recent
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100">
            No posts found. Be the first to share a story!
          </div>
        ) : (
          posts.map(post => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post.id} 
              className="bg-white rounded-[24px] p-6 lg:p-8 border border-gray-100 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">👤</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-[15px] font-sans leading-none">{post.profiles?.display_name || "Anonymous"}</h4>
                    <span className="text-[12px] text-gray-400 font-sans">{formatDate(post.created_at)}</span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-2">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-4">
                {post.title && <h3 className="text-xl font-bold text-gray-900 mb-3 font-sans">{post.title}</h3>}
                <p className="text-[15px] text-gray-700 font-sans leading-relaxed line-clamp-3 mb-4">
                  {post.content}
                </p>
                
                {post.image_url && (
                  <div className="rounded-2xl overflow-hidden mb-4 border border-gray-100 max-h-[400px]">
                    <img src={post.image_url} alt="Post attachment" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-600 font-sans">
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
                <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedPost(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold font-sans">Comments</h3>
                <button onClick={() => setSelectedPost(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Comment List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {loadingComments ? (
                  <div className="text-center py-10 text-gray-500">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">No comments yet. Be the first!</div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-1">
                        {c.profiles?.avatar_url ? (
                          <img src={c.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                        )}
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-sm font-sans">{c.profiles?.display_name || "Anonymous"}</h5>
                          <span className="text-[10px] text-gray-400">{formatDate(c.created_at)}</span>
                        </div>
                        <p className="text-[14px] text-gray-700 font-sans leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <div className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm outline-none focus:border-[#7DA085] transition-colors"
                  />
                  <button 
                    onClick={submitComment}
                    disabled={!newComment.trim()}
                    className="p-3 bg-[#7DA085] hover:bg-[#688A70] text-white rounded-full transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
