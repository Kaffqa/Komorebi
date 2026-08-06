import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ThumbsUp, Briefcase, X, MapPin, Shield, Phone, LocateFixed, Navigation, ChevronDown } from "lucide-react";
import { supabase } from "../../services/supabase";
import { Skeleton } from "../../components/ui/Skeleton";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import useToastStore from "../../stores/useToastStore";

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Markers to match theme
const createMarkerIcon = (bgColor) => L.divIcon({
  className: 'custom-pin',
  html: `<div style="
    background-color: ${bgColor};
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const specialistMarkerIcon = createMarkerIcon('#5D8B66'); // Primary Theme Green

// Pulsing dot for user
const userMarkerIcon = L.divIcon({
  className: 'user-location-dot',
  html: `<div style="
    width: 16px;
    height: 16px;
    background-color: #5D8B66;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 0 rgba(93, 139, 102, 0.7);
    animation: pulse-green 2s infinite;
  "></div>
  <style>
    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(93, 139, 102, 0.7); }
      70% { box-shadow: 0 0 0 12px rgba(93, 139, 102, 0); }
      100% { box-shadow: 0 0 0 0 rgba(93, 139, 102, 0); }
    }
  </style>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});

// Helper function for distance calculation
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const aVal = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1-aVal));
  return R * c;
};

// Routing Component
function MapRouting({ source, destination }) {
  const map = useMap();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!source || !destination || !map) return;
    
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(source.lat, source.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: false,
      lineOptions: {
        styles: [{ color: "#5D8B66", weight: 5, opacity: 0.8 }]
      },
      createMarker: function() { return null; } // Cegah marker ganda dari OSRM
    }).addTo(map);

    // Error handling jika rute tidak ditemukan
    routingControl.on('routingerror', function(e) {
      console.warn("Routing error:", e.error);
      addToast("Maaf, rute darat tidak ditemukan atau server navigasi sedang sibuk. Peta akan kembali menampilkan garis lurus.", "error");
    });

    // Zoom peta secara manual dan presisi ke titik User & Dokter
    const bounds = L.latLngBounds([
      [source.lat, source.lng],
      [destination.lat, destination.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    const container = routingControl.getContainer();
    if (container) {
      container.style.display = 'none';
    }

    return () => {
      try {
        if (routingControl) {
          // Clear waypoints to abort any pending OSRM requests and prevent async draw errors
          const plan = routingControl.getPlan();
          if (plan) plan.setWaypoints([]);
          map.removeControl(routingControl);
        }
      } catch (e) {
        console.warn("Safe cleanup routing:", e);
      }
    };
  }, [map, source, destination]);

  return null;
}

// Komponen Tombol Recenter
function MapRecenterButton({ location }) {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.flyTo([location.lat, location.lng], 13, { duration: 1.5 });
        }}
        className="bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-komorebi-dark-border shadow-lg rounded-full w-11 h-11 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#5D8B66] dark:hover:text-[#7DA085] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
        title="Kembali ke Lokasi Saya"
      >
        <LocateFixed className="w-5 h-5" />
      </button>
    </div>
  );
}

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
    lat: -6.261493,
    lng: 106.810600,
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
    lat: -6.180511,
    lng: 106.828383,
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
    lat: -6.914744,
    lng: 107.609810,
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
    lat: -7.797068,
    lng: 110.370529,
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
    lat: -7.250445,
    lng: 112.768845,
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
    lat: -6.966667,
    lng: 110.416664,
    hospital: "Klinik Pulih Sehat",
    bio: "Dr. Hendra Wijaya adalah psikolog klinis yang fokus pada masalah kecanduan dan pemulihan. Beliau menggunakan terapi motivasi dan program 12 langkah yang telah terbukti efektif.",
  },
];

const FILTER_OPTIONS = ["All", "In Your Area", "Psikiater", "Psikolog Klinis", "Konsultan Psikiater", "Online Session"];

export default function HelpPage() {
  const { t } = useTranslation();
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeTarget, setRouteTarget] = useState(null);
  
  // Sort State
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeSort, setActiveSort] = useState("Default");
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Geolocation effect for "In Your Area"
  useEffect(() => {
    if (activeFilter === "In Your Area") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;
            
            // Safety Check: If the browser's IP/VPN throws the user outside of Indonesia (e.g. to China/Korea)
            // we will force the location to Surakarta for this demo so the map doesn't break.
            // Indonesia is roughly between lat 6 to -11 and lng 95 to 141.
            if (lat > 6 || lat < -11 || lng < 95 || lng > 141) {
              lat = -7.556111; // Surakarta
              lng = 110.831667;
            }

            setUserLocation({ lat, lng });
          },
          (error) => {
            console.error("Error getting location:", error);
            // Default to Surakarta if blocked
            setUserLocation({ lat: -7.556111, lng: 110.831667 });
          }
        );
      } else {
        setUserLocation({ lat: -7.556111, lng: 110.831667 });
      }
    } else {
      // Optional: reset user location when filter changes
      setRouteTarget(null);
    }
  }, [activeFilter]);

  useEffect(() => {
    async function fetchSpecialists() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('specialists')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Merge mock coordinates if DB lacks lat/lng
          const mergedData = data.map(dbSpecialist => {
            if (!dbSpecialist.lat || !dbSpecialist.lng) {
              const mock = SPECIALISTS.find(m => m.name === dbSpecialist.name);
              if (mock) {
                return { ...dbSpecialist, lat: mock.lat, lng: mock.lng };
              }
            }
            return dbSpecialist;
          });
          setSpecialists(mergedData);
        } else {
          setSpecialists(SPECIALISTS); // Fallback to hardcoded if DB is empty
        }
      } catch (error) {
        console.error("Error fetching specialists:", error);
        setSpecialists(SPECIALISTS); // Fallback on error
      } finally {
        setLoading(false);
      }
    }

    fetchSpecialists();
  }, []);

  const RADIUS_LIMIT_KM = 50;
  let isOutOfRadiusFallback = false;

  let baseFiltered = specialists.filter((s) => {
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter logic based on role
    let matchesFilter = true;
    if (activeFilter !== "All" && activeFilter !== "In Your Area" && activeFilter !== "Online Session") {
      matchesFilter = s.title === activeFilter;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (activeFilter === "In Your Area" && userLocation) {
    const withinRadius = baseFiltered.filter(s => {
      if (!s.lat) return false;
      const dist = getDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);
      return dist <= RADIUS_LIMIT_KM;
    });

    if (withinRadius.length > 0) {
      baseFiltered = withinRadius;
    } else {
      isOutOfRadiusFallback = true;
    }
  }

  const filteredSpecialists = baseFiltered.sort((a, b) => {
    if (activeFilter === "In Your Area" && userLocation && a.lat && b.lat) {
      // Sort by distance if In Your Area is selected
      const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    }

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
      <div className="bg-white dark:bg-komorebi-dark-card rounded-2xl p-4 mb-6 flex items-center shadow-sm border border-gray-100/50 dark:border-komorebi-dark-border transition-colors duration-300">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Search Doctor"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 font-sans text-[15px] placeholder:text-gray-400 transition-colors duration-300"
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
                    : "bg-white dark:bg-komorebi-dark-bg border-[#B5CCBD] dark:border-[#32473D] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black/20"
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
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#B5CCBD] dark:border-[#32473D] bg-white dark:bg-komorebi-dark-bg hover:bg-gray-50 dark:hover:bg-black/20 transition-colors"
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
                  className="absolute right-0 top-full mt-0 w-48 bg-white dark:bg-komorebi-dark-card border border-gray-100 dark:border-komorebi-dark-border rounded-xl shadow-lg z-50 py-2 transition-colors duration-300"
                >
                  <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider font-sans border-b border-gray-50 dark:border-komorebi-dark-border mb-1 transition-colors duration-300">
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
                        activeSort === sortOption ? "text-[#5D8B66] dark:text-[#7DA085] bg-[#7DA085]/10" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
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

      {/* Alert Banner for Out of Radius Fallback */}
      {activeFilter === "In Your Area" && isOutOfRadiusFallback && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl flex items-start gap-3 transition-colors duration-300"
        >
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full shrink-0 text-orange-600 dark:text-orange-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-orange-800 dark:text-orange-300 font-sans mb-1">{t('helpPage.outOfRange')}</h4>
            <p className="text-[13px] text-orange-700 dark:text-orange-400/90 font-sans leading-relaxed">
              {t('helpPage.outOfRangeDesc', { radius: RADIUS_LIMIT_KM })}
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      {activeFilter === "In Your Area" ? (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500">
          {/* Map View - Responsive Height */}
          <div className="w-full lg:flex-1 h-[280px] sm:h-[350px] lg:h-[550px] rounded-2xl overflow-hidden border border-gray-100 dark:border-komorebi-dark-border shadow-sm bg-gray-50 dark:bg-komorebi-dark-card shrink-0 relative transition-all duration-300">
            
            {/* Clear Route Button Overlay */}
            <AnimatePresence>
              {routeTarget && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]"
                >
                  <button 
                    onClick={() => setRouteTarget(null)}
                    className="bg-white dark:bg-komorebi-dark-card border border-gray-200 dark:border-komorebi-dark-border shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-full px-5 py-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-sans active:scale-95"
                  >
                    <X className="w-4 h-4" />
                    Hapus Rute
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {userLocation ? (
              <MapContainer 
                center={[userLocation.lat, userLocation.lng]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* User Location Marker */}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon}>
                  <Popup>Lokasi Anda Saat Ini</Popup>
                </Marker>

                {/* Draw Route if Target exists */}
                {routeTarget && (
                  <MapRouting source={userLocation} destination={routeTarget} />
                )}

                {/* Recenter Button */}
                <MapRecenterButton location={userLocation} />

                {/* Specialist Markers */}
                {filteredSpecialists.map((specialist) => (
                  specialist.lat && specialist.lng && (
                    <Marker 
                      key={specialist.id} 
                      position={[specialist.lat, specialist.lng]}
                      icon={specialistMarkerIcon}
                      eventHandlers={{
                        click: () => {
                          setSelectedSpecialist(specialist);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-center font-sans">
                          <strong className="block mb-1">{specialist.name}</strong>
                          <span className="text-sm text-gray-500">{specialist.hospital}</span>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-4 animate-bounce" />
                <p className="text-gray-500 dark:text-gray-400 font-sans">Menunggu akses lokasi...</p>
              </div>
            )}
          </div>

          {/* List View inside Split */}
          <div className="w-full lg:w-[480px] shrink-0 h-[500px] lg:h-[550px] bg-white dark:bg-komorebi-dark-card rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-komorebi-dark-border flex flex-col relative transition-colors duration-300">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-sans font-semibold text-black dark:text-white transition-colors duration-300">
                {t('helpPage.nearbySpecialists')}
              </h3>
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-0 overflow-y-auto pr-1 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex flex-col gap-4">
                  {filteredSpecialists.map((specialist, idx) => {
                const distance = (userLocation && specialist.lat) 
                  ? getDistance(userLocation.lat, userLocation.lng, specialist.lat, specialist.lng).toFixed(1)
                  : null;

                return (
                <motion.div
                  key={specialist.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedSpecialist(specialist)}
                  className="bg-white dark:bg-komorebi-dark-card rounded-[20px] p-4 border border-gray-100 dark:border-komorebi-dark-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all cursor-pointer group flex flex-col duration-300"
                >
                  <div className="flex gap-4 mb-3">
                    <div className="w-[80px] h-[80px] rounded-xl overflow-hidden bg-gray-100 dark:bg-komorebi-dark-bg shrink-0 transition-colors duration-300">
                      <img
                        src={specialist.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${specialist.name}`}
                        alt={specialist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-[15px] font-bold text-gray-900 dark:text-white font-sans leading-tight mb-1 transition-colors duration-300 line-clamp-1">
                        {specialist.name}
                      </h3>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 font-sans mb-1 transition-colors duration-300">
                        {specialist.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#5D8B66] font-sans">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5D8B66]"></div>
                        {specialist.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-[10px] font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
                      <MapPin className="w-3 h-3" />
                      {specialist.location}
                    </div>
                    {distance && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#5D8B66] dark:text-[#7DA085] font-sans">
                        <Navigation className="w-3 h-3" /> {distance} km
                      </span>
                    )}
                  </div>
                </motion.div>
                )})}
              </div>
            </div>
            
            {/* Scroll Indicator */}
            {filteredSpecialists.length > 2 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-komorebi-dark-card to-transparent pointer-events-none flex items-end justify-center pb-1 z-10 rounded-b-[24px]">
                <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full p-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-1 animate-bounce border border-gray-100 dark:border-gray-700">
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-komorebi-dark-card rounded-[20px] p-4 border border-gray-100 dark:border-komorebi-dark-border shadow-sm flex flex-col h-[320px]">
                  <Skeleton className="w-full h-[180px] rounded-xl mb-4" />
                  <Skeleton className="w-48 h-5 mb-2" />
                  <Skeleton className="w-32 h-4 mb-4" />
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-2">
                      <Skeleton className="w-16 h-8 rounded-full" />
                      <Skeleton className="w-20 h-8 rounded-full" />
                    </div>
                    <Skeleton className="w-16 h-4" />
                  </div>
                </div>
              ))}
            </>
          ) : filteredSpecialists.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-komorebi-dark-card rounded-2xl border border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300">
              <Search className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
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
                className="bg-white dark:bg-komorebi-dark-card rounded-[20px] p-4 border border-gray-100 dark:border-komorebi-dark-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all cursor-pointer group flex flex-col duration-300"
              >
                {/* Image */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-komorebi-dark-bg mb-4 shrink-0 transition-colors duration-300">
                  <img
                    src={specialist.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${specialist.name}`}
                    alt={specialist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 px-1">
                  <h3 className="text-[17px] font-bold text-gray-900 dark:text-white font-sans leading-tight mb-1 transition-colors duration-300">
                    {specialist.name}
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 font-sans mb-5 transition-colors duration-300">
                    {specialist.title}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-[11px] font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {specialist.rating}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-[11px] font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
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
      )}

      {/* Specialist Detail Modal */}
      <AnimatePresence>
        {selectedSpecialist && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedSpecialist(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-komorebi-dark-card rounded-[24px] w-full max-w-[450px] p-5 shadow-2xl relative z-10 flex flex-col max-h-[90vh] transition-colors duration-300"
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
                <div className="w-full h-[220px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-komorebi-dark-bg mb-5 relative shrink-0 transition-colors duration-300">
                  <img
                    src={selectedSpecialist.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${selectedSpecialist.name}`}
                    alt={selectedSpecialist.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Header: Name & Price */}
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white font-sans leading-tight pr-4 transition-colors duration-300">
                    {selectedSpecialist.name}
                  </h2>
                  <span className="text-[13px] font-semibold text-[#5D8B66] dark:text-[#7DA085] font-sans pt-1 shrink-0 transition-colors duration-300">
                    {selectedSpecialist.price}
                  </span>
                </div>
                
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-sans mb-4 transition-colors duration-300">
                  {selectedSpecialist.title}
                </p>

                {/* Meta row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-[11px] font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {selectedSpecialist.rating}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-[11px] font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
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
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 font-sans leading-relaxed transition-colors duration-300">
                    {selectedSpecialist.bio}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-komorebi-dark-bg rounded-xl p-3 border border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide font-sans">Lokasi</span>
                      </div>
                      <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">{selectedSpecialist.location}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-komorebi-dark-bg rounded-xl p-3 border border-gray-100 dark:border-komorebi-dark-border transition-colors duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide font-sans">Klinik/RS</span>
                      </div>
                      <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 font-sans truncate transition-colors duration-300">{selectedSpecialist.hospital}</p>
                    </div>
                  </div>
                </div>

                {/* Area of Expertise */}
                <div className="mb-6">
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 font-bold font-sans mb-3 transition-colors duration-300">
                    Area of Expertise
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecialist.expertise.map((exp) => (
                      <span key={exp} className="px-3 py-1.5 rounded-full border border-[#B5CCBD] dark:border-[#43674F] bg-white dark:bg-[#32473D] text-[11px] font-medium text-gray-600 dark:text-gray-300 font-sans transition-colors duration-300">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Buttons (Enhanced from previous design) */}
                <div className="flex flex-col gap-2.5 mt-auto">
                  <button
                    onClick={() => {
                      setSelectedSpecialist(null);
                      setShowComingSoon(true);
                    }}
                    className="w-full py-3 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white rounded-full text-[13px] font-semibold transition-all duration-300 font-sans flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Jadwalkan Konsultasi
                  </button>

                  {/* Directions Button (Only show if location is available) */}
                  {selectedSpecialist.lat && (
                    <button
                      onClick={() => {
                        setRouteTarget(selectedSpecialist);
                        setActiveFilter("In Your Area");
                        setSelectedSpecialist(null);
                      }}
                      className="w-full py-3 bg-[#EAF0EC] border border-[#B5CCBD] hover:bg-[#D4E2D8] active:scale-[0.99] text-[#32473D] rounded-full text-[13px] font-bold transition-all duration-300 font-sans flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Lihat Rute Perjalanan
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComingSoon && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowComingSoon(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[400px] bg-white dark:bg-komorebi-dark-card rounded-[24px] shadow-2xl p-6 md:p-8 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-16 h-16 rounded-full bg-[#5D8B66]/10 flex items-center justify-center mb-5">
                <div className="text-[#5D8B66]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold font-sans text-gray-800 dark:text-white mb-3">
                {t('helpPage.comingSoon')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 font-sans text-[14px] leading-relaxed mb-8">
                {t('helpPage.comingSoonDesc')}
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full py-3 bg-gradient-to-b from-[#5F916F] to-[#94B59F] border border-[#43674F] shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[1px] text-white rounded-full text-[13px] font-semibold transition-all duration-300 font-sans flex items-center justify-center gap-2"
              >
                {t('helpPage.gotIt')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
