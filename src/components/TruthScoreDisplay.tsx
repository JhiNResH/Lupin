"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Brain, CheckCircle2, AlertTriangle } from "lucide-react";
import type { TruthScoreResult } from "@/lib/truthScoreEngine";
import { getStatusLabel, getStatusColor } from "@/hooks/useTruthScore";

interface TruthScoreDisplayProps {
  score: TruthScoreResult;
  showAnimation?: boolean;
}

/**
 * 動態真相分數顯示組件
 * - 顯示 AI 預估 vs 特工驗證分數
 * - 動態信心度百分比
 * - 當信心度 >= 80% 顯示 LUPIN SEAL OF TRUTH
 */
export function TruthScoreDisplay({
  score,
  showAnimation = true,
}: TruthScoreDisplayProps) {
  const statusLabel = getStatusLabel(score.status);
  const statusColor = getStatusColor(score.status);

  return (
    <div className="relative">
      {/* Status Badge */}
      <motion.div
        initial={showAnimation ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 mb-4"
      >
        {score.isAIPredicted ? (
          <Brain className="w-4 h-4 text-[var(--slate-silver)] animate-pulse" />
        ) : (
          <Shield className="w-4 h-4 text-[var(--primary)]" />
        )}
        <span
          className={`text-xs font-bold tracking-[0.2em] uppercase ${statusColor}`}
        >
          {statusLabel}
        </span>
      </motion.div>

      {/* Main Score Display */}
      <div className="relative flex flex-col items-center">
        {/* Web2 Score (strikethrough if verified) */}
        <AnimatePresence>
          {!score.isAIPredicted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="absolute -top-8 text-2xl font-bold text-white/30 line-through"
            >
              {score.web2Score.toFixed(1)}★
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Score */}
        <motion.div
          initial={showAnimation ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className={`text-7xl font-black ${
            score.showSeal ? "text-[var(--primary)]" : "text-white"
          }`}
        >
          {score.finalScore.toFixed(1)}★
        </motion.div>

        {/* Score Source Indicator */}
        <div className="mt-2 text-xs text-[var(--slate-silver)]/60">
          {score.isAIPredicted ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              基於 AI 鑑識分析
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[var(--cyber-green)]" />
              基於 {score.verificationCount} 筆特工驗證
            </span>
          )}
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mt-6 w-full max-w-xs mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--slate-silver)]">
            信心度 (Certainty)
          </span>
          <motion.span
            key={score.confidence}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-sm font-bold ${
              score.confidence >= 80
                ? "text-[var(--cyber-green)]"
                : score.confidence >= 40
                  ? "text-[var(--primary)]"
                  : "text-[var(--slate-silver)]"
            }`}
          >
            {score.confidence}%
          </motion.span>
        </div>
        <div className="h-2 w-full bg-[var(--primary)]/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${score.confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              score.confidence >= 80
                ? "bg-[var(--cyber-green)] shadow-[0_0_10px_var(--cyber-green)]"
                : "bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]"
            }`}
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-[var(--slate-silver)]/40">
          <span>AI 預估</span>
          <span>特工驗證</span>
        </div>
      </div>

      {/* LUPIN SEAL OF TRUTH - Only shows when confidence >= 80% */}
      <AnimatePresence>
        {score.showSeal && (
          <motion.div
            initial={{ scale: 3, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -5 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 12,
              delay: 0.3,
            }}
            className="absolute -top-4 -right-4 pointer-events-none z-20"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[var(--primary)]/30 blur-xl rounded-full" />

              {/* Seal */}
              <div className="relative flex flex-col items-center p-4 border-4 border-[var(--primary)] rounded-full aspect-square justify-center bg-black/90 shadow-[0_0_30px_rgba(0,255,255,0.4)]">
                <span className="text-[var(--primary)] text-xl font-black tracking-tighter italic">
                  LUPIN
                </span>
                <div className="h-px w-full bg-[var(--primary)] my-0.5" />
                <span className="text-[var(--primary)] text-[8px] font-bold uppercase tracking-widest">
                  SEAL OF TRUTH
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Progress Message */}
      {!score.showSeal && score.verificationCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <span className="text-[10px] text-[var(--primary)]/60">
            還需 {Math.ceil((0.8 - score.confidence / 100) * 50)} 筆驗證即可獲得 LUPIN 認證印章
          </span>
        </motion.div>
      )}

      {/* Call to Action for AI-only scores */}
      {score.isAIPredicted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <span className="text-[10px] text-[var(--slate-silver)]/60 italic">
            成為第一位驗證這間餐廳的 Lupin 特工！
          </span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Compact version for cards and lists
 */
export function TruthScoreBadge({
  score,
  size = "md",
}: {
  score: TruthScoreResult;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold ${sizeClasses[size]} text-[var(--primary)]`}>
        {score.finalScore.toFixed(1)}★
      </span>
      {score.showSeal && (
        <div className="w-6 h-6 rounded-full border border-[var(--primary)] flex items-center justify-center bg-[var(--primary)]/10">
          <Shield className="w-3 h-3 text-[var(--primary)]" />
        </div>
      )}
      {score.isAIPredicted && (
        <Brain className="w-4 h-4 text-[var(--slate-silver)] animate-pulse" />
      )}
    </div>
  );
}
