import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
  ArrowLeft,
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
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#5F916F] underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Body text...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:float-left before:text-gray-400 before:pointer-events-none',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'flex-1 w-full p-6 text-[15px] font-sans text-gray-700 dark:text-gray-200 bg-transparent outline-none min-h-[300px] leading-relaxed transition-colors duration-300 prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
  });

  const handleOpenLinkModal = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkInputUrl(previousUrl || "");
    setShowLinkModal(true);
  };

  const handleApplyLink = () => {
    if (!editor) return;
    if (linkInputUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let urlToSave = linkInputUrl.trim();
      // Ensure URL has http/https if it doesn't already
      if (!/^https?:\/\//i.test(urlToSave)) {
        urlToSave = `https://${urlToSave}`;
      }
      
      if (editor.state.selection.empty) {
        // Insert URL as text if nothing is selected
        editor.chain().focus().insertContent(`<a href="${urlToSave}">${urlToSave}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: urlToSave }).run();
      }
    }
    setShowLinkModal(false);
  };

  // Pre-fill from draft (e.g. shared diagnosis result)
  useEffect(() => {
    const state = location.state;
    if (state) {
      if (state.draftTitle) setTitle(state.draftTitle);
      if (state.draftContent) {
        setContent(state.draftContent);
        if (editor) {
          editor.commands.setContent(state.draftContent);
        }
      }
      if (state.draftTags) setTags(state.draftTags);
    }
  }, [location.state, editor]);

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
    const htmlContent = editor?.getHTML() || content;
    
    // Check if empty (TipTap empty is usually `<p></p>`)
    const isEmpty = !htmlContent || htmlContent === '<p></p>' || htmlContent.trim() === '';
    
    if (!title.trim() || isEmpty) {
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
          content: htmlContent,
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
      <button 
        onClick={() => navigate("/forum")} 
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-sans font-medium mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Forum
      </button>

      <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-10 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col min-h-[80vh] transition-colors duration-300">
        
        {/* Title Input */}
        <input 
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl font-bold font-sans text-gray-900 dark:text-white border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 w-full mb-6 bg-transparent transition-colors duration-300"
        />

        {/* Tags Section */}
        <div className="flex flex-wrap items-center gap-2 mb-8 relative">
          {tags.filter(t => t && t.trim() !== "").map((tag, index) => (
            <span key={`${tag}-${index}`} className="flex items-center gap-1 bg-white dark:bg-komorebi-dark-bg border border-[#B5CCBD] dark:border-komorebi-dark-border text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full text-sm font-medium font-sans transition-colors duration-300">
              {tag}
              <button onClick={() => toggleTag(tag)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          <button 
            onClick={() => setShowTagMenu(!showTagMenu)}
            className="flex items-center gap-1.5 bg-white dark:bg-komorebi-dark-bg border border-[#B5CCBD] dark:border-komorebi-dark-border text-gray-600 dark:text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium font-sans hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-300"
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
                className="absolute top-10 left-0 bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-komorebi-dark-border shadow-lg rounded-2xl p-4 w-64 z-10 transition-colors duration-300"
              >
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => { toggleTag(tag); setShowTagMenu(false); }}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium font-sans transition-all duration-300 ${
                        tags.includes(tag) ? "bg-gradient-to-b from-[#5F916F] to-[#94B59F] border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] text-white" : "bg-gray-50 dark:bg-komorebi-dark-bg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 border-transparent"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      
      {/* Custom Link Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLinkModal && (
            <motion.div
              key="link-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
              onClick={() => setShowLinkModal(false)}
            />
          )}
          {showLinkModal && (
            <motion.div
              key="link-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 shadow-2xl z-[10000] w-[90%] max-w-md border border-gray-100 dark:border-komorebi-dark-border"
            >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold font-sans text-gray-900 dark:text-white">Insert Link</h3>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL / Link Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
                  placeholder="example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-komorebi-dark-bg border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5F916F]/50 text-gray-900 dark:text-white transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyLink()}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLinkModal(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-komorebi-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApplyLink}
                className="px-5 py-2.5 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-sm text-white font-medium rounded-full hover:brightness-110 active:translate-y-[1px] transition-all"
              >
                Apply Link
              </button>
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>

        {/* Editor Area */}
        <div className="flex-1 border border-gray-200 dark:border-komorebi-dark-border rounded-2xl flex flex-col overflow-hidden mb-6 transition-colors duration-300 relative">
          <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
          
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
          
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">
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
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              title="Add Image"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleOpenLinkModal}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('link') ? 'bg-gray-100 dark:bg-white/10' : ''}`}
            ><LinkIcon className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors opacity-50 cursor-not-allowed" title="Video coming soon"><Video className="w-5 h-5" /></button>
            
            <div className="w-px h-6 bg-gray-200 dark:bg-komorebi-dark-border mx-2 transition-colors duration-300"></div>
            
            <button 
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('bold') ? 'bg-gray-100 dark:bg-white/10' : ''}`}
            ><Bold className="w-5 h-5" /></button>
            <button 
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('italic') ? 'bg-gray-100 dark:bg-white/10' : ''}`}
            ><Italic className="w-5 h-5" /></button>
            <button 
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('bulletList') ? 'bg-gray-100 dark:bg-white/10' : ''}`}
            ><List className="w-5 h-5" /></button>
            <button 
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('orderedList') ? 'bg-gray-100 dark:bg-white/10' : ''}`}
            ><ListOrdered className="w-5 h-5" /></button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 sm:flex-none px-8 py-2.5 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white rounded-full font-medium font-sans transition-all duration-300 disabled:opacity-50"
            >
              {isPublishing ? "Saving..." : "Save"}
            </button>
            <button 
              onClick={() => navigate("/forum")}
              className="flex-1 sm:flex-none px-8 py-2.5 border border-[#B5CCBD] dark:border-komorebi-dark-border bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full font-medium font-sans transition-colors duration-300"
            >
              Drafts
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
