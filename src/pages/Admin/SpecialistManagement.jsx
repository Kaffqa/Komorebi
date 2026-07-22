import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X,
  MapPin,
  Building2,
  Stethoscope,
  UploadCloud
} from "lucide-react";

const SPECIALIST_TITLES = ["Psikiater", "Psikolog Klinis", "Konsultan Psikiater"];

export default function SpecialistManagement() {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "Psikiater",
    bio: "",
    avatar_url: "",
    rating: "90%",
    experience: "5 Years",
    price: "Rp. 100.000",
    location: "",
    hospital: "",
    phone: "",
    email: "",
    expertise: "",
    status: "Available"
  });

  useEffect(() => {
    fetchSpecialists();
  }, []);

  async function fetchSpecialists() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSpecialists(data || []);
    } catch (error) {
      console.error("Error fetching specialists:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (specialist = null) => {
    if (specialist) {
      setEditingId(specialist.id);
      setFormData({
        ...specialist,
        expertise: Array.isArray(specialist.expertise) ? specialist.expertise.join(", ") : specialist.expertise || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        title: "Psikiater",
        bio: "",
        avatar_url: "",
        rating: "90%",
        experience: "5 Years",
        price: "Rp. 100.000",
        location: "",
        hospital: "",
        phone: "",
        email: "",
        expertise: "",
        status: "Available"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const expertiseArray = formData.expertise
        .split(",")
        .map(e => e.trim())
        .filter(e => e.length > 0);
        
      const payload = {
        ...formData,
        expertise: expertiseArray
      };

      if (editingId) {
        const { error } = await supabase
          .from('specialists')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('specialists')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchSpecialists();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving specialist:", error);
      alert("Failed to save specialist. Check console for details.");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const { error } = await supabase
          .from('specialists')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setSpecialists(specialists.filter(s => s.id !== id));
      } catch (error) {
        console.error("Error deleting specialist:", error);
        alert("Failed to delete specialist");
      }
    }
  };

  const handleImageUpload = async (event) => {
    try {
      setIsUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB to ensure platform speed.");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file (JPEG, PNG, WebP).");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('specialist_avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('specialist_avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: data.publicUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Make sure you have created the 'specialist_avatars' storage bucket.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Available" ? "Unavailable" : "Available";
    try {
      const { error } = await supabase
        .from('specialists')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      
      setSpecialists(specialists.map(s => 
        s.id === id ? { ...s, status: newStatus } : s
      ));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const filteredSpecialists = specialists.filter((s) => 
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 font-sans">Specialist Management</h2>
          <p className="text-[14px] text-gray-500 font-sans mt-1">Manage the Help Page directory</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-[#5D8B66] text-white rounded-xl font-bold font-sans text-[14px] flex items-center gap-2 hover:bg-[#43674F] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Specialist
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search specialists by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#7DA085]/20 font-sans text-[14px]"
          />
        </div>
      </div>

      {/* Specialists Grid */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-[#5D8B66]/30 border-t-[#5D8B66] rounded-full animate-spin"></div>
        </div>
      ) : filteredSpecialists.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-gray-100 shadow-sm border-dashed">
          <Stethoscope className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h3 className="text-[18px] font-bold text-gray-900 font-sans mb-2 tracking-tight">No specialists found</h3>
          <p className="text-[14px] text-gray-500 font-sans">Click 'Add Specialist' to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredSpecialists.map((specialist) => (
            <div key={specialist.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group relative">
              
              {/* Cover & Avatar */}
              <div className="h-28 bg-gradient-to-r from-[#5D8B66]/10 to-[#B5CCBD]/20 relative">
                {/* Status Toggle on Top Right */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => handleToggleStatus(specialist.id, specialist.status)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                      specialist.status === 'Available' ? 'bg-[#5D8B66]' : 'bg-gray-300'
                    }`}
                    title={specialist.status === 'Available' ? "Set as Unavailable" : "Set as Available"}
                  >
                    <span 
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${
                        specialist.status === 'Available' ? 'translate-x-6' : 'translate-x-0'
                      }`} 
                    />
                  </button>
                </div>
              </div>
              
              {/* Profile Details */}
              <div className="px-6 relative flex-1 flex flex-col">
                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg -mt-12 mb-4 mx-auto rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100">
                    <img src={specialist.avatar_url || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face"} alt={specialist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-[18px] font-bold text-gray-900 font-sans leading-tight mb-1" title={specialist.name}>
                    {specialist.name}
                  </h3>
                  <p className="text-[13px] font-bold text-[#5D8B66] uppercase tracking-wider font-sans">{specialist.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                  <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                    <MapPin className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                    <span className="text-[12px] font-medium text-gray-700 font-sans block truncate px-1">{specialist.location || "-"}</span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                    <Building2 className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                    <span className="text-[12px] font-medium text-gray-700 font-sans block truncate px-1">{specialist.hospital || "-"}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pb-6 border-t border-gray-100 pt-6">
                  <button 
                    onClick={() => handleOpenModal(specialist)}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl text-[13px] font-bold transition-colors font-sans flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(specialist.id, specialist.name)}
                    className="w-12 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl z-10 flex flex-col max-h-full overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
                <h3 className="text-[20px] font-bold text-gray-900 font-sans tracking-tight">
                  {editingId ? "Edit Specialist" : "Add New Specialist"}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form id="specialist-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Full Name</label>
                      <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. Dr. Budi Santoso, M.Psi" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Title</label>
                      <select value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all">
                        {SPECIALIST_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Bio</label>
                    <textarea rows="3" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] resize-none transition-all" placeholder="Short biography..." />
                  </div>

                  <div className="mb-6">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Avatar URL</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input 
                          type="url" 
                          value={formData.avatar_url} 
                          onChange={(e) => setFormData({...formData, avatar_url: e.target.value})} 
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all pr-10" 
                          placeholder="https://..." 
                        />
                        {formData.avatar_url && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md overflow-hidden bg-white shadow-sm border border-gray-200">
                            <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          disabled={isUploading}
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          className="h-full px-5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-2xl font-bold font-sans transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50"
                        >
                          {isUploading ? (
                            <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                          ) : (
                            <UploadCloud className="w-5 h-5" />
                          )}
                          <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Rating</label>
                      <input type="text" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. 95%" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Experience</label>
                      <input type="text" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. 10 Years" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Price</label>
                      <input type="text" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. Rp. 150.000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Location</label>
                      <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. Jakarta Selatan" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Hospital / Clinic</label>
                      <input type="text" value={formData.hospital} onChange={(e) => setFormData({...formData, hospital: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. RS Pondok Indah" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Phone</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. +62 812-3456-7890" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Email</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. dr.name@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-sans pl-1">Expertise (Comma separated)</label>
                    <input type="text" value={formData.expertise} onChange={(e) => setFormData({...formData, expertise: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#5D8B66]/30 focus:border-[#5D8B66] font-sans text-[15px] transition-all" placeholder="e.g. Anxiety, Depression, Trauma" />
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-gray-100 flex justify-end gap-4 shrink-0 bg-gray-50/50">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3.5 rounded-2xl text-[14px] font-bold text-gray-600 hover:bg-gray-200 transition-colors font-sans"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="specialist-form"
                  className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-[14px] font-bold transition-all font-sans shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {editingId ? "Save Changes" : "Add Specialist"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
