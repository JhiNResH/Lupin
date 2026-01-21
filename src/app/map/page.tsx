"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Radar, ZoomIn, ZoomOut, MapPin } from "lucide-react";

export default function MapPage() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(true);

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

      {/* 台北區域節點與 Mini Popup */}
      <div className="absolute top-[40%] md:top-[48%] left-[50%] md:left-[46%] -translate-x-1/2 md:translate-x-0 z-40">
        <div
          className="relative group cursor-pointer"
          onClick={() => router.push("/decode")}
        >
          {/* Mini Popup */}
          <AnimatePresence>
            {showPopup && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 md:w-64 bg-[var(--background-dark)] border border-[var(--primary)] p-3 md:p-4 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] text-[var(--primary)]/60 font-bold uppercase tracking-tight">
                      Node: B-742
                    </p>
                    <h3 className="text-sm font-bold leading-tight uppercase">
                      The Gilded Sushi
                    </h3>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-red-500/10 border border-red-500/30 p-2 rounded">
                    <span className="text-[10px] font-bold uppercase">Lupin Score</span>
                    <span className="text-lg font-bold text-[var(--primary)] tracking-tighter">
                      2.1★
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded">
                    <span className="text-[10px] font-bold opacity-60 uppercase">Web2 Facade</span>
                    <span className="text-sm font-bold text-white/60">4.8★</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/decode");
                  }}
                  className="w-full mt-3 bg-[var(--primary)] py-2 rounded text-[var(--background-dark)] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                >
                  Extract Evidence
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[var(--primary)]" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative size-16 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-dashed border-[var(--primary)] rounded-full spinning-seal opacity-50" />
            <div className="absolute inset-2 border border-[var(--primary)] rounded-full flex items-center justify-center bg-[var(--primary)]/10 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,255,0.4)]">
              <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-2 pointer-events-none">
          <span className="text-[var(--primary)] font-bold tracking-[0.2em] md:tracking-[0.4em] text-xl md:text-3xl district-glow uppercase">
            Taipei
          </span>
          <span className="text-[8px] md:text-[10px] text-[var(--primary)]/40 font-mono tracking-widest uppercase">
            Forensic Node Active
          </span>
        </div>
      </div>

      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-start">
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

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 bg-[var(--clue-gold)]/10 border border-[var(--clue-gold)]/40 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.1)]">
            <Radar className="w-4 h-4 text-[var(--clue-gold)]" />
            <span className="text-xs font-black text-[var(--clue-gold)] tracking-widest uppercase">
              +50 CLUES
            </span>
          </div>
          <div
            onClick={() => router.push("/decode")}
            className="flex items-center gap-2 bg-red-600/20 border border-red-600/40 px-3 py-1 blinking-alert rounded-full cursor-pointer hover:bg-red-600/40 transition-colors"
          >
            <span className="text-red-500 text-xs">⚠️</span>
            <span className="text-[9px] font-black text-red-400 tracking-tighter uppercase">
              Hijack Available
            </span>
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
            <p className="text-[var(--reveal)] font-bold">&gt; CASE REVEAL: Shadow Kitchen Lab located.</p>
            <p className="text-[var(--primary)]/60">&gt; Indexing evidence fragments...</p>
            <p className="text-[var(--anomaly)]">&gt; ANOMALY: Metadata mismatch in node X-22.</p>
            <p className="text-[var(--clue-gold)] font-bold">&gt; CLUES: Forensic audit rewarded +15.0.</p>
            <p className="text-[var(--reveal)]">&gt; TRUTH UNLOCKED: Supply chain verified.</p>
            <p className="text-[var(--primary)]/60">&gt; Querying truth ledger L2...</p>
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
                &gt; Agent-#4492 cross-referenced receipt logs in Sector 04
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
              COORD: 25.033 / 121.565
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
      `}</style>
    </div>
  );
}
