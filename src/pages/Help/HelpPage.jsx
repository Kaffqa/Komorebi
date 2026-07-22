import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ThumbsUp, Briefcase, X, MapPin, Shield, Phone, Mail, ExternalLink } from "lucide-react";

const SPECIALISTS = [
  {
    id: 1,
    name: "Dr. Rina Kusuma, Sp.KJ",
    title: "Psikiater",
    rating: "98%",
    experience: "15 Years",
    status: "Available",
    price: "Rp. 500.000",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&h=400&fit=crop&crop=face",
    expertise: ["Anxiety & Trauma Specialist", "Work-Life Balance", "Resilience Training", "Chronic Stress"],
    phone: "+62 812-3456-7890",
    email: "dr.rina@example.com",
    location: "Jakarta Selatan",
    hospital: "RS Pondok Indah",
    bio: "Dr. Rina Kusuma adalah psikiater bersertifikat dengan pengalaman lebih dari 15 tahun dalam menangani gangguan kecemasan, depresi, dan trauma. Beliau menerapkan pendekatan holistik yang menggabungkan terapi farmakologi dengan psikoterapi untuk hasil yang optimal.",
  },
  {
    id: 2,
    name: "Dr. Budi Santoso, M.Psi",
    title: "Psikolog Klinis",
    rating: "95%",
    experience: "12 Years",
    status: "Available",
    price: "Rp. 400.000",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&h=400&fit=crop&crop=face",
    expertise: ["Cognitive Behavioral Therapy", "Stress Management", "Self Improvement"],
    phone: "+62 813-9876-5432",
    email: "dr.budi@example.com",
    location: "Jakarta Pusat",
    hospital: "Klinik Jiwa Sehat",
    bio: "Dr. Budi Santoso adalah psikolog klinis yang berfokus pada Cognitive Behavioral Therapy (CBT). Beliau membantu klien mengidentifikasi dan mengubah pola pikir negatif yang memengaruhi emosi dan perilaku mereka.",
  },
  {
    id: 3,
    name: "Dr. Sari Dewi, Sp.KJ(K)",
    title: "Konsultan Psikiater",
    rating: "99%",
    experience: "20 Years",
    status: "Available",
    price: "Rp. 800.000",
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=500&h=400&fit=crop&crop=face",
    expertise: ["Child & Adolescent Psychiatry", "Autism", "ADHD"],
    phone: "+62 811-2233-4455",
    email: "dr.sari@example.com",
    location: "Bandung",
    hospital: "RS Hasan Sadikin",
    bio: "Dr. Sari Dewi adalah konsultan psikiater senior yang mengkhususkan diri dalam psikiatri anak dan remaja. Dengan pengalaman 20 tahun, beliau menangani berbagai permasalahan perkembangan mental anak.",
  },
  {
    id: 4,
    name: "Dr. Arief Wicaksono, M.Psi",
    title: "Psikolog Klinis",
    rating: "92%",
    experience: "10 Years",
    status: "Available",
    price: "Rp. 350.000",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&h=400&fit=crop&crop=face",
    expertise: ["Trauma & Grief Counseling", "Mindfulness", "Emotional Regulation"],
    phone: "+62 856-7890-1234",
    email: "dr.arief@example.com",
    location: "Yogyakarta",
    hospital: "Klinik Sejiwa",
    bio: "Dr. Arief Wicaksono adalah psikolog klinis yang berfokus pada trauma dan proses berduka. Beliau menggunakan pendekatan EMDR dan mindfulness-based therapy untuk membantu klien melewati pengalaman traumatis.",
  },
  {
    id: 5,
    name: "Dr. Maya Putri, Sp.KJ",
    title: "Psikiater",
    rating: "96%",
    experience: "14 Years",
    status: "Available",
    price: "Rp. 600.000",
    avatar: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=500&h=400&fit=crop&crop=face",
    expertise: ["Bipolar", "Mood Disorders", "Depression"],
    phone: "+62 878-5566-7788",
    email: "dr.maya@example.com",
    location: "Surabaya",
    hospital: "RS Siloam Surabaya",
    bio: "Dr. Maya Putri adalah psikiater yang berpengalaman menangani gangguan bipolar dan gangguan mood lainnya. Beliau menerapkan pendekatan berbasis bukti dalam perawatan psikiatri dan sangat terampil dalam manajemen obat.",
  },
  {
    id: 6,
    name: "Dr. Hendra Wijaya, M.Psi",
    title: "Psikolog Klinis",
    rating: "94%",
    experience: "8 Years",
    status: "Available",
    price: "Rp. 300.000",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&h=400&fit=crop&crop=face",
    expertise: ["Addiction", "Recovery", "Group Therapy"],
    phone: "+62 821-9988-7766",
    email: "dr.hendra@example.com",
    location: "Semarang",
    hospital: "Klinik Pulih Sehat",
    bio: "Dr. Hendra Wijaya adalah psikolog klinis yang fokus pada masalah kecanduan dan pemulihan. Beliau menggunakan terapi motivasi dan program 12 langkah yang telah terbukti efektif.",
  },
];

const FILTER_OPTIONS = ["All", "Psikiater", "Psikolog Klinis", "Konsultan Psikiater", "In Your Area", "Online Session"];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  
  // Sort State
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeSort, setActiveSort] = useState("Default");

  const filteredSpecialists = SPECIALISTS.filter((s) => {
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter logic based on role
    let matchesFilter = true;
    if (activeFilter !== "All" && activeFilter !== "In Your Area" && activeFilter !== "Online Session") {
      matchesFilter = s.title === activeFilter;
    }
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (activeSort === "Highest Rating") {
      return parseInt(b.rating) - parseInt(a.rating);
    }
    if (activeSort === "Most Experienced") {
      return parseInt(b.experience) - parseInt(a.experience);
    }
    if (activeSort === "Lowest Price") {
      const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
      const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
      return priceA - priceB;
    }
    return 0; // Default
  });

  return (
    <div className="w-full pb-20 animate-in fade-in duration-500">
      
      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 mb-6 flex items-center shadow-sm border border-gray-100/50">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Search Doctor"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-gray-700 font-sans text-[15px] placeholder:text-gray-400"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {FILTER_OPTIONS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative whitespace-nowrap px-6 py-2 rounded-full border text-[13px] font-medium transition-colors font-sans overflow-hidden shrink-0 ${
                  isActive
                    ? "text-white border-transparent"
                    : "bg-white border-[#B5CCBD] text-gray-600 hover:bg-gray-50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeHelpFilter"
                    className="absolute inset-[-1px] bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{filter}</span>
              </button>
            );
          })}
        </div>
        
        <div className="relative shrink-0 pb-2">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#B5CCBD] bg-white hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          </button>

          <AnimatePresence>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-2"
                >
                  <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans border-b border-gray-50 mb-1">
                    Sort By
                  </div>
                  {["Default", "Highest Rating", "Most Experienced", "Lowest Price"].map((sortOption) => (
                    <button
                      key={sortOption}
                      onClick={() => {
                        setActiveSort(sortOption);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors font-sans ${
                        activeSort === sortOption ? "text-[#5D8B66] bg-[#7DA085]/10" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {sortOption}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Specialist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSpecialists.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-sans">No specialists found.</p>
          </div>
        ) : (
          filteredSpecialists.map((specialist, idx) => (
            <motion.div
              key={specialist.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedSpecialist(specialist)}
              className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all cursor-pointer group flex flex-col"
            >
              {/* Image */}
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-4 shrink-0">
                <img
                  src={specialist.avatar}
                  alt={specialist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 px-1">
                <h3 className="text-[17px] font-bold text-gray-900 font-sans leading-tight mb-1">
                  {specialist.name}
                </h3>
                <p className="text-[13px] text-gray-500 font-sans mb-5">
                  {specialist.title}
                </p>

                {/* Meta row */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] bg-white text-[11px] font-medium text-gray-600 font-sans">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {specialist.rating}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] bg-white text-[11px] font-medium text-gray-600 font-sans">
                      <Briefcase className="w-3.5 h-3.5" />
                      {specialist.experience}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 font-sans">
                    <div className="w-2 h-2 rounded-full bg-[#5D8B66]"></div>
                    {specialist.status}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Specialist Detail Modal */}
      <AnimatePresence>
        {selectedSpecialist && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedSpecialist(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] w-full max-w-[450px] p-5 shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedSpecialist(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-20 backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Image */}
                <div className="w-full h-[220px] rounded-2xl overflow-hidden bg-gray-100 mb-5 relative shrink-0">
                  <img
                    src={selectedSpecialist.avatar}
                    alt={selectedSpecialist.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Header: Name & Price */}
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-[18px] font-bold text-gray-900 font-sans leading-tight pr-4">
                    {selectedSpecialist.name}
                  </h2>
                  <span className="text-[13px] font-semibold text-[#5D8B66] font-sans pt-1 shrink-0">
                    {selectedSpecialist.price}
                  </span>
                </div>
                
                <p className="text-[13px] text-gray-500 font-sans mb-4">
                  {selectedSpecialist.title}
                </p>

                {/* Meta row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] bg-white text-[11px] font-medium text-gray-600 font-sans">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {selectedSpecialist.rating}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] bg-white text-[11px] font-medium text-gray-600 font-sans">
                      <Briefcase className="w-3.5 h-3.5" />
                      {selectedSpecialist.experience}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#5D8B66] font-sans">
                    <div className="w-2 h-2 rounded-full bg-[#5D8B66]"></div>
                    {selectedSpecialist.status}
                  </div>
                </div>

                {/* Bio & Details (From previous implementation) */}
                <div className="mb-5 space-y-4">
                  <p className="text-[13px] text-gray-600 font-sans leading-relaxed">
                    {selectedSpecialist.bio}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide font-sans">Lokasi</span>
                      </div>
                      <p className="text-[12px] font-semibold text-gray-800 font-sans">{selectedSpecialist.location}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide font-sans">Klinik/RS</span>
                      </div>
                      <p className="text-[12px] font-semibold text-gray-800 font-sans truncate">{selectedSpecialist.hospital}</p>
                    </div>
                  </div>
                </div>

                {/* Area of Expertise */}
                <div className="mb-6">
                  <p className="text-[13px] text-gray-700 font-bold font-sans mb-3">
                    Area of Expertise
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecialist.expertise.map((exp) => (
                      <span key={exp} className="px-3 py-1.5 rounded-full border border-[#B5CCBD] bg-white text-[11px] font-medium text-gray-600 font-sans">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Buttons (Enhanced from previous design) */}
                <div className="flex flex-col gap-2.5 mt-auto">
                  <a
                    href={`tel:${selectedSpecialist.phone}`}
                    className="w-full py-3 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white rounded-full text-[13px] font-semibold transition-all duration-300 font-sans flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Hubungi Sekarang
                  </a>
                  <div className="flex gap-2.5">
                    <a
                      href={`mailto:${selectedSpecialist.email}`}
                      className="flex-1 py-3 border border-[#B5CCBD] bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[13px] font-semibold transition-colors font-sans flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                    <a
                      href={`https://wa.me/${selectedSpecialist.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 border border-[#B5CCBD] bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[13px] font-semibold transition-colors font-sans flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
