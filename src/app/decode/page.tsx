"use client";

import { useState, useRef, useEffect } from "react";
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
  image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCog5zcrobENKiVbmX5DcygeCD6ozZE5rR7ctQ9TCxw5d0AjR6YjEwShhKsTxvu8EDSk8J98YtvQl3jK8MuHkpUwYOws1Fdh54cl4SVUH1DjLEdBwebXzkfFhQrx2kz7b3ach8q9UK4xrwwFP2qAhW7slDXKn2M4gy3XY5ufEOmRhcU6_EdmdNOqLY-b7Zr87q4_thfqAqVi9TiMQrvxKgcbCphhyTd0C8CDBiwluwTn3xbtpysEiZhDQTmtloMLWtKPrIPLhGBw4o",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function DecodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authenticated } = usePrivy();
  
  // 從 URL 取得 nodeId 或 restaurantId
  const nodeId = searchParams.get("node") || "B-742";
  const restaurantId = searchParams.get("id");
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ForensicTool>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [clues, setClues] = useState(12450);
  const [isScanning, setIsScanning] = useState(false);
  const [isDecoded, setIsDecoded] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 從 Supabase 獲取餐廳數據
  useEffect(() => {
    async function fetchRestaurant() {
      setLoading(true);
      try {
        let data: Restaurant | null = null;
        
        if (restaurantId) {
          data = await getRestaurantById(restaurantId);
        } else if (nodeId) {
          data = await getRestaurantByNodeId(nodeId);
        }
        
        if (data) {
          setRestaurant(data);
          // 如果已經是 debunked 狀態，直接顯示解碼後 UI
          if (data.status === "debunked") {
            setIsDecoded(true);
          }
        } else {
          // 使用 Mock 數據
          console.log("Using mock restaurant data");
          setRestaurant(MOCK_RESTAURANT);
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        setRestaurant(MOCK_RESTAURANT);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRestaurant();
  }, [nodeId, restaurantId]);

  const startCamera = async () => {
    setActiveTool("PHOTO");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      simulateScan("PHOTO", 20);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setActiveTool(null);
  };

  const handleTaskComplete = (id: string, reward: number) => {
    if (!completed[id]) {
      setCompleted((prev) => ({ ...prev, [id]: true }));
      setClues((prev) => prev + reward);
    }
    setIsScanning(false);
    setActiveTool(null);
    if (id === "PHOTO") stopCamera();
  };

  const simulateScan = (id: string, reward: number) => {
    setIsScanning(true);
    setTimeout(() => {
      handleTaskComplete(id, reward);
    }, 2000);
  };

  const handleDecode = async () => {
    if (!restaurant) return;
    
    setIsDecoding(true);
    
    try {
      // 1. 標記餐廳為 DEBUNKED
      const updateSuccess = await markRestaurantAsDebunked(restaurant.id);
      
      // 2. 更新特工 clues_balance（如果已登入）
      if (authenticated && user?.id) {
        await addCluesBalance(user.id, restaurant.clue_reward || 50);
        await recordDecode(user.id, restaurant.id, restaurant.clue_reward || 50);
      }
      
      // 3. 更新本地狀態
      setClues((prev) => prev + (restaurant.clue_reward || 50));
      setIsDecoded(true);
      
      // 4. 等待動畫後跳轉
      setTimeout(() => {
        router.push(`/success?clues=${restaurant.clue_reward || 50}&restaurant=${encodeURIComponent(restaurant.name)}`);
      }, 2000);
      
    } catch (error) {
      console.error("Decode error:", error);
      // 即使 API 失敗也繼續 UI 流程
      setIsDecoded(true);
      setTimeout(() => {
        router.push("/success");
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Radar className="w-12 h-12 text-[var(--primary)] animate-spin" />
          <p className="text-[var(--primary)] font-mono text-sm animate-pulse">
            正在載入鑑識資料...
          </p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <p className="text-red-500">找不到餐廳資料</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex flex-col font-[family-name:var(--font-space-grotesk)] bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="z-50 flex items-center justify-between border-b border-[var(--primary)]/10 bg-black/95 px-4 md:px-8 py-3 md:py-4 backdrop-blur-md">
        <div className="flex items-center gap-3 md:gap-6">
          <div
            className="flex items-center gap-3 text-[var(--primary)] cursor-pointer"
            onClick={() => router.push("/map")}
          >
            <div className="size-6">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-base md:text-xl font-bold tracking-tighter uppercase">Lupin Decode</h1>
          </div>
          <div className="hidden md:block h-6 w-px bg-[var(--primary)]/20" />
          <div className="hidden md:flex gap-6 text-sm font-medium tracking-widest text-[var(--primary)]/60 uppercase">
            <span
              className="hover:text-[var(--primary)] cursor-pointer transition-colors"
              onClick={() => router.push("/map")}
            >
              Operations
            </span>
            <span className="text-[var(--primary)] underline decoration-2 underline-offset-8">
              Gourmet Forensic
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 px-2 md:px-4 py-1 md:py-1.5 rounded-full">
            <Radar className="w-4 h-4 text-[var(--clue-gold)]" />
            <span className="text-sm font-bold text-[var(--clue-gold)] tracking-wider">
              {clues.toLocaleString()} CLUES
            </span>
          </div>
          <div className="size-10 rounded-full border border-[var(--primary)]/30 flex items-center justify-center bg-[var(--primary)]/5">
            <User className="w-5 h-5 text-[var(--primary)]" />
          </div>
        </div>
      </header>

      {/* Main Forensic View */}
      <main className="relative flex-1 overflow-hidden bg-black">
        {/* Background Layers */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute inset-0 mist-drift-1 opacity-20" />
          <div className="absolute inset-0 mist-drift-2 opacity-15" />
          <div className="absolute inset-0 mist-layer opacity-10" />
        </div>
        <div
          className="absolute inset-0 grayscale contrast-150 opacity-10 bg-cover bg-center"
          style={{
            backgroundImage: `url('${restaurant.image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAY1i1ubGqUVJxhzYz4GR3QWWCq6kN2Gqa0m6a73szOcKQ6RhkARLdkfHUJKYVy_HTICXJdVe8CSVn5ptXSmCIcq7sVUxabBtpyNDFlY9Kpw8LAo-m9bM9koI-raoQj9r2QVEEEywONnberFK4FiVJ5mM4dmCAs8rGkbmk2By2ObRn7Ij_tdruWi6o0n2kT8WC28xE6ZA9EoWlX-UZrtesCpd9rYihg_0lhzgbF1-1OmdVbFirW3r2sQBUU9zdQSGmdNjDTP3FWXgM"}')`,
          }}
        />

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
              <p className="text-[var(--reveal)] font-bold">&gt; CASE REVEAL: {restaurant.name}</p>
              <p className="text-[var(--primary)]/60">&gt; Indexing evidence fragments...</p>
              <p className="text-[var(--anomaly)]">&gt; ANOMALY: Bot probability {restaurant.bot_probability}%</p>
              <p className="text-[var(--clue-gold)] font-bold">&gt; CLUES: Decode reward +{restaurant.clue_reward || 50}</p>
              <p className="text-[var(--reveal)]">&gt; TRUTH UNLOCKED: Veracity {restaurant.lupin_veracity}%</p>
            </div>
          </div>
        </div>

        {/* Territory UI (Bottom Panel) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-3 md:px-6 pb-3 md:pb-6 z-40">
          <div
            className="group cursor-pointer py-4"
            onClick={() => router.push("/map")}
          >
            <div className="w-16 h-2 bg-[var(--primary)]/40 group-hover:bg-[var(--primary)]/60 rounded-full mx-auto transition-colors" />
          </div>

          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel rounded-3xl overflow-hidden relative border-t-2 border-t-[var(--primary)]/60 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.8)]"
          >
            <div className="scanline absolute inset-0 z-0 opacity-50" />
            <div className="relative z-10 flex flex-col">
              <div className="bg-black/80 border-b border-white/10 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--primary)] text-xl">🍽️</span>
                  <span className="text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] text-[var(--primary)] uppercase">
                    Tactical Dining Forensic: {restaurant.district || "Sector 4"}
                  </span>
                </div>
                {/* Web2 vs Lupin Score Badge */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-[10px]">
                    <span className="text-white/50">Web2:</span>
                    <span className="text-white font-bold">{restaurant.web2_facade}★</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[var(--primary)]/10 px-2 py-1 rounded text-[10px]">
                    <span className="text-[var(--primary)]/50">Lupin:</span>
                    <span className="text-[var(--primary)] font-bold">{(restaurant.lupin_veracity / 10).toFixed(1)}★</span>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 bg-black/40">
                <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-2xl md:rounded-3xl border border-[var(--primary)]/20 overflow-hidden relative group shrink-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all scale-110"
                    style={{
                      backgroundImage: `url('${restaurant.image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCog5zcrobENKiVbmX5DcygeCD6ozZE5rR7ctQ9TCxw5d0AjR6YjEwShhKsTxvu8EDSk8J98YtvQl3jK8MuHkpUwYOws1Fdh54cl4SVUH1DjLEdBwebXzkfFhQrx2kz7b3ach8q9UK4xrwwFP2qAhW7slDXKn2M4gy3XY5ufEOmRhcU6_EdmdNOqLY-b7Zr87q4_thfqAqVi9TiMQrvxKgcbCphhyTd0C8CDBiwluwTn3xbtpysEiZhDQTmtloMLWtKPrIPLhGBw4o"}')`,
                    }}
                  />
                  {/* DEBUNKED Stamp Overlay */}
                  <AnimatePresence>
                    {isDecoded && (
                      <motion.div 
                        initial={{ scale: 2, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: -8 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/60"
                      >
                        <div className="debunked-stamp text-2xl md:text-3xl">
                          DEBUNKED
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white leading-none uppercase mb-2">
                      [EVIDENCE DETECTED]
                      <br />
                      <span className="text-[var(--primary)] italic">{restaurant.name}</span>
                    </h2>
                    <p className="hidden md:block text-[var(--primary)]/70 text-sm leading-relaxed font-medium mb-4">
                      {restaurant.analysis_summary}
                    </p>

                    {/* Forensic Reveal - 動態渲染 */}
                    {isDecoded && restaurant.forensic_reveal && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-[var(--debunk-red)]/10 border border-[var(--debunk-red)]/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-[var(--debunk-red)]" />
                          <span className="text-[10px] font-black text-[var(--debunk-red)] uppercase tracking-widest">
                            Forensic Reveal
                          </span>
                        </div>
                        <div className="space-y-1">
                          {restaurant.forensic_reveal.map((line, index) => (
                            <p key={index} className="text-xs font-mono text-[var(--debunk-red)]/90 animate-pulse">
                              {line}
                            </p>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[var(--debunk-red)]/20">
                          <p className="text-xs font-bold text-[var(--primary)]">
                            DECODED LUPIN VERACITY: <span className="text-lg neon-glow">{restaurant.lupin_veracity}%</span>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Evidence Collection Tools */}
                    {!isDecoded && (
                      <div className="flex gap-3 overflow-x-auto pb-4">
                        <button
                          disabled={completed["VIBE"]}
                          onClick={() => simulateScan("VIBE", 5)}
                          className={`flex flex-col items-center gap-1 border p-2 rounded-lg min-w-[100px] md:min-w-[120px] transition-all ${
                            completed["VIBE"]
                              ? "border-[var(--primary)] bg-[var(--primary)]/20 opacity-100"
                              : "border-[var(--primary)]/60 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20"
                          }`}
                        >
                          {completed["VIBE"] ? (
                            <CheckCircle className="w-5 h-5 text-[var(--primary)]" />
                          ) : (
                            <User className="w-5 h-5 text-[var(--primary)]/60" />
                          )}
                          <span className="text-[9px] font-bold uppercase text-white/40">Vibe Analysis</span>
                          <span className="text-xs font-black text-[var(--primary)]">
                            {completed["VIBE"] ? "VERIFIED" : "5 CLUES"}
                          </span>
                        </button>
                        <button
                          disabled={completed["PHOTO"]}
                          onClick={startCamera}
                          className={`flex flex-col items-center gap-1 border p-2 rounded-lg min-w-[100px] md:min-w-[120px] transition-all ${
                            completed["PHOTO"]
                              ? "border-[var(--primary)] bg-[var(--primary)]/20 opacity-100"
                              : "border-[var(--primary)]/40 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20"
                          }`}
                        >
                          {completed["PHOTO"] ? (
                            <CheckCircle className="w-5 h-5 text-[var(--primary)]" />
                          ) : (
                            <Camera className="w-5 h-5 text-[var(--primary)]" />
                          )}
                          <span className="text-[9px] font-bold uppercase text-white/80">Portion Reality</span>
                          <span className="text-xs font-black text-[var(--primary)]">
                            {completed["PHOTO"] ? "VERIFIED" : "20 CLUES"}
                          </span>
                        </button>
                        <button
                          disabled={completed["RECEIPT"]}
                          onClick={() => simulateScan("RECEIPT", restaurant.clue_reward || 50)}
                          className={`flex flex-col items-center gap-1 border p-2 rounded-lg min-w-[100px] md:min-w-[120px] transition-all ${
                            completed["RECEIPT"]
                              ? "border-[var(--clue-gold)] bg-[var(--clue-gold)]/20 opacity-100"
                              : "border-[var(--clue-gold)]/50 bg-[var(--clue-gold)]/10 hover:bg-[var(--clue-gold)]/20"
                          }`}
                        >
                          {completed["RECEIPT"] ? (
                            <CheckCircle className="w-5 h-5 text-[var(--clue-gold)]" />
                          ) : (
                            <Receipt className="w-5 h-5 text-[var(--clue-gold)]" />
                          )}
                          <span className="text-[9px] font-bold uppercase text-[var(--clue-gold)]/80">
                            Certified Receipt
                          </span>
                          <span className="text-xs font-black text-[var(--clue-gold)]">
                            {completed["RECEIPT"] ? "VERIFIED" : `${restaurant.clue_reward || 50} CLUES`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <motion.button
                    onClick={handleDecode}
                    disabled={isDecoding || isDecoded}
                    whileHover={{ scale: isDecoded ? 1 : 1.02 }}
                    whileTap={{ scale: isDecoded ? 1 : 0.98 }}
                    className={`group relative h-12 md:h-16 font-black text-xs md:text-sm tracking-[0.15em] md:tracking-[0.2em] uppercase flex items-center justify-center rounded-xl md:rounded-2xl transition-all overflow-hidden border-2 ${
                      isDecoded 
                        ? "bg-[var(--debunk-red)] text-white border-[var(--debunk-red)]" 
                        : "bg-[var(--primary)] text-black border-white/20 neon-glow hover:translate-y-[-2px]"
                    }`}
                  >
                    {!isDecoded && <div className="absolute inset-0 shimmer-fast opacity-30" />}
                    <span className="relative z-10 flex items-center gap-3">
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

      <footer className="z-50 bg-black border-t border-[var(--primary)]/10 px-4 md:px-8 py-3 flex justify-between items-center">
        <div className="flex gap-4">
          <button className="p-2 text-[var(--primary)]/40 hover:text-[var(--primary)] transition-colors">
            <Radar className="w-5 h-5" />
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 md:px-6 h-10 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-full text-[var(--primary)] text-[10px] font-black tracking-[0.2em] hover:bg-[var(--primary)]/20 transition-all uppercase">
          Sync Network
        </button>
      </footer>

      {/* Hidden video for camera */}
      <video ref={videoRef} autoPlay playsInline className="hidden" />

      <style jsx global>{`
        .scrolling-text {
          animation: scroll-up 20s linear infinite;
        }
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}
