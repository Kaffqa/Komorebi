import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router";
import {
  Send,
  MoreVertical,
  Trash2,
  ArrowDown,
  Brain,
  Activity,
  Mic,
  MicOff,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useThemeStore } from "../../stores/useThemeStore";
import { supabase } from "../../services/supabase";
import { sendMessageToKomi, getKomiGreeting, getKomiEmpatheticGreeting, getKomiHappyGreeting } from "../../services/gemini";
import { getLocalDateString } from "../../utils/date";
import Logo from "../../assets/logo.svg";

const AI_AVATAR_URL = "https://images.unsplash.com/vector-1786021960404-cf958c7c70c2?q=80&w=879&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
import { Skeleton } from "../../components/ui/Skeleton";
import useToastStore from "../../stores/useToastStore";
import { useTranslation } from "react-i18next";

export default function ChatPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const MSG_PER_PAGE = 50;
  
  const [showMenu, setShowMenu] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasSentDiagnosis, setHasSentDiagnosis] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const { addToast } = useToastStore();
  
  const location = useLocation();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const initLock = useRef(false);

  // Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [shouldAutoSend, setShouldAutoSend] = useState(false);
  const recognitionRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll detection
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
      
      if (scrollTop === 0 && hasMore && !loadingMore && conversationId) {
        loadMoreMessages();
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, page, conversationId]);


  // Auto-send logic when recording stops
  useEffect(() => {
    if (shouldAutoSend) {
      if (input.trim() && !isTyping) {
        handleSend();
      }
      setShouldAutoSend(false);
    }
  }, [shouldAutoSend, input, isTyping]); // handleSend is not a dependency but it will be called correctly

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast(t('chat.err_mic'), 'error');
      return;
    }
    
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInput(""); // Clear input before starting
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop when the user pauses
      recognition.interimResults = true;
      recognition.lang = "id-ID";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        // Trigger auto-send flag so useEffect handles it with fresh state
        setShouldAutoSend(true);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch or create conversation & load messages
  const initChat = useCallback(async () => {
    if (!user || initLock.current) return;
    initLock.current = true;
    setLoading(true);

    try {
      // Get or create conversation
      let { data: conv } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id })
          .select()
          .single();
        conv = newConv;
      }

      if (!conv) {
        setLoading(false);
        initLock.current = false;
        return;
      }

      setConversationId(conv.id);

      // Load messages
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(MSG_PER_PAGE);

      let finalMsgs = msgs ? msgs.reverse() : [];
      if (msgs && msgs.length < MSG_PER_PAGE) setHasMore(false);
      else setHasMore(true);

      // Emotion-Aware Proactivity Check
      const today = getLocalDateString();
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood, mood_score')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (moodData) {
        setUserContext({
          mood: moodData.mood,
          moodScore: moodData.mood_score
        });
      }

      const moodScore = moodData ? moodData.mood_score : 3;
      const isBadMood = moodScore <= 2;
      const isGoodMood = moodScore >= 4;
      
      let needsProactiveGreeting = false;

      if (finalMsgs.length === 0) {
        needsProactiveGreeting = true;
      } else {
        // If we already have messages, check if the last message was today
        const lastMsg = finalMsgs[finalMsgs.length - 1];
        // Get YYYY-MM-DD from created_at securely
        const lastMsgDate = new Date(lastMsg.created_at);
        const localTodayDate = new Date();
        const isLastMsgToday = lastMsgDate.getFullYear() === localTodayDate.getFullYear() && 
                              lastMsgDate.getMonth() === localTodayDate.getMonth() && 
                              lastMsgDate.getDate() === localTodayDate.getDate();

        // If it's a new day, Komi should always greet proactively based on mood
        if (!isLastMsgToday) {
          needsProactiveGreeting = true;
        }
      }

      if (needsProactiveGreeting) {
        let greetingText;
        if (isBadMood) greetingText = getKomiEmpatheticGreeting(profile?.display_name);
        else if (isGoodMood) greetingText = getKomiHappyGreeting(profile?.display_name);
        else greetingText = getKomiGreeting(profile?.display_name);

        const { data: greetMsg } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: conv.id,
            sender: "ai",
            content: greetingText,
          })
          .select()
          .single();

        if (greetMsg) {
          finalMsgs = [...finalMsgs, greetMsg];
        }
      }

      setMessages(finalMsgs);
    } catch (err) {
      console.error("Failed to init chat:", err);
    } finally {
      setLoading(false);
      initLock.current = false;
      setTimeout(() => scrollToBottom("auto"), 100);
    }
  }, [user, profile]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !conversationId) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const container = chatContainerRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;

      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .range(nextPage * MSG_PER_PAGE, (nextPage + 1) * MSG_PER_PAGE - 1);
        
      if (msgs && msgs.length > 0) {
        if (msgs.length < MSG_PER_PAGE) setHasMore(false);
        setPage(nextPage);
        setMessages(prev => {
          const newIds = msgs.map(m => m.id);
          const filteredPrev = prev.filter(p => !newIds.includes(p.id));
          return [...msgs.reverse(), ...filteredPrev];
        });
        
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Build conversation history for Gemini
  const buildHistory = () => {
    return messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));
  };

  // Send message
  const handleSend = async (overrideText) => {
    const text = typeof overrideText === "string" ? overrideText : input.trim();
    if (!text || isTyping || !conversationId) return;

    if (typeof overrideText !== "string") {
      setInput("");
      inputRef.current?.focus();
    }

    // Save user message
    const { data: userMsg } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender: "user",
        content: text,
      })
      .select()
      .single();

    if (userMsg) {
      setMessages((prev) => [...prev, userMsg]);
    }

    setTimeout(() => scrollToBottom(), 50);

    // Get AI response
    setIsTyping(true);
    setStreamingText("");

    try {
      const streamRes = await sendMessageToKomi(
        buildHistory(),
        text,
        (chunk) => {
          setStreamingText(chunk);
          scrollToBottom("auto");
        },
        userContext
      );
      
      // Save AI message
      const { data: aiMsg } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          sender: "ai",
          content: streamRes,
        })
        .select()
        .single();

      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      let errorMessage = t('chat.err_fallback');
      if (error?.message?.includes("quota") || error?.status === 429) {
        errorMessage = t('chat.err_quota');
      }

      const errorMsg = {
        id: `error-${Date.now()}`,
        sender: "ai",
        content: errorMessage,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setStreamingText("");
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  // Automatically send diagnosis summary or activity suggestion if available
  useEffect(() => {
    // Only proceed if chat is fully loaded and not already typing
    const autoMsg = location.state?.diagnosisSummary || location.state?.activitySuggestion;
    if (!loading && autoMsg && conversationId && !hasSentDiagnosis && !isTyping) {
      setHasSentDiagnosis(true);
      
      // Allow the UI to render the loaded messages first
      setTimeout(() => {
        handleSend(autoMsg);
      }, 300);

      // Clear state to prevent resending on reload
      window.history.replaceState({}, document.title);
    }
  }, [conversationId, loading, hasSentDiagnosis, isTyping, location.state]);

  // Global keydown listener for auto-focusing the chat input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't intercept if user is already typing in an input/textarea
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.isContentEditable
      ) {
        return;
      }
      
      // If it's a printable character (length 1) and no modifier keys (Ctrl/Alt/Meta)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Clear chat
  const handleClearChat = async () => {
    if (!conversationId) return;
    setShowMenu(false);

    await supabase
      .from("chat_messages")
      .delete()
      .eq("conversation_id", conversationId);

    // Re-insert greeting
    const greeting = getKomiGreeting(profile?.display_name);
    const { data: greetMsg } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender: "ai",
        content: greeting,
      })
      .select()
      .single();

    setMessages(greetMsg ? [greetMsg] : []);
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const today = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const displayDate = msgDate === today ? t('chat.today') : msgDate;

      if (displayDate !== currentDate) {
        currentDate = displayDate;
        groups.push({ type: "date", date: displayDate });
      }
      groups.push({ type: "message", ...msg });
    });

    return groups;
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const grouped = groupMessagesByDate();

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-120px)] animate-in fade-in duration-500">
      <div className="bg-white dark:bg-komorebi-dark-card rounded-[24px] shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col h-full overflow-hidden transition-colors duration-300">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-komorebi-dark-border shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7FAF8] dark:bg-komorebi-dark-bg flex items-center justify-center border border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300 overflow-hidden">
              <img src={AI_AVATAR_URL} alt="Komi" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-[15px] font-medium text-black dark:text-white font-sans transition-colors duration-300">
                {t('chat.header')}
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-500 font-sans font-medium">
                  {t('chat.online')}
                </span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-komorebi-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-[#32473D] py-1 z-50 min-w-[180px] transition-colors duration-300"
                >
                  <button
                    onClick={handleClearChat}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('chat.clear')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-1 scroll-smooth"
          style={isDarkMode ? {} : {
            backgroundImage: `radial-gradient(circle at 1px 1px, #f0f0f0 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        >
          {loading ? (
            <div className="flex flex-col gap-6 py-6 px-4">
              <div className="flex justify-start">
                <div className="bg-white dark:bg-komorebi-dark-bg rounded-[16px] px-5 py-4 w-[75%] border border-gray-100 dark:border-[#32473D] flex gap-3 shadow-sm">
                   <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                   <div className="flex-1 space-y-3 mt-1">
                     <Skeleton className="w-full h-3" />
                     <Skeleton className="w-4/5 h-3" />
                     <Skeleton className="w-1/2 h-3" />
                   </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#5D8B66]/10 rounded-[16px] rounded-br-[4px] px-5 py-4 w-[60%]">
                   <div className="space-y-3">
                     <Skeleton className="w-full h-3" />
                     <Skeleton className="w-3/4 h-3" />
                   </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white dark:bg-komorebi-dark-bg rounded-[16px] px-5 py-4 w-[70%] border border-gray-100 dark:border-[#32473D] flex gap-3 shadow-sm">
                   <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                   <div className="flex-1 space-y-3 mt-1">
                     <Skeleton className="w-full h-3" />
                     <Skeleton className="w-2/3 h-3" />
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-komorebi-green/30 border-t-komorebi-green rounded-full animate-spin"></div>
                </div>
              )}
              {grouped.map((item, idx) =>
                item.type === "date" ? (
                  <div
                    key={`date-${idx}`}
                    className="flex justify-center py-3"
                  >
                    <span className="text-[11px] text-gray-400 font-sans font-medium bg-white/80 dark:bg-komorebi-dark-bg/80 px-4 py-1.5 rounded-full border border-gray-100 dark:border-[#32473D] shadow-sm transition-colors duration-300">
                      {item.date}
                    </span>
                  </div>
                ) : (
                  <MessageBubble
                    key={item.id}
                    message={item}
                    formatTime={formatTime}
                  />
                )
              )}

              {/* Streaming / Typing indicator */}
              {isTyping && (
                <div className="flex items-start py-1">
                  <div className="bg-white dark:bg-komorebi-dark-bg rounded-[16px] px-5 py-4 max-w-[75%] border border-gray-100 dark:border-[#32473D] shadow-sm flex gap-3 transition-colors duration-300">
                    <div className="shrink-0 pt-0.5">
                      <img src={Logo} alt="Komi" className="w-6 h-6 opacity-50" />
                    </div>
                    {streamingText ? (
                      <p className="text-[14px] text-black dark:text-white font-sans leading-relaxed whitespace-pre-wrap transition-colors duration-300">
                        {streamingText}
                        <span className="inline-block w-1.5 h-4 bg-[#5D8B66] ml-0.5 animate-pulse rounded-sm" />
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1.5 h-full">
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: 0,
                          }}
                          className="w-2 h-2 rounded-full bg-[#5D8B66]/50"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: 0.2,
                          }}
                          className="w-2 h-2 rounded-full bg-[#5D8B66]/50"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: 0.4,
                          }}
                          className="w-2 h-2 rounded-full bg-[#5D8B66]/50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Scroll to bottom FAB */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={() => scrollToBottom()}
              className="absolute bottom-24 right-10 w-9 h-9 bg-white dark:bg-komorebi-dark-card border border-gray-200 dark:border-[#32473D] rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors z-10"
            >
              <ArrowDown className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-komorebi-dark-border shrink-0 bg-white dark:bg-komorebi-dark-card transition-colors duration-300">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                autoFocus
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t('chat.placeholder')}
                rows={1}
                disabled={isTyping}
                className="w-full px-4 py-3 bg-[#F7FAF8] dark:bg-komorebi-dark-bg border border-gray-100 dark:border-[#32473D] rounded-[16px] text-[14px] font-sans text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#5D8B66]/20 focus:border-[#5D8B66]/30 transition-all resize-none overflow-hidden disabled:opacity-60"
              />
            </div>
            
            {/* Mic Button */}
            <button
              onClick={toggleRecording}
              disabled={isTyping}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-md animate-pulse"
                  : "bg-gray-100 dark:bg-komorebi-dark-hover text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5 pointer-events-none" /> : <Mic className="w-5 h-5 pointer-events-none" />}
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                input.trim() && !isTyping
                  ? "bg-[#5D8B66] hover:bg-[#4A7A55] text-white shadow-sm"
                  : "bg-gray-100 dark:bg-komorebi-dark-hover text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-300 text-center mt-2 font-sans">
            {t('chat.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Message Bubble Component
// ═══════════════════════════════════════════
function MessageBubble({ message, formatTime }) {
  const { t } = useTranslation();
  const isUser = message.sender === "user";
  const isDiagnosisCard = isUser && message.content.startsWith("[DIAGNOSIS_SUMMARY]");
  const isActivityCard = isUser && message.content.startsWith("[START_ACTIVITY]");
  const isCustomCard = isDiagnosisCard || isActivityCard;
  
  let displayContent = message.content;
  if (isDiagnosisCard) {
    displayContent = message.content.replace("[DIAGNOSIS_SUMMARY]\n", "");
  } else if (isActivityCard) {
    displayContent = message.content.replace("[START_ACTIVITY]\n", "");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex py-1 ${
        isUser ? "justify-end items-end" : "justify-start items-start"
      }`}
    >
      {/* Bubble */}
      <div
        className={`max-w-[75%] ${isCustomCard ? "p-0 bg-transparent" : "px-5 py-4"} text-[14px] font-sans leading-relaxed relative flex gap-3 transition-colors duration-300 ${
          isUser && !isCustomCard
            ? "bg-[#5D8B66] text-white rounded-[16px] rounded-br-[4px]"
            : !isCustomCard ? "bg-white dark:bg-komorebi-dark-bg text-black dark:text-white rounded-[16px] border border-gray-100 dark:border-[#32473D] shadow-sm" : ""
        }`}
      >
        {/* Komi avatar inside bubble */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-[#F7FAF8] dark:bg-komorebi-dark-bg flex items-center justify-center border border-[#B5CCBD] dark:border-[#43674F] mt-0.5 shrink-0 transition-colors duration-300 overflow-hidden">
            <img src={AI_AVATAR_URL} alt="Komi" className="w-full h-full object-cover opacity-90" />
          </div>
        )}

        <div className="flex flex-col flex-1">
          {isDiagnosisCard ? (
            <div className="bg-[#F7FAF8] dark:bg-komorebi-dark-bg border border-[#5D8B66]/20 rounded-[16px] p-4 text-[#2D4A34] dark:text-[#E8F1E9] shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-2 mb-3 font-semibold border-b border-[#5D8B66]/10 dark:border-[#5D8B66]/30 pb-3 transition-colors duration-300">
                <Brain className="w-5 h-5 text-[#5D8B66]" />
                {t('chat.msg_mindcheck')}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
              <p className="text-[10px] mt-3 text-right text-gray-500 font-medium">
                {formatTime(message.created_at)}
              </p>
            </div>
          ) : isActivityCard ? (
            <div className="bg-[#FFF8EE] dark:bg-[#2A241A] border border-[#EACCA4] dark:border-[#8C5D2C] rounded-[16px] p-4 text-[#8C5D2C] dark:text-[#EACCA4] shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-2 mb-3 font-semibold border-b border-[#EACCA4]/30 dark:border-[#8C5D2C]/50 pb-3 transition-colors duration-300">
                <Activity className="w-5 h-5 text-[#C48943]" />
                {t('chat.msg_activity')}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
              <p className="text-[10px] mt-3 text-right text-[#8C5D2C]/60 font-medium">
                {formatTime(message.created_at)}
              </p>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <p
                className={`text-[10px] mt-1.5 text-right transition-colors duration-300 ${
                  isUser ? "text-white/60" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {formatTime(message.created_at)}
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
