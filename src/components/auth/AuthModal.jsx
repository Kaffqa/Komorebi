import { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { Button } from "../ui/Button";

export function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setUsername("");
        setDisplayName("");
        setError(null);
        setSuccess(null);
        setShowPassword(false);
      }, 300);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await signIn(email, password);
        onClose();
        
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profile?.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        await signUp(email, password, username, displayName);
        setIsLogin(true);
        setSuccess("Account created successfully! Please sign in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
          />
          
          {/* Modal Content */}
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[420px] bg-[#FDFBF7] rounded-[32px] shadow-2xl overflow-hidden border border-white/50"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors text-gray-500 z-10"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="p-8 sm:p-10">
              <motion.div layout="position" className="text-center mb-8">
                <h2 className="text-3xl font-heading text-[#5D8B66]">
                  {isLogin ? "Welcome Back" : "Begin Your Journey"}
                </h2>
                <p className="text-gray-500 text-sm mt-2 font-sans">
                  {isLogin ? "Sign in to access your secure space" : "Create an account to start feeling better"}
                </p>
              </motion.div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-sans text-center border border-red-100"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-[#F4F7F5] text-[#5D8B66] rounded-2xl text-sm font-sans text-center border border-[#5D8B66]/30"
                >
                  {success}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                      exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          required={!isLogin}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-12 pr-5 py-4 bg-[#F4F7F5] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#5D8B66]/30 outline-none transition-all font-sans text-[15px] placeholder:text-gray-400"
                          placeholder="Username"
                        />
                      </div>
                      <div className="relative">
                        <Smile className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          required={!isLogin}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full pl-12 pr-5 py-4 bg-[#F4F7F5] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#5D8B66]/30 outline-none transition-all font-sans text-[15px] placeholder:text-gray-400"
                          placeholder="Display Name"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div layout="position" className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-[#F4F7F5] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#5D8B66]/30 outline-none transition-all font-sans text-[15px] placeholder:text-gray-400"
                    placeholder="Email Address"
                  />
                </motion.div>

                <motion.div layout="position" className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-[#F4F7F5] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#5D8B66]/30 outline-none transition-all font-sans text-[15px] placeholder:text-gray-400"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </motion.div>

                <motion.div layout="position">
                  <Button 
                    type="submit" 
                    className="w-full mt-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white py-4 rounded-2xl font-medium text-[16px] transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                  </Button>
                </motion.div>
              </form>

              <motion.div layout="position" className="mt-8 text-center text-[15px] font-sans text-gray-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#5D8B66] font-medium hover:underline transition-all"
                >
                  {isLogin ? "Sign up here" : "Sign in here"}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
