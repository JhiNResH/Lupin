"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Receipt, User, CheckCircle, Radar, AlertTriangle } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { 
  Restaurant, 
  getRestaurantByNodeId, 
  getRestaurantById,
  markRestaurantAsDebunked,
  addCluesBalance,
  recordDecode
} from "@/lib/restaurants";

type ForensicTool = "VIBE" | "PHOTO" | "RECEIPT" | null;

// Mock 餐廳數據（當 Supabase 無法取得時使用）
const MOCK_RESTAURANT: Restaurant = {
  id: "mock-1",
  restaurant_id: "the-gilded-sushi",
  name: "The Gilded Sushi",
  location: "台北信義區",
  district: "Xinyi District",
  node_id: "B-742",
  web2_facade: 4.8,
  lupin_veracity: 21,
  bot_probability: 72,
  confidence: 85,
  status: "pending",
  verification_count: 0,
  clue_reward: 50,
  forensic_reveal: [
    "> 85% 評論偵測為 AI 生成內容",
    "> 份量與照片相差 40% 以上",
    "> 服務延遲投訴率高達 68%",
    "> 食材來源標示不明確",
  ],
  analysis_summary: "The 'Michelin Secret' is a PR fabrication. Our forensic kitchen audit reveals synthetic ingredient origins and ghost-plating.",
  key_findings: [
    "疑似公關稿評論佔比約 85%",
    "驗證用戶平均評分僅 2.1 星",
    "食物相關具體描述極少"
  ],
  image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCog5zcrobENKiVbmX5DcygeCD6ozZE5rR7ctQ9TCxw5d0AjR6YjEwShhKsTxvu8EDSk8J98YtvQl3jK8MuHkpUwYOws1Fdh54cl4SVUH1DjLEdBwebXzkfFhQrx2kz7b3ach8q9UK4xrwwFP2qAh8q9UK4xrwwFP2qAhW7slDXKn2M4gy3XY5ufEOmRhcU6_EdmdNOqLY-b7Zr87q4_thfqAqVi9TiMQrvxKgcbCphhyTd0C8CDBiwluwTn3xbtpysEiZhDQTmtloMLWtKPrIPLhGBw4o",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function DecodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = usePrivy();
  const videoRef = useRef<HTMLVideoElement>(null);

  // States
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ForensicTool>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isDecoded, setIsDecoded] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Fetch data
  useEffect(() => {
    async function fetchRestaurant() {
      const nodeId = searchParams.get("node");
      const restaurantId = searchParams.get("id");

      if (!nodeId && !restaurantId) {
        // Fallback to mock if no params
        setRestaurant(MOCK_RESTAURANT);
        setLoading(false);
        return;
      }

      setLoading(true);
      let data: Restaurant | null = null;

      if (nodeId) {
        data = await getRestaurantByNodeId(nodeId);
      } else if (restaurantId) {
        data = await getRestaurantById(restaurantId);
      }

      if (data) {
        setRestaurant(data);
        // Check if already debunked
        if (data.status === "debunked") {
          setIsDecoded(true);
        }
      } else {
        // Fallback to mock if Supabase fails or data missing
        console.log("Using mock data fallback");
        setRestaurant(MOCK_RESTAURANT);
      }
      setLoading(false);
    }

    fetchRestaurant();
  }, [searchParams]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const handleToolClick = (tool: ForensicTool) => {
    if (tool === "PHOTO" || tool === "RECEIPT") {
      startCamera();
    } else {
      stopCamera();
    }
    setActiveTool(tool);
  };

  const handleDecode = async () => {
    if (!restaurant) return;
    
    setIsDecoding(true);
    
    // Update Supabase
    if (restaurant.id && !restaurant.id.startsWith("mock-")) {
      await markRestaurantAsDebunked(restaurant.id);
      
      // Add clues if user is logged in
      if (user?.wallet?.address) {
        await addCluesBalance(user.wallet.address, restaurant.clue_reward);
        await recordDecode(user.wallet.address, restaurant.id, restaurant.clue_reward);
      }
    }

    // Simulate decode delay for effect
    setTimeout(() => {
      setIsDecoding(false);
      setIsDecoded(true);
      
      // Navigate to success page after short delay
      setTimeout(() => {
        router.push("/success");
      }, 3000);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-(--primary)">
        <Radar className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-mono">INITIALIZING FORENSIC LINK...</span>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="min-h-screen bg-black text-white font-(family-name:--font-space-grotesk) overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#050A14]" />
        <div className="absolute inset-0 mist-drift-1 opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.8),transparent_20%,transparent_80%,rgba(0,0,0,0.8))]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-(--primary)/10 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="hover:opacity-80 transition-opacity">
            <h1 className="text-lg md:text-xl font-black italic tracking-tighter text-white">
              LUPIN <span className="text-(--primary)">DECODE</span>
            </h1>
          </button>
          <div className="h-4 w-px bg-(--primary)/30 mx-2" />
          <nav className="hidden md:flex gap-6 text-[10px] font-bold tracking-[0.2em] text-(--primary)/60">
            <span className="hover:text-(--primary) cursor-pointer">OPERATIONS</span>
            <span className="text-(--primary) cursor-pointer border-b border-(--primary)">GOURMET FORENSIC</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-(--clue-gold)/10 border border-(--clue-gold)/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-(--clue-gold) animate-pulse" />
            <span className="text-[10px] font-bold text-(--clue-gold) tracking-widest">
              12,450 CLUES
            </span>
          </div>
          <button className="p-2 rounded-full bg-(--primary)/10 text-(--primary) hover:bg-(--primary)/20 transition-colors">
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 h-[calc(100vh-80px)]">
        
        {/* Left Column: Forensic Log & Tools */}
        <div className="hidden md:flex flex-col w-1/4 gap-6">
          {/* Forensic Log */}
          <div className="border border-(--primary)/20 bg-black/40 rounded-xl p-4 backdrop-blur-sm relative overflow-hidden group hover:border-(--primary)/50 transition-colors">
            <div className="absolute top-0 right-0 p-2">
              <div className="w-2 h-2 rounded-full bg-(--primary) animate-ping" />
            </div>
            <h3 className="text-[10px] text-(--primary) font-bold tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-3 h-px bg-(--primary)" />
              FORENSIC LOG
            </h3>
            <div className="space-y-3 font-mono text-[10px] text-(--primary)/70">
              <p className="flex gap-2">
                <span className="text-(--primary)">&gt;</span>
                CASE REVEAL: {restaurant.name}
              </p>
              <p className="flex gap-2">
                <span className="text-(--primary)">&gt;</span>
                Indexing evidence fragments...
              </p>
              <p className="flex gap-2 text-(--anomaly)">
                <span className="text-(--anomaly)">&gt;</span>
                ANOMALY: Bot probability {restaurant.bot_probability}%
              </p>
              <p className="flex gap-2 text-(--clue-gold)">
                <span className="text-(--clue-gold)">&gt;</span>
                CLUES: Decode reward +{restaurant.clue_reward}
              </p>
              {isDecoded && (
                <p className="flex gap-2 text-(--primary) font-bold animate-pulse">
                  <span className="text-(--primary)">&gt;</span>
                  TRUTH UNLOCKED: Veracity {restaurant.lupin_veracity}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Main Viewport */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute top-10 w-20 h-1 bg-(--primary)/20 rounded-full" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl relative"
          >
            {/* Holographic Container */}
            <div className="border border-(--primary)/30 bg-[#050A14]/90 rounded-3xl p-1 shadow-[0_0_50px_rgba(0,255,255,0.05)] backdrop-blur-xl relative overflow-hidden">
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] z-20 opacity-20" />
              
              {/* Header Bar */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-(--primary)/20 bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-(--primary) flex items-center justify-center">
                    <span className="text-[10px] font-black p-1">🍽️</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-(--primary) uppercase">
                      TACTICAL DINING FORENSIC: {restaurant.location.split(' ')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 text-[10px] font-mono">
                  <span className="px-2 py-1 bg-white/10 rounded">Web2: {restaurant.web2_facade}★</span>
                  <span className={`px-2 py-1 rounded border ${isDecoded ? "bg-(--primary) text-black border-(--primary)" : "bg-black text-(--primary) border-(--primary)"}`}>
                    Lupin: {restaurant.lupin_veracity}★
                  </span>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 relative">
                {/* DEBUNKED STAMP */}
                <AnimatePresence>
                  {isDecoded && (
                    <motion.div
                      initial={{ scale: 3, opacity: 0, rotate: -30 }}
                      animate={{ scale: 1, opacity: 1, rotate: -15 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 pointer-events-none border-8 border-(--debunk-red) px-8 py-2 rounded-xl"
                    >
                      <h1 className="text-6xl md:text-8xl font-black text-(--debunk-red) tracking-widest uppercase debunk-pulse backdrop-blur-sm">
                        DEBUNKED
                      </h1>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Left: Image Analysis */}
                <div className="w-full md:w-5/12 aspect-4/5 relative rounded-lg overflow-hidden border border-(--primary)/20 group">
                  <div className="absolute inset-0 bg-black/20 z-10 group-hover:bg-transparent transition-colors" />
                  <img 
                    src={ restaurant.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop" }
                    alt="Target Restaurant"
                    className={`w-full h-full object-cover ${isDecoded ? "grayscale contrast-125 brightness-50" : ""}`}
                  />
                  
                  {/* Camera overlay */}
                  {showCamera && (
                    <div className="absolute inset-0 z-30 bg-black">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-(--primary) rounded-lg relative">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-(--primary) -translate-x-1 -translate-y-1" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-(--primary) translate-x-1 -translate-y-1" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-(--primary) -translate-x-1 translate-y-1" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-(--primary) translate-x-1 translate-y-1" />
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-(--primary)/50" />
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-(--primary)/50" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="text-(--primary) text-xs font-mono animate-pulse">ANALYZING PORTION SIZE...</span>
                      </div>
                    </div>
                  )}

                  {/* Scanning Grid */}
                  <div className="absolute inset-0 z-20 bg-[url('/grid.png')] opacity-30 bg-repeat bg-size-[50px_50px]" />
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-(--primary)/50 shadow-[0_0_20px_var(--primary)] animate-[scan_3s_ease-in-out_infinite]" />
                </div>

                {/* Right: Intel & Actions */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">
                      [EVIDENCE DETECTED] <br/>
                      <span className="text-(--primary)">{restaurant.name}</span>
                    </h2>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6 border-l-2 border-(--primary)/30 pl-4">
                      {restaurant.analysis_summary}
                    </p>

                    {/* Forensic Reveal Panel */}
                    <AnimatePresence>
                      {isDecoded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="mb-6 overflow-hidden"
                        >
                          <div className="bg-(--debunk-red)/5 border border-(--debunk-red)/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3 text-(--debunk-red)">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-widest">Forensic Reality Check</span>
                            </div>
                            <div className="space-y-2 font-mono text-xs">
                              {restaurant.forensic_reveal.map((reveal, idx) => (
                                <motion.div
                                  initial={{ x: -20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: idx * 0.1 }}
                                  key={idx}
                                  className="text-red-400 flex gap-2"
                                >
                                  <span>⚠</span>
                                  {reveal}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tool Grid */}
                    <div className={`grid grid-cols-3 gap-3 mb-8 transition-opacity duration-500 ${isDecoded ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
                      {[
                        { id: "VIBE", icon: User, label: "VIBE ANALYSIS", cost: 5 },
                        { id: "PHOTO", icon: Camera, label: "PORTION REALITY", cost: 20 },
                        { id: "RECEIPT", icon: Receipt, label: "CERTIFIED RECEIPT", cost: 50 },
                      ].map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool.id as ForensicTool)}
                          className={`
                            relative overflow-hidden group border rounded-xl p-3 flex flex-col items-center gap-2 transition-all
                            ${activeTool === tool.id 
                              ? "bg-(--primary)/20 border-(--primary) shadow-[0_0_20px_rgba(0,255,255,0.2)]" 
                              : "bg-black/40 border-(--primary)/20 hover:border-(--primary)/50"}
                          `}
                        >
                          <div className="p-2 rounded-full bg-(--primary)/10 text-(--primary) group-hover:scale-110 transition-transform">
                            <tool.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[8px] font-bold tracking-widest text-(--primary) text-center">
                            {tool.label}
                          </span>
                          <span className="text-[10px] font-black text-(--clue-gold)">
                            {tool.cost} CLUES
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDecode}
                    disabled={isDecoding || isDecoded}
                    className={`
                      w-full py-4 rounded-xl font-black text-sm tracking-[0.2em] relative overflow-hidden transition-all
                      ${isDecoded 
                        ? "bg-(--debunk-red) text-black cursor-default" 
                        : "bg-(--primary) text-black hover:shadow-[0_0_30px_var(--primary)]"
                      }
                      ${isDecoding ? "cursor-wait opacity-80" : ""}
                    `}
                  >
                    {!isDecoded && <div className="absolute inset-0 shimmer-fast opacity-30" />}
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isDecoding ? (
                        <>
                          <Radar className="w-5 h-5 animate-spin" />
                          DECODING...
                        </>
                      ) : isDecoded ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          TRUTH REVEALED
                        </>
                      ) : (
                        <>
                          DECODE TRUTH
                          <CheckCircle className="w-5 h-5" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-(--primary)/10 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex gap-4">
          <button className="p-2 text-(--primary)/40 hover:text-(--primary) transition-colors">
            <Radar className="w-5 h-5" />
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 md:px-6 h-10 bg-(--primary)/5 border border-(--primary)/20 rounded-full text-(--primary) text-[10px] font-black tracking-[0.2em] hover:bg-(--primary)/20 transition-all uppercase">
          Sync Network
        </button>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0% {
            transform: translateY(0%);
          }
          50% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        .shimmer-fast {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .debunk-pulse {
          animation: debunk-pulse 1s infinite alternate;
        }
        @keyframes debunk-pulse {
          0% { text-shadow: 0 0 5px rgba(255,0,0,0.5); }
          100% { text-shadow: 0 0 20px rgba(255,0,0,0.8), 0 0 30px rgba(255,0,0,0.6); }
        }
        .mist-drift-1 {
          background-image: url('/mist-1.png');
          background-size: cover;
          animation: mist-drift-1 60s linear infinite;
        }
        .mist-drift-2 {
          background-image: url('/mist-2.png');
          background-size: cover;
          animation: mist-drift-2 70s linear infinite reverse;
        }
        @keyframes mist-drift-1 {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(10%) translateY(5%); }
        }
        @keyframes mist-drift-2 {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(-10%) translateY(-5%); }
        }
      `}</style>
    </div>
  );
}

export default function DecodePage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-black flex items-center justify-center text-(--primary)">
        <Radar className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-mono">INITIALIZING...</span>
      </div>
    }>
      <DecodeContent />
    </Suspense>
  );
}
