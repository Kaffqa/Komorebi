import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
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
  EyeOff,
  Mic,
  MicOff,
  Trash2,
} from "lucide-react";
import { AudioPlayer } from "../../components/ui/AudioPlayer";

export default function NewStoryPage() {
  const { t } = useTranslation();
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
  const availableTags = t('newStory.tags', { returnObjects: true }) || [];
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Voice Recording States
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioTimerRef = useRef(null);
  
  const fileInputRef = useRef(null);

  const { addToast } = useToastStore();

  const showToast = (text, type = 'error') => addToast(text, type);

  const MAX_AUDIO_DURATION = 180; // 3 minutes

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
        placeholder: t('newStory.placeholder_body'),
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

  const DRAFT_KEY = user ? `forum_draft_${user.id}` : null;

  // Pre-fill from draft (e.g. shared diagnosis result) or localStorage
  useEffect(() => {
    const state = location.state;
    if (state && (state.draftTitle || state.draftContent || state.draftTags)) {
      if (state.draftTitle) setTitle(state.draftTitle);
      if (state.draftContent) {
        setContent(state.draftContent);
        if (editor) {
          editor.commands.setContent(state.draftContent);
        }
      }
      if (state.draftTags) setTags(state.draftTags);
    } else if (DRAFT_KEY) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.content) {
            setContent(parsed.content);
            if (editor) editor.commands.setContent(parsed.content);
          }
          if (parsed.tags) setTags(parsed.tags);
          if (parsed.isAnonymous !== undefined) setIsAnonymous(parsed.isAnonymous);
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [location.state, editor, DRAFT_KEY]);

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      if (tags.length >= 3) {
        showToast(t('newStory.err_max_tags'));
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
      showToast(t('newStory.err_upload', { msg: error.message }));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ═══════════════════════════════════════════
  // Voice Recording Logic
  // ═══════════════════════════════════════════
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioPreviewUrl(url);
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);
      setAudioDuration(0);

      // Duration timer
      audioTimerRef.current = setInterval(() => {
        setAudioDuration(prev => {
          if (prev >= MAX_AUDIO_DURATION - 1) {
            stopRecording();
            return MAX_AUDIO_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      showToast(t('newStory.err_mic'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    setIsRecordingAudio(false);
  };

  const deleteRecording = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null);
    setAudioPreviewUrl("");
    setAudioDuration(0);
  };

  const formatRecordTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, []);

  // ═══════════════════════════════════════════
  // Publish Logic
  // ═══════════════════════════════════════════
  const handlePublish = async () => {
    const htmlContent = editor?.getHTML() || content;
    
    // Check if empty (TipTap empty is usually `<p></p>`)
    const isEmpty = !htmlContent || htmlContent === '<p></p>' || htmlContent.trim() === '';
    
    if (!title.trim() || (isEmpty && !audioBlob && !imageUrl)) {
      showToast(t('newStory.err_empty'));
      return;
    }
    
    setIsPublishing(true);
    try {
      // Upload audio if exists
      let uploadedAudioUrl = null;
      if (audioBlob) {
        setIsUploadingAudio(true);
        const ext = audioBlob.type.includes('webm') ? 'webm' : 'mp4';
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        
        const { error: audioUploadErr } = await supabase.storage
          .from('forum_audio')
          .upload(fileName, audioBlob, { contentType: audioBlob.type });
        
        if (audioUploadErr) throw audioUploadErr;
        
        const { data: audioData } = supabase.storage
          .from('forum_audio')
          .getPublicUrl(fileName);
        
        uploadedAudioUrl = audioData.publicUrl;
        setIsUploadingAudio(false);
      }

      const { error } = await supabase
        .from("forum_posts")
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: htmlContent,
          tags: tags,
          image_url: imageUrl || null,
          audio_url: uploadedAudioUrl,
          is_anonymous: isAnonymous
        });
        
      if (error) throw error;
      
      if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
      
      showToast(t('newStory.success') || 'Story published successfully!', 'success');
      navigate("/forum");
    } catch (error) {
      console.error("Error publishing post:", error);
      setIsUploadingAudio(false);
      showToast(t('newStory.err_save', { msg: error.message }));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-20 relative"
    >

      <button 
        onClick={() => navigate("/forum")} 
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-sans font-medium mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('newStory.back')}
      </button>

      <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-10 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col min-h-[80vh] transition-colors duration-300">
        
        {/* Title Input */}
        <input 
          type="text"
          placeholder={t('newStory.placeholder_title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl font-bold font-sans text-gray-900 dark:text-white border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 w-full mb-6 bg-transparent transition-colors duration-300"
        />

        {/* Anonymous Toggle */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-komorebi-dark-bg rounded-xl border border-gray-100 dark:border-komorebi-dark-border w-fit transition-colors duration-300">
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex ${
              isAnonymous ? 'bg-[#5F916F] justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
            }`}
          >
            <motion.div
              layout
              className="w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
          <div className="flex items-center gap-2">
            <EyeOff className={`w-4 h-4 ${isAnonymous ? 'text-[#5F916F]' : 'text-gray-400 dark:text-gray-500'}`} />
            <span className={`text-sm font-medium font-sans ${isAnonymous ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('newStory.anonymous')}
            </span>
          </div>
        </div>

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
            {t('newStory.add_tags')}
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
              <h3 className="text-xl font-bold font-sans text-gray-900 dark:text-white">{t('newStory.link_modal.title')}</h3>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('newStory.link_modal.label')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
                  placeholder={t('newStory.link_modal.placeholder')}
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
                {t('common.cancel')}
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

        {/* Voice Recorder Section */}
        <div className="mb-6">
          {!audioBlob && !isRecordingAudio && (
            <button
              onClick={startRecording}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-dashed border-[#B5CCBD] dark:border-[#43674F] bg-[#F7FAF8] dark:bg-[#1A2B20] hover:bg-[#EDF5EF] dark:hover:bg-[#223D2B] transition-all duration-200 text-gray-600 dark:text-gray-300 font-sans text-sm font-medium w-full sm:w-auto"
            >
              <div className="w-9 h-9 rounded-full bg-[#5D8B66]/10 dark:bg-[#5D8B66]/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-[#5D8B66]" />
              </div>
              {t('newStory.voice.record')}
              <span className="text-[11px] text-gray-400 ml-auto sm:ml-2">{t('newStory.voice.max')}</span>
            </button>
          )}

          {isRecordingAudio && (
            <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 transition-colors duration-300">
              {/* Pulsing indicator */}
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <div className="relative w-4 h-4 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 font-sans">{t('newStory.voice.recording')}</p>
                <p className="text-xs text-red-500/70 dark:text-red-400/60 font-mono">{formatRecordTime(audioDuration)} / {formatRecordTime(MAX_AUDIO_DURATION)}</p>
              </div>
              <button
                onClick={stopRecording}
                className="px-5 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium font-sans transition-colors shadow-sm flex items-center gap-2"
              >
                <MicOff className="w-4 h-4 pointer-events-none" />
                {t('newStory.voice.stop')}
              </button>
            </div>
          )}

          {audioBlob && !isRecordingAudio && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-sans flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#5D8B66]" />
                  {t('newStory.voice.attached', { time: formatRecordTime(audioDuration) })}
                </p>
                <button
                  onClick={deleteRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-sans"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('newStory.voice.remove')}
                </button>
              </div>
              <AudioPlayer src={audioPreviewUrl} />
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
              {isPublishing ? t('newStory.saving') : t('newStory.save')}
            </button>
            <button 
              onClick={() => {
                if (DRAFT_KEY) {
                  localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, tags, isAnonymous }));
                  showToast(t('newStory.draft_saved') || "Draft saved!", 'success');
                  navigate("/forum");
                }
              }}
              className="flex-1 sm:flex-none px-8 py-2.5 border border-[#B5CCBD] dark:border-komorebi-dark-border bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full font-medium font-sans transition-colors duration-300"
            >
              {t('newStory.drafts')}
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
