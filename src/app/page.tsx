"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Radar, CheckCircle, Shield, BarChart3, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusHeader } from "@/components/StatusHeader";
import { CyberGrid } from "@/components/CyberGrid";
import { handleSearch } from "@/lib/searchEngine";

// Investigation log items
const LOG_ITEMS = [
  {
    label: "[CHECK]: Filtering out generic/paid reviews...",
    sub: "VERIFIED: Removed 1.2k suspicious automated patterns.",
  },
  {
    label: "[CHECK]: Verifying recent diner receipts...",
    sub: "CONFIRMED: 482 authentic visits validated this week.",
  },
  {
    label: "[CHECK]: Inspecting real-time store busyness...",
    sub: "LIVE: Moderate occupancy detected via occupancy sensors.",
  },
  {
    label: "[FINAL]: Truth score stabilized.",
    sub: "READY: Intelligence package compiled for review.",
    pulse: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");

  const handleScan = async () => {
    if (!searchQuery.trim()) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus("正在查詢資料庫...");

    try {
      // 1. 先查 Supabase - 使用新的 searchEngine
      const result = await handleSearch(searchQuery.trim(), "台灣");

      if (result.found && result.status === "instant") {
        // ✅ 秒開！資料庫中有現成數據
        setScanStatus("✅ 找到現成報告！");
        setScanProgress(100);
        
        setTimeout(() => {
          router.push(`/results?q=${encodeURIComponent(searchQuery)}&cached=true`);
        }, 500);
        return;
      }

      // 2. 沒找到 - 顯示掃描動畫，背景採集已啟動
      setScanStatus(result.message || "偵探掃描中...");

      // Animate progress
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 94) {
            clearInterval(interval);
            return 94;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Navigate after animation
      setTimeout(() => {
        clearInterval(interval);
        router.push(`/results?q=${encodeURIComponent(searchQuery)}&scanning=${result.status === "scanning" || result.status === "pending"}`);
      }, 2000);

    } catch (error) {
      console.error("Search error:", error);
      setScanStatus("搜尋失敗，使用 Mock 數據...");
      
      // Fallback to old behavior
      setTimeout(() => {
        router.push(`/results?q=${encodeURIComponent(searchQuery)}`);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[var(--background-dark)] text-white">
      {/* Animated Cyber Grid Background */}
      <CyberGrid />

      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col">
        <StatusHeader />

        <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
          {/* Title Section */}
          <div className="w-full max-w-3xl text-center mb-10">
            {/* Version Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--primary)]/20 bg-[var(--primary)]/5 rounded-full mb-6"
            >
              <span className="size-1.5 bg-[var(--primary)] rounded-full animate-pulse" />
              <span className="text-[var(--primary)] text-[10px] font-bold tracking-[0.3em] uppercase">
                Friendly Intelligence Engine v3.1
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="text-4xl md:text-5xl font-bold mb-10 tracking-tight text-white"
            >
              Lupin Helpful Investigator Scan
            </motion.h2>

            {/* Glowing Search Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group max-w-2xl mx-auto"
            >
              {/* Outer Glow */}
              <motion.div
                className="absolute -inset-2 bg-[var(--primary)]/15 rounded-2xl blur-2xl"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Input Container */}
              <div className="relative flex items-center bg-[var(--background-dark)]/95 border-2 border-[var(--primary)]/40 rounded-xl p-2 neon-glow focus-within:border-[var(--primary)] transition-all">
                <div className="px-5 text-[var(--primary)]">
                  <Search className="w-5 h-5" />
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  placeholder="Enter restaurant for a helpful truth check..."
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder:text-[var(--slate-silver)]/40 py-4 text-lg font-[family-name:var(--font-space-grotesk)]"
                />

                {/* Scan Button with Radar Animation */}
                <motion.button
                  onClick={handleScan}
                  disabled={isScanning}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative scan-button-prominent overflow-hidden"
                >
                  {/* Radar Ping Effect */}
                  <AnimatePresence>
                    {isScanning && (
                      <>
                        <motion.span
                          className="absolute inset-0 bg-[var(--background-dark)] rounded-xl"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 2, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <motion.span
                          className="absolute inset-0 bg-[var(--background-dark)] rounded-xl"
                          initial={{ scale: 1, opacity: 0.3 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                        />
                      </>
                    )}
                  </AnimatePresence>

                  <span className="relative z-10">
                    {isScanning ? "SCANNING" : "SCAN"}
                  </span>
                  <Radar className="relative z-10 w-5 h-5 font-bold" />
                </motion.button>
              </div>

              {/* Scan Status Display */}
              <AnimatePresence>
                {scanStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-8 left-0 right-0 text-center"
                  >
                    <span className="text-[var(--primary)] text-sm font-mono">
                      {scanStatus}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          {/* Investigation Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-5xl glass-panel rounded-xl p-8 relative overflow-hidden shadow-2xl"
          >
            {/* Scan Line Animation */}
            <motion.div
              className="absolute left-0 w-full h-px bg-[var(--primary)]/40 shadow-[0_0_20px_var(--primary)] z-20 pointer-events-none"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="grid md:grid-cols-5 gap-8 relative z-10">
              {/* Log Section */}
              <div className="md:col-span-3 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-[var(--primary)]/20 pb-4">
                  <div className="flex flex-col">
                    <span className="text-[var(--primary)] text-xs font-bold tracking-widest uppercase">
                      Investigation Status: Deep Scan
                    </span>
                    <span className="text-[var(--slate-silver)]/60 text-[10px] font-mono">
                      LOCATION: SECTOR_4_DISTRICT
                    </span>
                  </div>
                  <div className="text-right">
                    <motion.span
                      className="text-[var(--primary)] text-2xl font-bold"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {Math.round(scanProgress)}
                      <span className="text-sm">%</span>
                    </motion.span>
                  </div>
                </div>

                {/* Investigation Log Items */}
                <div className="space-y-4 font-mono">
                  {LOG_ITEMS.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + idx * 0.2 }}
                      className={`flex items-start gap-3 group ${
                        item.pulse ? "animate-pulse-slow" : ""
                      }`}
                    >
                      <CheckCircle className="text-[var(--cyber-green)] w-5 h-5 text-glow-green flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-[var(--cyber-green)] text-sm font-bold">
                          {item.label}
                        </span>
                        <span className="text-[var(--slate-silver)]/40 text-[10px]">
                          {item.sub}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[var(--primary)]/10 rounded-full overflow-hidden mt-4">
                  <motion.div
                    className="h-full bg-[var(--primary)] shadow-[0_0_15px_var(--primary)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${scanProgress || 94}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="md:col-span-2 grid grid-cols-1 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-5 rounded-lg group hover:border-[var(--primary)]/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-[var(--slate-silver)] uppercase tracking-[0.2em] font-bold">
                      Verified Sources
                    </span>
                    <Shield className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tighter">
                    856
                    <span className="text-[var(--primary)]/40 text-sm ml-2">
                      TRUSTED
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                  className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-5 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-[var(--slate-silver)] uppercase tracking-[0.2em] font-bold">
                      Confidence Level
                    </span>
                    <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div className="text-3xl font-bold text-[var(--primary)] tracking-tighter">
                    98.2%
                  </div>
                  <div className="mt-2 h-1 bg-[var(--primary)]/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "98.2%" }}
                      transition={{ delay: 1.3, duration: 1 }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="bg-red-500/5 border border-red-500/20 p-5 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-red-400/70 uppercase tracking-[0.2em] font-bold">
                      Bot Interference
                    </span>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-3xl font-bold text-red-500 tracking-tighter uppercase">
                    Low
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
