"use client";

import { motion } from "framer-motion";
import { Shield, Receipt, Sparkles, Lock } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";

interface FirstVerifierCTAProps {
  restaurantName: string;
  restaurantId?: string;
  variant?: "card" | "inline" | "hero";
}

/**
 * 「成為第一位驗證者」CTA 組件
 * 當餐廳尚無特工驗證時顯示，誘導用戶參與
 */
export function FirstVerifierCTA({
  restaurantName,
  restaurantId,
  variant = "card",
}: FirstVerifierCTAProps) {
  const { login, authenticated } = usePrivy();

  const handleClick = () => {
    if (!authenticated) {
      login();
    } else {
      // TODO: 導向收據上傳頁面
      window.location.href = `/contribute?restaurant=${encodeURIComponent(restaurantName)}`;
    }
  };

  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--primary)]/50 bg-gradient-to-br from-[var(--primary)]/10 to-transparent p-8"
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-[var(--primary)]/5"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Mission Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--primary)]/10"
          >
            <Shield className="h-10 w-10 text-[var(--primary)]" />
          </motion.div>

          {/* Mission Text */}
          <h3 className="mb-2 text-xl font-bold uppercase tracking-widest text-[var(--primary)]">
            🔍 偵探任務：此處尚未被封印
          </h3>

          <p className="mb-6 max-w-md text-[var(--slate-silver)]/80">
            <span className="font-bold text-white">{restaurantName}</span>{" "}
            目前只有 AI 預估分數。成為第一位上傳收據的 Lupin 特工，解鎖真相並賺取聲譽值！
          </p>

          {/* CTA Button */}
          <motion.button
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-3 rounded-full bg-[var(--primary)] px-8 py-4 font-bold text-black shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all hover:shadow-[0_0_50px_rgba(0,255,255,0.6)]"
          >
            <Receipt className="h-5 w-5" />
            <span>上傳收據，成為第一位驗證者</span>
            <Sparkles className="h-5 w-5 animate-pulse" />
          </motion.button>

          {/* Reward hint */}
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--primary)]/60">
            <Lock className="h-3 w-3" />
            <span>第一位驗證者將獲得最高聲譽值加成</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/20">
            <Shield className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--primary)]">
              尚無特工驗證
            </div>
            <div className="text-xs text-[var(--slate-silver)]/60">
              成為第一位驗證者
            </div>
          </div>
        </div>
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-bold text-black"
        >
          <Receipt className="h-4 w-4" />
          上傳收據
        </motion.button>
      </motion.div>
    );
  }

  // Default: card variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-dashed border-[var(--primary)]/40 bg-black/40 p-6"
    >
      {/* Scan line animation */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-[var(--primary)]/30"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--primary)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
            偵探任務
          </span>
        </div>

        <h4 className="mb-2 text-lg font-bold text-white">
          此處尚未被封印
        </h4>

        <p className="mb-4 text-sm text-[var(--slate-silver)]/70">
          Agent，你是第一位掌握真相的人嗎？上傳發票驗證這間餐廳。
        </p>

        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 font-bold text-black"
        >
          <Receipt className="h-5 w-5" />
          成為第一位驗證者
        </motion.button>

        <div className="mt-3 text-center text-[10px] text-[var(--primary)]/50">
          賺取 $LUPIN 聲譽值
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 驗證人數顯示組件
 * 當已有特工驗證時顯示
 */
export function VerifierCount({
  count,
  showAddMore = true,
}: {
  count: number;
  showAddMore?: boolean;
}) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--cyber-green)]/30 bg-[var(--cyber-green)]/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cyber-green)]/20">
          <Shield className="h-5 w-5 text-[var(--cyber-green)]" />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--cyber-green)]">
            {count} 位 Lupin 特工已驗證
          </div>
          <div className="text-xs text-[var(--slate-silver)]/60">
            真相分數已獲得確認
          </div>
        </div>
      </div>
      {showAddMore && (
        <Link
          href="/contribute"
          className="flex items-center gap-2 rounded-full border border-[var(--cyber-green)]/30 px-4 py-2 text-xs font-bold text-[var(--cyber-green)] hover:bg-[var(--cyber-green)]/10 transition-colors"
        >
          <Receipt className="h-3 w-3" />
          加入驗證
        </Link>
      )}
    </div>
  );
}
