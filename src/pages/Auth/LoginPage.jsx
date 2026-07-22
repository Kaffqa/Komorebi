import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../services/supabase";
import { Button } from "../../components/ui/Button";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await signIn(email, password);
        
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
    <div className="min-h-screen bg-komorebi-cream flex items-center justify-center p-6">
      <Link to="/" className="absolute top-6 left-6 text-komorebi-green font-bold text-xl">
        Komorebi
      </Link>
      
      <div className="w-full max-w-md">
        <motion.div 
          layout
          className="glass-panel p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading text-komorebi-green">
              {isLogin ? "Selamat Datang" : "Mulai Jurnalmu"}
            </h1>
            <p className="text-komorebi-dark/70 mt-2">
              {isLogin ? "Masuk ke ruang amanmu" : "Daftar untuk memulai perjalananmu"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-[#F4F7F5] text-[#5D8B66] border border-[#5D8B66]/30 rounded-lg text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-komorebi-dark mb-1">Username</label>
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-komorebi-green focus:border-transparent outline-none transition-all"
                      placeholder="e.g., alex_123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-komorebi-dark mb-1">Nama Panggilan</label>
                    <input 
                      type="text" 
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-komorebi-green focus:border-transparent outline-none transition-all"
                      placeholder="Alex"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-komorebi-dark mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-komorebi-green focus:border-transparent outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-komorebi-dark mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-komorebi-green focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white py-3 rounded-2xl font-medium text-[16px] transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-komorebi-dark/70">
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-komorebi-green font-medium hover:underline"
            >
              {isLogin ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
