import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router";
import {
  Send,
  MoreVertical,
  Trash2,
  Smile,
  Loader2,
  ArrowDown,
  Brain,
  Activity,
} from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { sendMessageToKomi, getKomiGreeting } from "../../services/gemini";
import Logo from "../../assets/logo.svg";

export default function ChatPage() {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasSentDiagnosis, setHasSentDiagnosis] = useState(false);
  
  const location = useLocation();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

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
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch or create conversation & load messages
  const initChat = useCallback(async () => {
    if (!user) return;
    setLoading(true);

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
      return;
    }

    setConversationId(conv.id);

    // Load messages
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    if (msgs && msgs.length > 0) {
      setMessages(msgs);
    } else {
      // First visit: insert Komi's greeting
      const greeting = getKomiGreeting(profile?.display_name);
      const { data: greetMsg } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conv.id,
          sender: "ai",
          content: greeting,
        })
        .select()
        .single();

      if (greetMsg) setMessages([greetMsg]);
    }

    setLoading(false);
    setTimeout(() => scrollToBottom("auto"), 100);
  }, [user, profile]);

  useEffect(() => {
    initChat();
  }, [initChat]);

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
      const history = buildHistory();
      const fullResponse = await sendMessageToKomi(history, text, (chunk) => {
        setStreamingText(chunk);
      });

      // Save AI message
      const { data: aiMsg } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          sender: "ai",
          content: fullResponse,
        })
        .select()
        .single();

      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      let errorMessage = "Maaf, saya sedang mengalami gangguan. Coba kirim pesan Anda lagi ya 🙏";
      if (error?.message?.includes("quota") || error?.status === 429) {
        errorMessage = "Maaf, kuota percakapan gratis (Free Tier) saya saat ini sedang penuh. Mohon tunggu beberapa menit atau coba lagi nanti ya 🙏";
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
  }, [loading, location.state, conversationId, hasSentDiagnosis, isTyping]);

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

      const displayDate = msgDate === today ? "Today" : msgDate;

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
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7FAF8] flex items-center justify-center border border-gray-100">
              <img src={Logo} alt="Komi" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-black font-sans">
                Komi: Your Daily Companion
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-500 font-sans font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 min-w-[180px]"
                >
                  <button
                    onClick={handleClearChat}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Conversation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-1 scroll-smooth"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #f0f0f0 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-[#5D8B66] animate-spin" />
            </div>
          ) : (
            <>
              {grouped.map((item, idx) =>
                item.type === "date" ? (
                  <div
                    key={`date-${idx}`}
                    className="flex justify-center py-3"
                  >
                    <span className="text-[11px] text-gray-400 font-sans font-medium bg-white/80 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
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
                  <div className="bg-white rounded-[16px] px-5 py-4 max-w-[75%] border border-gray-100 shadow-sm flex gap-3">
                    <div className="shrink-0 pt-0.5">
                      <img src={Logo} alt="Komi" className="w-6 h-6 opacity-50" />
                    </div>
                    {streamingText ? (
                      <p className="text-[14px] text-black font-sans leading-relaxed whitespace-pre-wrap">
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
              className="absolute bottom-24 right-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ArrowDown className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
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
                placeholder="Ketik pesan untuk Komi..."
                rows={1}
                disabled={isTyping}
                className="w-full px-4 py-3 bg-[#F7FAF8] border border-gray-100 rounded-[16px] text-[14px] font-sans text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#5D8B66]/20 focus:border-[#5D8B66]/30 transition-all resize-none overflow-hidden disabled:opacity-60"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                input.trim() && !isTyping
                  ? "bg-[#5D8B66] hover:bg-[#4A7A55] text-white shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-300 text-center mt-2 font-sans">
            Komi adalah teman virtual, bukan pengganti konseling profesional.
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
        className={`max-w-[75%] ${isCustomCard ? "p-0 bg-transparent" : "px-5 py-4"} text-[14px] font-sans leading-relaxed relative flex gap-3 ${
          isUser && !isCustomCard
            ? "bg-[#5D8B66] text-white rounded-[16px] rounded-br-[4px]"
            : !isCustomCard ? "bg-white text-black rounded-[16px] border border-gray-100 shadow-sm" : ""
        }`}
      >
        {/* Komi avatar inside bubble */}
        {!isUser && (
          <div className="shrink-0 pt-0.5">
            <img src={Logo} alt="Komi" className="w-6 h-6" />
          </div>
        )}

        <div className="flex flex-col flex-1">
          {isDiagnosisCard ? (
            <div className="bg-[#F7FAF8] border border-[#5D8B66]/20 rounded-[16px] p-4 text-[#2D4A34] shadow-sm">
              <div className="flex items-center gap-2 mb-3 font-semibold border-b border-[#5D8B66]/10 pb-3">
                <Brain className="w-5 h-5 text-[#5D8B66]" />
                Hasil Mind Check-In
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
              <p className="text-[10px] mt-3 text-right text-gray-500 font-medium">
                {formatTime(message.created_at)}
              </p>
            </div>
          ) : isActivityCard ? (
            <div className="bg-[#FFF8EE] border border-[#EACCA4] rounded-[16px] p-4 text-[#8C5D2C] shadow-sm">
              <div className="flex items-center gap-2 mb-3 font-semibold border-b border-[#EACCA4]/30 pb-3">
                <Activity className="w-5 h-5 text-[#C48943]" />
                Mulai Aktivitas
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
                className={`text-[10px] mt-1.5 text-right ${
                  isUser ? "text-white/60" : "text-gray-400"
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
