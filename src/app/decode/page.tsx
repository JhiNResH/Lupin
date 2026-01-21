"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Receipt, User, CheckCircle, Radar } from "lucide-react";

type ForensicTool = "VIBE" | "PHOTO" | "RECEIPT" | null;

export default function DecodePage() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<ForensicTool>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [clues, setClues] = useState(12450);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      // Simulate completion on error for demo
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

  const handleDecode = () => {
    router.push("/success");
  };

  return (
    <div className="relative h-screen w-full flex flex-col font-[family-name:var(--font-space-grotesk)] bg-black text-white">
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
            <span className="hover:text-[var(--primary)] cursor-pointer transition-colors">
              Intel
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
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAY1i1ubGqUVJxhzYz4GR3QWWCq6kN2Gqa0m6a73szOcKQ6RhkARLdkfHUJKYVy_HTICXJdVe8CSVn5ptXSmCIcq7sVUxabBtpyNDFlY9Kpw8LAo-m9bM9koI-raoQj9r2QVEEEywONnberFK4FiVJ5mM4dmCAs8rGkbmk2By2ObRn7Ij_tdruWi6o0n2kT8WC28xE6ZA9EoWlX-UZrtesCpd9rYihg_0lhzgbF1-1OmdVbFirW3r2sQBUU9zdQSGmdNjDTP3FWXgM')`,
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
              <p className="text-[var(--reveal)] font-bold">&gt; CASE REVEAL: Shadow Kitchen Lab located.</p>
              <p className="text-[var(--primary)]/60">&gt; Indexing evidence fragments...</p>
              <p className="text-[var(--anomaly)]">&gt; ANOMALY: Metadata mismatch in node X-22.</p>
              <p className="text-[var(--clue-gold)] font-bold">&gt; CLUES: Forensic audit rewarded +15.0.</p>
              <p className="text-[var(--reveal)]">&gt; TRUTH UNLOCKED: Supply chain verified.</p>
              <p className="text-[var(--primary)]/60">&gt; Querying truth ledger L2...</p>
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
              <div className="bg-black/80 border-b border-white/10 px-8 py-4 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--primary)] text-xl">🍽️</span>
                  <span className="text-[10px] font-black tracking-[0.3em] text-[var(--primary)] uppercase">
                    Tactical Dining Forensic: Sector 4
                  </span>
                </div>
              </div>

              <div className="p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 bg-black/40">
                <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-2xl md:rounded-3xl border border-[var(--primary)]/20 overflow-hidden relative group shrink-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all scale-110"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCog5zcrobENKiVbmX5DcygeCD6ozZE5rR7ctQ9TCxw5d0AjR6YjEwShhKsTxvu8EDSk8J98YtvQl3jK8MuHkpUwYOws1Fdh54cl4SVUH1DjLEdBwebXzkfFhQrx2kz7b3ach8q9UK4xrwwFP2qAhW7slDXKn2M4gy3XY5ufEOmRhcU6_EdmdNOqLY-b7Zr87q4_thfqAqVi9TiMQrvxKgcbCphhyTd0C8CDBiwluwTn3xbtpysEiZhDQTmtloMLWtKPrIPLhGBw4o')`,
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white leading-none uppercase mb-2">
                      [DINING EVIDENCE DETECTED]
                      <br />
                      <span className="text-[var(--primary)] italic">Sector 4 - Xinyi District</span>
                    </h2>
                    <p className="hidden md:block text-[var(--primary)]/70 text-sm leading-relaxed font-medium mb-6">
                      The &quot;Michelin Secret&quot; is a PR fabrication. Our forensic kitchen audit reveals
                      synthetic ingredient origins and ghost-plating.
                    </p>

                    <div className="flex gap-3 overflow-x-auto pb-4">
                      <button
                        disabled={completed["VIBE"]}
                        onClick={() => simulateScan("VIBE", 5)}
                        className={`flex flex-col items-center gap-1 border p-2 rounded-lg min-w-[120px] transition-all ${
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
                        className={`flex flex-col items-center gap-1 border p-2 rounded-lg min-w-[120px] transition-all ${
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
                        onClick={() => simulateScan("RECEIPT", 50)}
                        className={`flex flex-col items-center gap-1 border p-2 rounded-lg min-w-[120px] transition-all ${
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
                          {completed["RECEIPT"] ? "VERIFIED" : "50 CLUES"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleDecode}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative h-12 md:h-16 bg-[var(--primary)] text-black font-black text-xs md:text-sm tracking-[0.15em] md:tracking-[0.2em] uppercase flex items-center justify-center rounded-xl md:rounded-2xl neon-glow hover:translate-y-[-2px] transition-all overflow-hidden border-2 border-white/20"
                  >
                    <div className="absolute inset-0 shimmer-fast opacity-30" />
                    <span className="relative z-10 flex items-center gap-3">
                      FINALISED FORENSIC DECODE
                      <CheckCircle className="w-5 h-5" />
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="z-50 bg-black border-t border-[var(--primary)]/10 px-8 py-3 flex justify-between items-center">
        <div className="flex gap-4">
          <button className="p-2 text-[var(--primary)]/40 hover:text-[var(--primary)] transition-colors">
            <Radar className="w-5 h-5" />
          </button>
        </div>
        <button className="flex items-center gap-2 px-6 h-10 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-full text-[var(--primary)] text-[10px] font-black tracking-[0.2em] hover:bg-[var(--primary)]/20 transition-all uppercase">
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
