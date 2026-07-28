import { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { Button } from "../ui/Button";

export function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(initialMode === 'recovery');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  // Reset state when modal opens/closes
  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      if (initialMode === 'recovery') {
        setIsResetMode(true);
        setIsLogin(false);
        setIsForgotPassword(false);
      } else {
        setIsLogin(initialMode === 'login');
        setIsResetMode(false);
        setIsForgotPassword(false);
      }
    } else {
      timeoutId = setTimeout(() => {
        setIsLogin(true);
        setIsForgotPassword(false);
        setIsResetMode(false);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setUsername("");
        setDisplayName("");
        setError(null);
        setSuccess(null);
        setShowPassword(false);
        setIsVerificationSent(false);
      }, 300);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, initialMode]);

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
      if (isResetMode) {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        
        await supabase.auth.signOut();
        setSuccess("Password updated! Please login with your new password.");
        setTimeout(() => {
          setIsResetMode(false);
          setIsLogin(true);
          setPassword("");
          setConfirmPassword("");
          setSuccess(null);
          window.location.hash = "";
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 3000);
      } else if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/?type=recovery",
        });
        if (resetError) throw resetError;
        setSuccess("Check your email for the password reset link!");
        setTimeout(() => setIsForgotPassword(false), 3000);
      } else if (isLogin) {
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
        setIsVerificationSent(true);
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
              {isVerificationSent ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center flex flex-col items-center py-4"
                >
                  <div className="w-20 h-20 bg-[#E8F2EA] rounded-full flex items-center justify-center mb-6">
                    <Mail className="w-10 h-10 text-[#5D8B66]" />
                  </div>
                  <h2 className="text-2xl font-heading text-[#5D8B66] mb-3">
                    Periksa Email Anda
                  </h2>
                  <p className="text-gray-500 font-sans text-[15px] mb-8 leading-relaxed">
                    Kami telah mengirimkan tautan verifikasi ke email <br/>
                    <strong className="text-gray-800">{email}</strong>.<br/>
                    <br/>
                    <span className="text-[#D97757] text-[13.5px] font-medium bg-[#FFF4F0] px-4 py-2 rounded-xl inline-flex items-center gap-2 border border-[#F2D7CE]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                      Harap periksa folder Spam jika tidak ada di Inbox
                    </span>
                  </p>
                  <Button 
                    type="button"
                    onClick={() => {
                      setIsVerificationSent(false);
                      setIsLogin(true);
                    }}
                    className="w-full bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-sm hover:brightness-110 text-white py-4 rounded-2xl font-medium text-[16px] transition-all"
                  >
                    Saya Sudah Verifikasi, Login
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div layout="position" className="text-center mb-8">
                    <h2 className="text-3xl font-heading text-[#5D8B66]">
                      {isResetMode ? "Set New Password" : isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Begin Your Journey"}
                    </h2>
                    <p className="text-gray-500 text-sm mt-2 font-sans">
                      {isResetMode ? "Please enter your new password below" : isForgotPassword ? "Enter your email to receive a reset link" : isLogin ? "Sign in to access your secure space" : "Create an account to start feeling better"}
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
                  {!isResetMode && !isForgotPassword && !isLogin && (
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

                {!isResetMode && (
                  <motion.div layout="position" className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      required={!isResetMode}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-[#F4F7F5] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#5D8B66]/30 outline-none transition-all font-sans text-[15px] placeholder:text-gray-400"
                      placeholder="Email Address"
                    />
                  </motion.div>
                )}

                {!isForgotPassword && (
                  <motion.div layout="position" className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required={!isForgotPassword}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-[#F4F7F5] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#5D8B66]/30 outline-none transition-all font-sans text-[15px] placeholder:text-gray-400"
                      placeholder={isResetMode ? "New Password" : "Password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </motion.div>
                )}

                {isResetMode && (
                  <motion.div layout="position" className="relative mt-4">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required={isResetMode}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-[#F4F7F5] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#5D8B66]/30 outline-none transition-all font-sans text-[15px] placeholder:text-gray-400"
                      placeholder="Confirm New Password"
                    />
                  </motion.div>
                )}

                {isLogin && !isForgotPassword && (
                  <motion.div layout="position" className="flex justify-end mt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[#5D8B66] text-[13px] font-medium font-sans hover:underline"
                    >
                      Forgot password?
                    </button>
                  </motion.div>
                )}

                <motion.div layout="position">
                  <Button 
                    type="submit" 
                    className="w-full mt-2 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white py-4 rounded-2xl font-medium text-[16px] transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : (isResetMode ? "Update Password" : isForgotPassword ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account")}
                  </Button>
                </motion.div>
              </form>

              {!isResetMode && (
                <motion.div layout="position" className="mt-8 text-center text-[15px] font-sans text-gray-500">
                  {isForgotPassword ? (
                    <>
                      Remember your password?{" "}
                      <button 
                        type="button" 
                        onClick={() => setIsForgotPassword(false)}
                        className="text-[#5D8B66] font-medium hover:underline transition-all"
                      >
                        Back to sign in
                      </button>
                    </>
                  ) : (
                    <>
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <button 
                        type="button" 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[#5D8B66] font-medium hover:underline transition-all"
                      >
                        {isLogin ? "Sign up here" : "Sign in here"}
                      </button>
                    </>
                  )}
                </motion.div>
              )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
