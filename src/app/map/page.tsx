"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Radar, ZoomIn, ZoomOut, MapPin } from "lucide-react";

// 台北區域餐廳數據
const DISTRICT_RESTAURANTS = {
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

const DISTRICTS = Object.keys(DISTRICT_RESTAURANTS);

export default function MapPage() {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState("信義區");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  
  const restaurants = useMemo(() => {
    return DISTRICT_RESTAURANTS[selectedDistrict as keyof typeof DISTRICT_RESTAURANTS] || [];
  }, [selectedDistrict]);

  const currentRestaurant = useMemo(() => {
    if (selectedRestaurant) {
      return restaurants.find(r => r.id === selectedRestaurant);
    }
    return restaurants[0] || null;
  }, [selectedRestaurant, restaurants]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-[family-name:var(--font-space-grotesk)] text-white">
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
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 md:w-64 bg-[var(--background-dark)] border border-[var(--primary)] p-3 md:p-4 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.3)] z-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] text-[var(--primary)]/60 font-bold uppercase tracking-tight">
                            Node: {restaurant.nodeId}
                          </p>
                          <h3 className="text-sm font-bold leading-tight uppercase">
                            {restaurant.name}
                          </h3>
                        </div>
                        <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                      </div>

                      <div className="space-y-2">
                        <div className={`flex justify-between items-center p-2 rounded ${
                          restaurant.status === "debunked" 
                            ? "bg-[var(--debunk-red)]/10 border border-[var(--debunk-red)]/30" 
                            : "bg-red-500/10 border border-red-500/30"
                        }`}>
                          <span className="text-[10px] font-bold uppercase">Lupin Score</span>
                          <span className={`text-lg font-bold tracking-tighter ${
                            restaurant.status === "debunked" ? "text-[var(--debunk-red)]" : "text-[var(--primary)]"
                          }`}>
                            {restaurant.lupin}★
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded">
                          <span className="text-[10px] font-bold opacity-60 uppercase">Web2 Facade</span>
                          <span className="text-sm font-bold text-white/60">{restaurant.web2}★</span>
                        </div>
                      </div>

                      {restaurant.status === "debunked" && (
                        <div className="mt-2 text-center">
                          <span className="text-[10px] font-black text-[var(--debunk-red)] uppercase tracking-widest">
                            ⚠️ DEBUNKED
                          </span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/decode?node=${restaurant.nodeId}`);
                        }}
                        className="w-full mt-3 bg-[var(--primary)] py-2 rounded text-[var(--background-dark)] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                      >
                        {restaurant.status === "debunked" ? "View Evidence" : "Extract Evidence"}
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[var(--primary)]" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Node Icon */}
                <div className={`relative flex items-center justify-center ${isSelected ? "size-16" : "size-12"} transition-all`}>
                  <div className={`absolute inset-0 border-2 border-dashed rounded-full spinning-seal opacity-50 ${
                    restaurant.status === "debunked" ? "border-[var(--debunk-red)]" : "border-[var(--primary)]"
                  }`} />
                  <div className={`absolute inset-2 border rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                    restaurant.status === "debunked" 
                      ? "border-[var(--debunk-red)] bg-[var(--debunk-red)]/10 shadow-[0_0_20px_rgba(255,0,51,0.4)]" 
                      : "border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                  }`}>
                    <ShieldCheck className={`w-5 h-5 ${
                      restaurant.status === "debunked" ? "text-[var(--debunk-red)]" : "text-[var(--primary)]"
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
          key={selectedDistrict}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <span className="text-[var(--primary)] font-bold tracking-[0.3em] text-2xl md:text-4xl district-glow uppercase">
            {selectedDistrict}
          </span>
          <span className="text-[10px] text-[var(--primary)]/40 font-mono tracking-widest uppercase mt-1">
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
                className="cursor-pointer relative flex items-center gap-2 md:gap-3 bg-black/95 border border-[var(--primary)]/30 p-2 md:p-4 rounded-full shadow-[0_0_20px_rgba(0,255,255,0.1)]"
              >
                <span className="text-[var(--primary)] text-2xl md:text-4xl leading-none">🔍</span>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-2xl font-black tracking-tighter text-white uppercase">
                    LUPIN <span className="text-[var(--primary)] italic">MAP</span>
                  </h1>
                  <p className="text-[9px] text-[var(--primary)]/80 tracking-[0.4em] font-bold uppercase">
                    Investigation v3.1
                  </p>
                </div>
              </div>
              
              {/* Search Input - Navigates to Home */}
              <div 
                onClick={() => router.push("/")}
                className="cursor-pointer hidden md:flex items-center gap-2 bg-black/80 border border-[var(--primary)]/20 px-4 py-2 rounded-full hover:border-[var(--primary)]/50 transition-colors min-w-[200px]"
              >
                <span className="text-[var(--primary)]">🔎</span>
                <span className="text-sm text-[var(--primary)]/50 font-medium">搜尋餐廳...</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 bg-[var(--clue-gold)]/10 border border-[var(--clue-gold)]/40 px-3 md:px-4 py-2 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                <Radar className="w-4 h-4 text-[var(--clue-gold)]" />
                <span className="text-xs font-black text-[var(--clue-gold)] tracking-widest uppercase">
                  +50 CLUES
                </span>
              </div>
            </div>
          </div>

          {/* District Selector Row */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {DISTRICTS.map((district) => {
              const isActive = selectedDistrict === district;
              const restaurantCount = DISTRICT_RESTAURANTS[district as keyof typeof DISTRICT_RESTAURANTS]?.length || 0;
              const hasDebunked = DISTRICT_RESTAURANTS[district as keyof typeof DISTRICT_RESTAURANTS]?.some(r => r.status === "debunked");
              
              return (
                <button
                  key={district}
                  onClick={() => {
                    setSelectedDistrict(district);
                    setSelectedRestaurant(null);
                  }}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive 
                      ? "bg-[var(--primary)] text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]" 
                      : "bg-black/80 border border-[var(--primary)]/30 text-[var(--primary)]/70 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  {hasDebunked && <span className="text-[var(--debunk-red)]">⚠️</span>}
                  {district}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-black/20 text-black" : "bg-[var(--primary)]/20 text-[var(--primary)]"
                  }`}>
                    {restaurantCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forensic Log (左下角) - Hidden on mobile */}
      <div className="hidden md:block absolute bottom-24 left-6 z-50 w-72 bg-black/90 border border-[var(--primary)]/30 overflow-hidden font-mono text-[10px] shadow-2xl rounded-xl backdrop-blur-md">
        <div className="bg-[var(--primary)]/10 border-b border-[var(--primary)]/20 px-3 py-2 flex justify-between items-center">
          <span className="text-[var(--primary)] font-bold uppercase tracking-tighter">
            Forensic Log
          </span>
          <div className="size-2 rounded-full bg-[var(--primary)]/60 animate-pulse" />
        </div>
        <div className="p-4 h-32 overflow-hidden relative">
          <div className="scrolling-text space-y-1">
            <p className="text-[var(--reveal)] font-bold">&gt; SECTOR: {selectedDistrict}</p>
            <p className="text-[var(--primary)]/60">&gt; Active nodes: {restaurants.length}</p>
            <p className="text-[var(--anomaly)]">&gt; ANOMALY: Multiple hype traps detected</p>
            <p className="text-[var(--clue-gold)] font-bold">&gt; CLUES: Decode available +50</p>
            <p className="text-[var(--reveal)]">&gt; TRUTH: Verifying restaurant claims...</p>
          </div>
        </div>
      </div>

      {/* Radar & Zoom Controls (右側) */}
      <div className="absolute bottom-24 right-6 z-50 flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-0 animate-radar-ping border-2 border-[var(--primary)] rounded-full pointer-events-none" />
          <button className="relative size-12 md:size-16 rounded-full bg-black border-2 border-[var(--primary)] flex items-center justify-center text-[var(--primary)] shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-110 transition-transform">
            <Radar className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button className="size-10 bg-black/80 border border-white/20 flex items-center justify-center text-white hover:border-[var(--primary)] transition-colors rounded-full backdrop-blur-sm">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="size-10 bg-black/80 border border-white/20 flex items-center justify-center text-white hover:border-[var(--primary)] transition-colors rounded-full backdrop-blur-sm">
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Ticker Feed */}
      <div className="absolute bottom-12 left-0 right-0 z-40 bg-black/80 border-y border-[var(--primary)]/20 h-10 flex items-center overflow-hidden backdrop-blur-md">
        <div className="flex whitespace-nowrap feed-scroll px-4">
          {[1, 2].map((i) => (
            <span key={i}>
              <span className="text-[var(--primary)] font-mono text-[10px] uppercase font-bold mr-12">
                &gt; {selectedDistrict} — {restaurants.length} restaurants under investigation
              </span>
              <span className="text-[var(--primary)] font-mono text-[10px] uppercase font-bold mr-12">
                &gt; New Evidence Folder sealed at block #842,912
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black border-t border-[var(--primary)]/30 h-12 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] tracking-widest uppercase">
              SECTOR: {selectedDistrict}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]/60 hover:text-[var(--primary)] transition-colors">
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
    </div>
  );
}
