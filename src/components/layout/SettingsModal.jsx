import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bell, Shield, LogOut, Check, Loader2, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

export function SettingsModal({ isOpen, onClose }) {
  const { user, profile, fetchProfile, signOut } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Form states for Profile
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Image Crop states
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadCroppedImage = async () => {
    if (!user || !croppedAreaPixels || !imageSrc) return;
    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const fileExt = 'jpeg'; // Blob is created as image/jpeg
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      // Asumsikan bucket bernama "avatars" (harus dibuat di dashboard Supabase)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImageBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
      setImageSrc(null); // Close cropper modal
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Gagal mengupload avatar. Pastikan bucket "avatars" sudah dibuat di Supabase Storage dan di-set ke public. Error: ' + error.message);
    } finally {
      setIsUploading(false);
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
    { id: 'profile', label: t('settings.tabs.profile'), icon: User },
    { id: 'preferences', label: t('settings.tabs.preferences'), icon: Bell },
    { id: 'account', label: t('settings.tabs.account'), icon: Shield },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pt-10 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 50 }}
          className="bg-white/95 dark:bg-komorebi-dark-bg/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-4xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(93,139,102,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative z-10 flex flex-col sm:flex-row h-[85vh] sm:h-[600px] mt-auto sm:mt-0 transition-colors duration-300"
        >
          {/* Sidebar Tabs */}
          <div className="w-full sm:w-[280px] shrink-0 bg-gradient-to-b from-[#F9FBF9] to-[#F1F6F3] dark:from-[#1c2620] dark:to-[#141c17] border-b sm:border-b-0 sm:border-r border-[#E5EBE7] dark:border-komorebi-dark-border p-5 sm:p-8 flex flex-col relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#7DA085]/10 dark:from-[#7DA085]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-gray-900 dark:text-white mb-4 sm:mb-8 tracking-tight">{t('settings.title')}</h2>
            <nav className="flex sm:flex-col gap-2 overflow-x-auto scrollbar-hide relative z-10 -mx-5 px-5 sm:mx-0 sm:px-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 sm:w-full flex items-center gap-2 sm:gap-3.5 px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all duration-300 font-sans text-[14px] sm:text-[15px] font-medium ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#5D8B66] to-[#7DA085] text-white shadow-md shadow-[#5D8B66]/20 border border-[#5D8B66] dark:border-[#7DA085]/50' 
                        : 'text-gray-500 dark:text-komorebi-dark-muted hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent sm:hover:shadow-sm'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-5 sm:p-10 overflow-y-auto scrollbar-hide bg-white/50 dark:bg-komorebi-dark-bg/50 relative transition-colors duration-300">
            <button 
              onClick={onClose}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 sm:p-2.5 rounded-full hover:bg-gray-100/80 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mt-2">
                <h3 className="text-[22px] font-bold font-sans text-gray-900 dark:text-white mb-1.5 tracking-tight">{t('settings.profile.title')}</h3>
                <p className="text-gray-500 dark:text-komorebi-dark-muted text-[15px] mb-8 font-light">{t('settings.profile.subtitle')}</p>
                
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[14px] font-medium text-gray-700 dark:text-gray-300">{t('settings.profile.picture')}</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                      <div className="w-20 h-20 rounded-full border-[3px] border-white dark:border-[#2c3a32] shadow-md bg-gradient-to-br from-[#F5F8F6] to-[#E9F0EC] dark:from-[#1c2620] dark:to-[#141c17] overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-[#A8D8B6]" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#5D8B66] animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          type="button" 
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 rounded-xl border border-[#D3E1D7] dark:border-[#2c3a32] text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FBF9] dark:hover:bg-[#233028] hover:border-[#A8D8B6] dark:hover:border-[#5D8B66] transition-all bg-white dark:bg-[#1c2620] shadow-sm disabled:opacity-50"
                        >
                          {t('settings.profile.change_picture')}
                        </button>
                        <p className="text-[12px] text-gray-400 dark:text-gray-500 font-light">{t('settings.profile.picture_hint')}</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={onFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.profile.display_name')}</label>
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-komorebi-dark-border bg-gray-50/50 dark:bg-black/20 focus:bg-white dark:focus:bg-[#1c2620] focus:outline-none focus:ring-4 focus:ring-[#7DA085]/20 focus:border-[#7DA085] transition-all font-sans text-[15px] text-gray-800 dark:text-white"
                        placeholder={t('settings.profile.display_name_placeholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.profile.username')}</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-komorebi-dark-border bg-gray-50/50 dark:bg-black/20 focus:bg-white dark:focus:bg-[#1c2620] focus:outline-none focus:ring-4 focus:ring-[#7DA085]/20 focus:border-[#7DA085] transition-all font-sans text-[15px] text-gray-800 dark:text-white"
                        placeholder={t('settings.profile.username_placeholder')}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className={`w-full py-3.5 rounded-2xl font-body font-light transition-all duration-300 text-[15px] text-white flex items-center justify-center gap-2 ${
                        isSaved
                          ? "bg-gradient-to-r from-[#5D8B66] to-[#7DA085] shadow-sm"
                          : isSaving
                            ? "bg-gray-300 cursor-not-allowed shadow-sm"
                            : "bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110"
                      }`}
                    >
                      {isSaving ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> {t('settings.profile.saving')}</>
                      ) : isSaved ? (
                        <><Check className="w-5 h-5" /> {t('settings.profile.saved')}</>
                      ) : (
                        t('settings.profile.save_changes')
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mt-2 pb-10">
                <h3 className="text-[22px] font-bold font-sans text-gray-900 dark:text-white mb-1.5 tracking-tight">{t('settings.preferences.title')}</h3>
                <p className="text-gray-500 dark:text-komorebi-dark-muted text-[15px] mb-8 font-light">{t('settings.preferences.subtitle')}</p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-komorebi-dark-border shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200 text-[15px]">{t('settings.preferences.daily_reminders')}</p>
                      <p className="text-[13px] text-gray-500 dark:text-komorebi-dark-muted mt-1">{t('settings.preferences.daily_reminders_desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-[#5D8B66] peer-checked:to-[#7DA085] group-hover:after:scale-95"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-komorebi-dark-border shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200 text-[15px]">{t('settings.preferences.dark_mode')}</p>
                      <p className="text-[13px] text-gray-500 dark:text-komorebi-dark-muted mt-1">{t('settings.preferences.dark_mode_desc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isDarkMode}
                        onChange={() => toggleDarkMode()}
                      />
                      <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-[#5D8B66] peer-checked:to-[#7DA085] group-hover:after:scale-95"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-komorebi-dark-border shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200 text-[15px]">{t('settings.preferences.language')}</p>
                      <p className="text-[13px] text-gray-500 dark:text-komorebi-dark-muted mt-1">{t('settings.preferences.language_desc')}</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-[#1c2620] p-1 rounded-xl">
                      <button 
                        onClick={() => i18n.changeLanguage('en')}
                        className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all ${i18n.language === 'en' ? 'bg-white dark:bg-[#32473D] text-[#5D8B66] dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                      >
                        EN
                      </button>
                      <button 
                        onClick={() => i18n.changeLanguage('id')}
                        className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all ${i18n.language === 'id' ? 'bg-white dark:bg-[#32473D] text-[#5D8B66] dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                      >
                        ID
                      </button>
                    </div>
                  </div>

                  <div className="p-5 mt-2 rounded-2xl bg-gradient-to-r from-[#F5F8F6] to-[#E9F0EC] dark:from-[#1c2620] dark:to-[#141c17] border border-[#D3E1D7]/50 dark:border-komorebi-dark-border relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="font-semibold text-gray-900 dark:text-gray-200 text-[15px] mb-1">Tour Platform 🍃</p>
                      <p className="text-[13px] text-gray-600 dark:text-komorebi-dark-muted mb-4 leading-relaxed max-w-[280px]">Tampilkan ulang tur pengenalan fitur platform oleh Komi.</p>
                      <button
                        onClick={() => {
                          onClose();
                          window.dispatchEvent(new Event('restart-tour'));
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#233028] text-[#5D8B66] dark:text-[#7DA085] shadow-sm hover:shadow-md font-medium text-[14px] transition-all border border-[#D3E1D7] dark:border-[#32473D] hover:border-[#A8D8B6] dark:hover:border-[#5D8B66]"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Ulangi Tour Komi
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mt-2">
                <h3 className="text-[22px] font-bold font-sans text-gray-900 dark:text-white mb-1.5 tracking-tight">{t('settings.account.title')}</h3>
                <p className="text-gray-500 dark:text-komorebi-dark-muted text-[15px] mb-8 font-light">{t('settings.account.subtitle')}</p>

                <div className="space-y-4">
                  <div className="p-5 border border-gray-100 dark:border-komorebi-dark-border rounded-2xl bg-white dark:bg-komorebi-dark-card shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[13px] text-gray-500 dark:text-komorebi-dark-muted mb-0.5">{t('settings.account.email')}</p>
                      <p className="font-medium text-[15px] text-gray-900 dark:text-white">{user?.email}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-[#F5F8F6] dark:bg-[#233028] flex items-center justify-center text-[#5D8B66] dark:text-[#7DA085]">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>

                  <button className="w-full text-left px-5 py-4 rounded-2xl border border-gray-200 dark:border-komorebi-dark-border bg-white dark:bg-komorebi-dark-card hover:border-[#D3E1D7] dark:hover:border-[#32473D] hover:bg-[#F9FBF9] dark:hover:bg-[#233028] hover:text-[#5D8B66] dark:hover:text-[#7DA085] font-medium text-[15px] text-gray-700 dark:text-gray-300 transition-all shadow-sm">
                    {t('settings.account.change_password')}
                  </button>

                  <button className="w-full text-left px-5 py-4 rounded-2xl border border-gray-200 dark:border-komorebi-dark-border bg-white dark:bg-komorebi-dark-card hover:border-[#D3E1D7] dark:hover:border-[#32473D] hover:bg-[#F9FBF9] dark:hover:bg-[#233028] hover:text-[#5D8B66] dark:hover:text-[#7DA085] font-medium text-[15px] text-gray-700 dark:text-gray-300 transition-all shadow-sm">
                    {t('settings.account.export_data')}
                  </button>

                  <div className="pt-6 mt-6">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 px-5 py-4 w-full rounded-2xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-medium text-[15px] transition-all shadow-sm border border-red-100 hover:border-red-500"
                    >
                      <LogOut className="w-5 h-5" />
                      {t('settings.account.sign_out')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>

      {/* Cropper Overlay */}
      <AnimatePresence>
        {imageSrc && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-komorebi-dark-bg w-full max-w-md rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative"
            >
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5 relative z-10">
                <h3 className="font-bold text-gray-900 dark:text-white font-sans text-[16px]">{t('settings.profile.adjust_picture', { defaultValue: 'Adjust Picture' })}</h3>
                <button onClick={() => setImageSrc(null)} className="p-2 bg-gray-200/50 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-gray-500 dark:text-gray-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative h-[300px] sm:h-[400px] w-full bg-black/5">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                />
              </div>
              <div className="p-6 flex flex-col gap-6 relative z-10 bg-white dark:bg-komorebi-dark-bg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="w-full accent-[#5D8B66]"
                  />
                </div>
                <button
                  onClick={uploadCroppedImage}
                  disabled={isUploading}
                  className="w-full py-3.5 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:translate-y-[1px] text-white rounded-xl font-medium transition-all flex justify-center items-center gap-2"
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Check className="w-5 h-5" /> Apply & Upload</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
