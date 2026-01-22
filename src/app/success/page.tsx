"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Radar, Shield, Map } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPercent((p) => (p < 100 ? p + 2 : 100));
    }, 20);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-(--background-dark) overflow-hidden font-(family-name:--font-space-grotesk)">
      {/* Background Glitch Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,transparent_70%)]" />
      <div
        className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,255,255,0.05)_50%,transparent_100%)] animate-pulse"
        style={{ backgroundSize: "100% 4px" }}
      />

      <div className="z-10 max-w-2xl w-full p-4 md:p-8 text-center flex flex-col items-center gap-4 md:gap-8">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="absolute inset-0 animate-radar-ping border-2 md:border-4 border-(--primary) rounded-full" />
          <div className="size-20 md:size-32 rounded-full border-2 md:border-4 border-(--primary) flex items-center justify-center bg-(--primary)/10 shadow-[0_0_50px_rgba(0,255,255,0.4)]">
            <CheckCircle className="w-10 h-10 md:w-16 md:h-16 text-(--primary)" />
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            HIJACK <span className="text-(--primary)">SUCCESSFUL</span>
          </h1>
          <p className="text-(--primary) font-mono text-xs md:text-sm tracking-[0.3em] md:tracking-[0.5em] uppercase">
            Sector Ownership Transferred
          </p>
        </motion.div>

        {/* Transfer Progress */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-2 bg-black/40 border border-(--primary)/20 p-4 md:p-6 rounded-xl md:rounded-2xl backdrop-blur-xl"
        >
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-(--primary) font-bold uppercase tracking-widest">
              Ownership Data Transfer
            </span>
            <span className="text-xl font-mono text-white">{percent}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-(--primary) shadow-[0_0_10px_var(--primary)]"
              initial={{ width: "0%" }}
              animate={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-(--primary)/40 pt-1">
            <span>TX_HASH: 0x8a92...f2e1</span>
            <span>NODE: LUPIN_L2_MAIN</span>
          </div>
        </motion.div>

        {/* Reward Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-2 md:gap-4 w-full"
        >
          <div className="bg-(--primary)/5 border border-(--primary)/20 p-3 md:p-4 rounded-xl md:rounded-2xl flex flex-col items-center gap-1 group hover:border-(--primary) transition-all">
            <Radar className="w-5 h-5 md:w-6 md:h-6 text-(--primary)" />
            <span className="text-[8px] md:text-[10px] text-(--primary)/60 uppercase font-bold">Reward</span>
            <span className="text-base md:text-xl font-black text-white">+50 CLUES</span>
          </div>
          <div className="bg-(--clue-gold)/5 border border-(--clue-gold)/20 p-3 md:p-4 rounded-xl md:rounded-2xl flex flex-col items-center gap-1 group hover:border-(--clue-gold) transition-all">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-(--clue-gold)" />
            <span className="text-[8px] md:text-[10px] text-(--clue-gold)/60 uppercase font-bold">Reputation</span>
            <span className="text-base md:text-xl font-black text-white">+12.5 PTS</span>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          onClick={() => router.push("/map")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative px-6 md:px-12 h-12 md:h-16 bg-(--primary) text-(--background-dark) font-black text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase flex items-center justify-center rounded-xl md:rounded-2xl neon-glow hover:scale-105 transition-all overflow-hidden border-2 border-white/20"
        >
          <div className="absolute inset-0 shimmer-fast opacity-30" />
          <span className="relative z-10 flex items-center gap-2 md:gap-3 text-[10px] md:text-sm">
            BACK TO MAP
            <Map className="w-4 h-4 md:w-5 md:h-5" />
          </span>
        </motion.button>

        {/* Secondary Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-4 text-[9px] text-(--primary)/40 font-bold uppercase tracking-widest animate-pulse"
        >
          <span className="text-xs">ℹ️</span>
          New dining clues available in neighboring sectors
        </motion.div>
      </div>

      {/* Corner Watermarks */}
      <div className="absolute top-8 left-8 size-24 bg-(--primary)/10 rounded-full blur-xl" />
      <div className="absolute bottom-8 right-8 size-24 bg-(--primary)/10 rounded-full blur-xl" />
    </div>
  );
}
