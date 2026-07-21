import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bell, Shield, LogOut, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router';

export function SettingsModal({ isOpen, onClose }) {
  const { user, profile, fetchProfile, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  // Form states for Profile
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setIsSaved(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username: username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await fetchProfile(user.id);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      // Asumsikan bucket bernama "avatars" (harus dibuat di dashboard Supabase)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Gagal mengupload avatar. Pastikan bucket "avatars" sudah dibuat di Supabase Storage dan di-set ke public. Error: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
      navigate('/');
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'account', label: 'Account', icon: Shield },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col sm:flex-row h-[600px] max-h-[85vh]"
        >
          {/* Sidebar Tabs */}
          <div className="w-full sm:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col">
            <h2 className="text-xl font-bold font-sans text-gray-900 mb-6">Settings</h2>
            <nav className="flex-1 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans text-[14px] font-medium ${
                      isActive 
                        ? 'bg-[#7DA085] text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mt-4">
                <h3 className="text-lg font-bold font-sans text-gray-900 mb-1">Public Profile</h3>
                <p className="text-gray-500 text-sm mb-6">Update your display name and how others see you.</p>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#E5EBE7] border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[#7DA085]" />
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? "Uploading..." : "Change Avatar"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7DA085] focus:ring-2 focus:ring-[#7DA085]/20 outline-none transition-all text-[15px]"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7DA085] focus:ring-2 focus:ring-[#7DA085]/20 outline-none transition-all text-[15px]"
                      placeholder="@username"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="mt-4 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7DA085] hover:bg-[#688A70] text-white rounded-xl font-medium transition-colors disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSaved ? <Check className="w-4 h-4" /> : null)}
                    {isSaving ? "Saving..." : (isSaved ? "Saved Successfully" : "Save Changes")}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mt-4">
                <h3 className="text-lg font-bold font-sans text-gray-900 mb-1">Preferences</h3>
                <p className="text-gray-500 text-sm mb-6">Manage your notifications and app appearance.</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Daily Reminders</p>
                      <p className="text-sm text-gray-500">Get notified to log your mood and journal.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7DA085]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Dark Mode</p>
                      <p className="text-sm text-gray-500">Switch to a darker theme for night time.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7DA085]"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mt-4">
                <h3 className="text-lg font-bold font-sans text-gray-900 mb-1">Account & Security</h3>
                <p className="text-gray-500 text-sm mb-6">Manage your account credentials and data.</p>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>

                  <button className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium text-sm text-gray-700 transition-colors">
                    Change Password
                  </button>

                  <button className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium text-sm text-gray-700 transition-colors">
                    Export My Data
                  </button>

                  <div className="pt-6 mt-6 border-t border-gray-100">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 w-full rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
