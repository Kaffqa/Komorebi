import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Bold,
  Italic,
  List,
  ListOrdered,
  Plus,
  X,
  Loader2,
} from "lucide-react";

export default function NewStoryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  
  const [showTagMenu, setShowTagMenu] = useState(false);
  const availableTags = ["Anxiety", "Depression", "Grief", "Self Improvement", "Mindfulness", "Venting"];
  
  const fileInputRef = useRef(null);

  // Pre-fill from draft (e.g. shared diagnosis result)
  useEffect(() => {
    const state = location.state;
    if (state) {
      if (state.draftTitle) setTitle(state.draftTitle);
      if (state.draftContent) setContent(state.draftContent);
      if (state.draftTags) setTags(state.draftTags);
    }
  }, [location.state]);

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      if (tags.length >= 3) {
        alert("Maximum 3 tags allowed.");
        return;
      }
      setTags([...tags, tag]);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('forum_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('forum_images')
        .getPublicUrl(fileName);

      setImageUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Gagal mengupload gambar. Pastikan bucket "forum_images" sudah dibuat. Error: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content cannot be empty.");
      return;
    }
    
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from("forum_posts")
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          tags: tags,
          image_url: imageUrl || null
        });
        
      if (error) throw error;
      
      navigate("/forum");
    } catch (error) {
      console.error("Error publishing post:", error);
      alert("Gagal menyimpan post. Pastikan Anda telah menjalankan script SQL untuk menambahkan kolom title dan image_url di Supabase.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-20"
    >
      <div className="bg-white rounded-[24px] p-6 lg:p-10 shadow-sm border border-gray-100 flex flex-col min-h-[80vh]">
        
        {/* Title Input */}
        <input 
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl font-bold font-sans text-gray-900 border-none outline-none placeholder-gray-300 w-full mb-6 bg-transparent"
        />

        {/* Tags Section */}
        <div className="flex flex-wrap items-center gap-2 mb-8 relative">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium font-sans">
              {tag}
              <button onClick={() => toggleTag(tag)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          <button 
            onClick={() => setShowTagMenu(!showTagMenu)}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium font-sans hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tags
          </button>
          
          <AnimatePresence>
            {showTagMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-10 left-0 bg-white border border-gray-100 shadow-lg rounded-2xl p-4 w-64 z-10"
              >
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => { toggleTag(tag); setShowTagMenu(false); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium font-sans transition-colors ${
                        tags.includes(tag) ? "bg-[#7DA085] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Editor Area */}
        <div className="flex-1 border border-gray-200 rounded-2xl flex flex-col overflow-hidden mb-6">
          <textarea
            placeholder="Body text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-6 text-[15px] font-sans text-gray-700 bg-transparent resize-none outline-none min-h-[300px] leading-relaxed"
          />
          
          {imageUrl && (
            <div className="relative mx-6 mb-6 rounded-xl overflow-hidden group">
              <img src={imageUrl} alt="Uploaded attachment" className="w-full max-h-[400px] object-cover" />
              <button 
                onClick={() => setImageUrl("")}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Toolbar & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-gray-500">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Add Image"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><LinkIcon className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Video className="w-5 h-5" /></button>
            
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Bold className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Italic className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><List className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ListOrdered className="w-5 h-5" /></button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 sm:flex-none px-8 py-2.5 bg-[#7DA085] hover:bg-[#688A70] text-white rounded-full font-medium font-sans transition-colors disabled:opacity-50"
            >
              {isPublishing ? "Saving..." : "Save"}
            </button>
            <button 
              onClick={() => navigate("/forum")}
              className="flex-1 sm:flex-none px-8 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full font-medium font-sans transition-colors"
            >
              Drafts
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
