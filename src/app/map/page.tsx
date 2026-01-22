"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Radar, ZoomIn, ZoomOut, MapPin, ShieldAlert } from "lucide-react";
import { ReportModal } from "@/components/ReportModal";
import { Restaurant, getRestaurantsByDistrict } from "@/lib/restaurants";

// 台北行政區資料
const TAIPEI_DISTRICTS = [
  { id: "xinyi", name: "信義區" },
  { id: "daan", name: "大安區" },
  { id: "zhongshan", name: "中山區" },
  { id: "wanhua", name: "萬華區" },
  { id: "songshan", name: "松山區" },
  { id: "zhongzheng", name: "中正區" },
];

const DISTRICTS = TAIPEI_DISTRICTS.map(d => d.name);

// Fallback seed data (mock)
const TAIPEI_SEED_DATA = [
  { id: "xinyi-1", name: "鼎泰豐 101店", location: "信義區", truth_score: 4.0, web2_score: 4.6, key_findings: ["Authentic"], verified_reports: 120 },
  { id: "daan-1", name: "無老鍋 忠孝店", location: "大安區", truth_score: 3.6, web2_score: 4.5, key_findings: ["Hype detected"], verified_reports: 45 },
];

// 台北區域餐廳數據 (Legacy for fallback)
const DISTRICT_RESTAURANTS_LEGACY = {
  // ... (rest of the data is fine, kept implicitly)
  "信義區": [
    { id: "xinyi-1", name: "鼎泰豐 101店", nodeId: "B-742", web2: 4.6, lupin: 4.0, status: "pending" },
    { id: "xinyi-2", name: "壽司郎 信義店", nodeId: "B-891", web2: 4.2, lupin: 3.9, status: "pending" },
    { id: "xinyi-3", name: "ATMOS Dining", nodeId: "B-156", web2: 4.6, lupin: 3.4, status: "debunked" },
  ],
  "大安區": [
    { id: "daan-1", name: "無老鍋 忠孝店", nodeId: "A-421", web2: 4.5, lupin: 3.6, status: "pending" },
    { id: "daan-2", name: "永康牛肉麵", nodeId: "A-332", web2: 4.2, lupin: 3.9, status: "pending" },
    { id: "daan-3", name: "好初早餐", nodeId: "A-567", web2: 4.4, lupin: 3.5, status: "debunked" },
    { id: "daan-4", name: "橘色涮涮屋", nodeId: "A-789", web2: 4.5, lupin: 3.7, status: "pending" },
  ],
  "中山區": [
    { id: "zhongshan-1", name: "上引水產", nodeId: "C-201", web2: 4.3, lupin: 3.8, status: "pending" },
  ],
  "萬華區": [
    { id: "wanhua-1", name: "一蘭拉麵 西門店", nodeId: "D-101", web2: 4.3, lupin: 3.4, status: "debunked" },
    { id: "wanhua-2", name: "阿宗麵線 西門店", nodeId: "D-202", web2: 4.1, lupin: 3.8, status: "pending" },
    { id: "wanhua-3", name: "便所主題餐廳", nodeId: "D-303", web2: 4.0, lupin: 3.2, status: "debunked" },
  ],
  "松山區": [
    { id: "songshan-1", name: "福州世祖胡椒餅", nodeId: "E-401", web2: 4.4, lupin: 4.1, status: "pending" },
  ],
  "中正區": [
    { id: "zhongzheng-1", name: "阜杭豆漿", nodeId: "F-501", web2: 4.3, lupin: 4.0, status: "pending" },
    { id: "zhongzheng-2", name: "公館夜市碳烤雞排", nodeId: "F-601", web2: 4.3, lupin: 4.0, status: "pending" },
  ],
};



export default function MapPage() {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState(TAIPEI_DISTRICTS[0]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDebunkedAlert, setShowDebunkedAlert] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery) return restaurants;
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.node_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [restaurants, searchQuery]);

  const handleRestaurantAdd = (newRestaurant: Restaurant) => {
    setRestaurants(prev => [...prev, newRestaurant]);
    // Optionally switch to the district of the new restaurant if needed,
    // or just let it be added to the current state list if it matches.
    // For now we just add it to the state so it appears as a node.
  };

  // Load restaurants when district changes (same as before)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getRestaurantsByDistrict(selectedDistrict.id);
      
      const localSeed = TAIPEI_SEED_DATA.filter(r => r.location.includes(selectedDistrict.name)).map(seed => ({
        // Default omitted properties for legacy seeds
        bot_probability: 20,
        confidence: 90,
        status: "pending" as const, // Explicit cast
        analysis_summary: "Legacy Node Data",
        ...seed,
        restaurant_id: seed.id,
        district: selectedDistrict.id,
        node_id: `N-${seed.id.slice(-3)}`,
        lupin_veracity: seed.truth_score * 20,
        web2_facade: seed.web2_score,
        forensic_reveal: seed.key_findings,
        clue_reward: 50,
        verification_count: seed.verified_reports,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Restaurant));


      // Use a Set to merge unique restaurants by ID
      const merged = new Map();
      
      // Add local seeds first
      localSeed.forEach(r => merged.set(r.id, r));
      
      // Add fetch data (overwriting seeds if same ID, or adding new ones)
      data.forEach(r => merged.set(r.id, r));

      setRestaurants(Array.from(merged.values()));
      
      setLoading(false);
      
      if (data.some(r => r.status === "debunked")) {
        setShowDebunkedAlert(true);
      }
    }
    loadData();
  }, [selectedDistrict]);

  const currentRestaurant = useMemo(() => {
    if (selectedRestaurant) {
      return restaurants.find(r => r.id === selectedRestaurant);
    }
    return restaurants[0] || null;
  }, [selectedRestaurant, restaurants]);
  
  // ... (render) ...

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-(family-name:--font-space-grotesk) text-white">
      {/* Background Map Image */}
      <div
        className="absolute inset-0 grayscale opacity-10 contrast-125"
        style={{
          backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCPyCtW4aLpPKH0QAJd6TAmdPc_ijOj4W3JuYk4FxFGHLaL3ldT3h7gdON-RGtzw02dPQqW-FdFyGP-6aaoaO0y2OIXV100jXSNVzcd7w9lvexaCTay4Q-mxDg0oM2Ft3aR5xgNrztOMbaTeF2lsRMKeOgUASaV0f3vtFP1cehne6nP95cRIsqZG1H_-MSI9fJjAbg4SQN1kPWEMKpv6iiY2IskLOfuEHWEW65K-qmH8_qDQprYTCtefn1pL1FcmWbTUeV1FGKnJGI")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* 數位迷霧層 */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute inset-0 mist-drift-1" />
        <div className="absolute inset-0 mist-drift-2" />
        <div className="absolute inset-0 mist-layer opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[size:100%_2px,3px_100%]" />
      </div>

      {/* Restaurant Nodes - Dynamic based on selected district */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {restaurants.map((restaurant, index) => {
          // Position nodes in different locations
          const positions = [
            { top: "40%", left: "46%" },
            { top: "55%", left: "35%" },
            { top: "35%", left: "60%" },
            { top: "60%", left: "55%" },
          ];
          const pos = positions[index % positions.length];
          const isSelected = currentRestaurant?.id === restaurant.id;
          
          return (
            <div
              key={restaurant.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ top: pos.top, left: pos.left }}
            >
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedRestaurant(restaurant.id);
                }}
              >
                {/* Mini Popup - Show for selected */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 md:w-64 bg-(--background-dark) border border-(--primary) p-3 md:p-4 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.3)] z-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] text-(--primary)/60 font-bold uppercase tracking-tight">
                            Node: {restaurant.node_id}
                          </p>
                          <h3 className="text-sm font-bold leading-tight uppercase">
                            {restaurant.name}
                          </h3>
                        </div>
                        <ShieldCheck className="w-4 h-4 text-(--primary)" />
                      </div>

                      <div className="space-y-2">
                        <div className={`flex justify-between items-center p-2 rounded ${
                          restaurant.status === "debunked" 
                            ? "bg-(--debunk-red)/10 border border-(--debunk-red)/30" 
                            : "bg-red-500/10 border border-red-500/30"
                        }`}>
                          <span className="text-[10px] font-bold uppercase">Lupin Score</span>
                          <span className={`text-lg font-bold tracking-tighter ${
                            restaurant.status === "debunked" ? "text-(--debunk-red)" : "text-(--primary)"
                          }`}>
                            {restaurant.lupin_veracity}★
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded">
                          <span className="text-[10px] font-bold opacity-60 uppercase">Web2 Facade</span>
                          <span className="text-sm font-bold text-white/60">{restaurant.web2_facade}★</span>
                        </div>
                      </div>

                      {restaurant.status === "debunked" && (
                        <div className="mt-2 text-center">
                          <span className="text-[10px] font-black text-(--debunk-red) uppercase tracking-widest">
                            ⚠️ DEBUNKED
                          </span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/decode?node=${restaurant.node_id}`);
                        }}
                        className="w-full mt-3 bg-(--primary) py-2 rounded text-(--background-dark) text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                      >
                        {restaurant.status === "debunked" ? "View Evidence" : "Extract Evidence"}
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-(--primary)" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Node Icon */}
                <div className={`relative flex items-center justify-center ${isSelected ? "size-16" : "size-12"} transition-all`}>
                  <div className={`absolute inset-0 border-2 border-dashed rounded-full spinning-seal opacity-50 ${
                    restaurant.status === "debunked" ? "border-(--debunk-red)" : "border-(--primary)"
                  }`} />
                  <div className={`absolute inset-2 border rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                    restaurant.status === "debunked" 
                      ? "border-(--debunk-red) bg-(--debunk-red)/10 shadow-[0_0_20px_rgba(255,0,51,0.4)]" 
                      : "border-(--primary) bg-(--primary)/10 shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                  }`}>
                    <ShieldCheck className={`w-5 h-5 ${
                      restaurant.status === "debunked" ? "text-(--debunk-red)" : "text-(--primary)"
                    }`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* District Label */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
        <motion.div
          key={selectedDistrict.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <span className="text-(--primary) font-bold tracking-[0.3em] text-2xl md:text-4xl district-glow uppercase">
            {selectedDistrict.name}
          </span>
          <span className="text-[10px] text-(--primary)/40 font-mono tracking-widest uppercase mt-1">
            {restaurants.length} Forensic Nodes Active
          </span>
        </motion.div>
      </div>

      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="flex flex-col gap-3">
          {/* Top Row: Logo + Search + Clues */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <div
                onClick={() => router.push("/")}
                className="cursor-pointer relative flex items-center gap-2 md:gap-3 bg-black/95 border border-(--primary)/30 p-2 md:p-4 rounded-full shadow-[0_0_20px_rgba(0,255,255,0.1)]"
              >
                <span className="text-(--primary) text-2xl md:text-4xl leading-none">🔍</span>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-2xl font-black tracking-tighter text-white uppercase">
                    LUPIN <span className="text-(--primary) italic">MAP</span>
                  </h1>
                  <p className="text-[9px] text-(--primary)/80 tracking-[0.4em] font-bold uppercase">
                    Investigation v3.1
                  </p>
                </div>
              </div>
              
              {/* Search Input - Dynamic */}
              <div className="relative hidden md:block">
                <div 
                  className={`cursor-pointer relative flex items-center gap-2 bg-black/80 border px-4 py-2 rounded-full transition-all min-w-[250px]
                    ${searchFocused ? "border-(--primary) shadow-[0_0_15px_var(--primary)]" : "border-(--primary)/20"}
                  `}
                >
                  <span className="text-(--primary)">🔎</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    placeholder="Search entity..."
                    className="bg-transparent border-none outline-none text-sm text-white placeholder:text-(--primary)/50 w-full font-mono"
                  />
                </div>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {searchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full mt-2 left-0 right-0 bg-black/95 border border-(--primary)/30 rounded-xl overflow-hidden shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
                    >
                      {searchQuery && filteredRestaurants.length > 0 ? (
                        filteredRestaurants.map(r => (
                          <div 
                            key={r.id}
                            onClick={() => {
                              setSelectedRestaurant(r.id);
                              setSearchQuery("");
                            }}
                            className="p-3 hover:bg-(--primary)/10 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="text-sm font-bold text-white mb-0.5">{r.name}</div>
                              <div className="text-[10px] text-(--primary) font-mono">{r.node_id} • {r.web2_facade}★</div>
                            </div>
                            {r.status === "debunked" && <span className="text-[10px] bg-(--debunk-red) text-white px-2 py-0.5 rounded font-bold">DEBUNKED</span>}
                          </div>
                        ))
                      ) : searchQuery ? (
                        <div 
                          onClick={() => {
                            setIsReportModalOpen(true);
                            setSearchFocused(false);
                          }}
                          className="p-4 hover:bg-(--debunk-red)/10 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 text-(--debunk-red) mb-1">
                            <ShieldAlert className="w-4 h-4 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider">Entity Unknown</span>
                          </div>
                          <div className="text-sm text-white group-hover:text-(--primary) transition-colors">
                            Report suspect "{searchQuery}"? <span className="text-(--primary)">Initialize Case →</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-[10px] text-(--primary)/50 font-mono text-center">
                          TYPE TO SEARCH DATABASE
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-(--primary)/30 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-(--primary) animate-pulse" />
                <span className="text-[10px] font-mono text-(--primary)">LIVE FEED</span>
              </div>
              
              {/* Report Suspect Button */}
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-(--debunk-red)/10 border border-(--debunk-red)/50 rounded-lg text-(--debunk-red) hover:bg-(--debunk-red) hover:text-white transition-all group"
              >
                <ShieldAlert className="w-4 h-4 group-hover:animate-ping" />
                <span className="text-xs font-bold tracking-widest uppercase hidden md:inline">Report Suspect</span>
              </button>
            </div>
          </div>

          {/* District Selector Row */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TAIPEI_DISTRICTS.map((district) => {
              const isActive = selectedDistrict.id === district.id;
              // Note: DISTRICT_RESTAURANTS_LEGACY usage is deprecated but kept for build if needed, 
              // but we are using dynamic data mostly now.
              // Ideally we check checking 'restaurants' length but that's current filtered list.
              // Just removing count or using random for now to unblock build or using legacy lookup by name
              const restaurantCount = 0; 
              
              return (
                <button
                  key={district.id}
                  onClick={() => {
                    setSelectedDistrict(district);
                    setSelectedRestaurant(null);
                  }}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive 
                      ? "bg-(--primary) text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]" 
                      : "bg-black/80 border border-(--primary)/30 text-(--primary)/70 hover:border-(--primary) hover:text-(--primary)"
                  }`}
                >
                  {district.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forensic Log (左下角) - Hidden on mobile */}
      <div className="hidden md:block absolute bottom-24 left-6 z-50 w-72 bg-black/90 border border-(--primary)/30 overflow-hidden font-mono text-[10px] shadow-2xl rounded-xl backdrop-blur-md">
        <div className="bg-(--primary)/10 border-b border-(--primary)/20 px-3 py-2 flex justify-between items-center">
          <span className="text-(--primary) font-bold uppercase tracking-tighter">
            Forensic Log
          </span>
          <div className="size-2 rounded-full bg-(--primary)/60 animate-pulse" />
        </div>
        <div className="p-4 h-32 overflow-hidden relative">
          <div className="scrolling-text space-y-1">
            <p className="text-(--reveal) font-bold">&gt; SECTOR: {selectedDistrict.name}</p>
            <p className="text-(--primary)/60">&gt; Active nodes: {restaurants.length}</p>
            <p className="text-(--anomaly)">&gt; ANOMALY: Multiple hype traps detected</p>
            <p className="text-(--clue-gold) font-bold">&gt; CLUES: Decode available +50</p>
            <p className="text-(--reveal)">&gt; TRUTH: Verifying restaurant claims...</p>
          </div>
        </div>
      </div>

      {/* Radar & Zoom Controls (右側) */}
      <div className="absolute bottom-24 right-6 z-50 flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-0 animate-radar-ping border-2 border-(--primary) rounded-full pointer-events-none" />
          <button className="relative size-12 md:size-16 rounded-full bg-black border-2 border-(--primary) flex items-center justify-center text-(--primary) shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-110 transition-transform">
            <Radar className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button className="size-10 bg-black/80 border border-white/20 flex items-center justify-center text-white hover:border-(--primary) transition-colors rounded-full backdrop-blur-sm">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="size-10 bg-black/80 border border-white/20 flex items-center justify-center text-white hover:border-(--primary) transition-colors rounded-full backdrop-blur-sm">
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Ticker Feed */}
      <div className="absolute bottom-12 left-0 right-0 z-40 bg-black/80 border-y border-(--primary)/20 h-10 flex items-center overflow-hidden backdrop-blur-md">
        <div className="flex whitespace-nowrap feed-scroll px-4">
          {[1, 2].map((i) => (
            <span key={i}>
              <span className="text-(--primary) font-mono text-[10px] uppercase font-bold mr-12">
                &gt; {selectedDistrict.name} — {restaurants.length} restaurants under investigation
              </span>
              <span className="text-(--primary) font-mono text-[10px] uppercase font-bold mr-12">
                &gt; New Evidence Folder sealed at block #842,912
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black border-t border-(--primary)/30 h-12 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-(--primary)" />
            <span className="text-[10px] font-mono text-(--primary) tracking-widest uppercase">
              SECTOR: {selectedDistrict.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[10px] font-black uppercase tracking-widest text-(--primary)/60 hover:text-(--primary) transition-colors">
            Archive Access
          </button>
        </div>
      </div>

      <style jsx global>{`
        .spinning-seal {
          animation: rotate-seal 12s linear infinite;
        }
        @keyframes rotate-seal {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .scrolling-text {
          animation: scroll-up 20s linear infinite;
        }
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        initialName={searchQuery}
        onSuccess={handleRestaurantAdd}
      />
    </div>
  );
}
