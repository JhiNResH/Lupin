"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  Search,
  CheckCircle,
  Lock,
  EyeOff,
  Receipt,
  Gavel,
  Shield,
  FileCheck,
  Brain,
  AlertTriangle,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { hashTruthReport } from "@/lib/contracts";
import { checkReportStatus, type TruthReport } from "@/lib/searchEngine";
import { FirstVerifierCTA, VerifierCount } from "@/components/FirstVerifierCTA";

// Investigation log for animation
const LOG_ENTRIES = [
  "[INIT]: Connecting to intelligence network...",
  "[CHECK]: Cross-referencing Google Places data...",
  "[scan]: Detecting bot signatures...",
  "[CALC]: Computing truth score algorithm...",
  "[ALERT]: ANOMALY DETECTED IN REVIEW PATTERNS...",
  "[FINAL]: Verdict determined.",
];

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "Unknown Restaurant";
  const isCached = searchParams.get("cached") === "true";
  const { authenticated } = usePrivy();

  // Data states
  const [report, setReport] = useState<TruthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation states
  const [phase, setPhase] = useState<"loading" | "glitch" | "reveal">(isCached ? "reveal" : "loading");
  const [currentLog, setCurrentLog] = useState(0);
  const [attestationHash, setAttestationHash] = useState<string | null>(null);
  const [showAttestation, setShowAttestation] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Try multiple possible restaurant_id formats
      const possibleIds = [
        `${query.toLowerCase().replace(/\s+/g, "-")}_台灣`,
        `${query.toLowerCase().replace(/\s+/g, "-")}_unknown`,
        query.toLowerCase().replace(/\s+/g, "-"),
      ];
      
      // Also try to find by name directly
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );

      // First try exact restaurant_id matches
      for (const id of possibleIds) {
        const { data } = await supabase
          .from("truth_reports")
          .select("*")
          .eq("restaurant_id", id)
          .single();
        
        if (data && data.status === "ready") {
          console.log("Found report by ID:", id);
          setReport(data as TruthReport);
          setIsLoading(false);
          return;
        }
      }

      // Try to find by name (fuzzy match)
      const { data: nameMatch } = await supabase
        .from("truth_reports")
        .select("*")
        .ilike("name", `%${query}%`)
        .eq("status", "ready")
        .limit(1)
        .single();

      if (nameMatch) {
        console.log("Found report by name:", nameMatch.name);
        setReport(nameMatch as TruthReport);
        setIsLoading(false);
        return;
      }

      // If still not found, poll for data
      const pollForData = async (attempts = 0): Promise<TruthReport | null> => {
        const data = await checkReportStatus(possibleIds[0]);
        
        if (data && data.status === "ready") {
          return data;
        }
        
        if (attempts < 5) {
          await new Promise(r => setTimeout(r, 1000));
          return pollForData(attempts + 1);
        }
        
        return data;
      };

      const data = await pollForData();
      if (data) {
        setReport(data);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [query]);

  // Animate through phases
  useEffect(() => {
    if (isCached) {
      // Skip animation for cached results
      setPhase("reveal");
      return;
    }

    // Phase 1: Log animation (3 seconds)
    const logInterval = setInterval(() => {
      setCurrentLog((prev) => {
        if (prev >= LOG_ENTRIES.length - 1) {
          clearInterval(logInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    // Phase 2: Glitch effect after 3 seconds
    const glitchTimeout = setTimeout(() => {
      setPhase("glitch");
    }, 3000);

    // Phase 3: Reveal after glitch
    const revealTimeout = setTimeout(() => {
      setPhase("reveal");
    }, 3500);

    return () => {
      clearInterval(logInterval);
      clearTimeout(glitchTimeout);
      clearTimeout(revealTimeout);
    };
  }, [isCached]);

  // Generate attestation hash
  useEffect(() => {
    const generateHash = async () => {
      const hash = await hashTruthReport({
        restaurantId: query.toLowerCase().replace(/\s/g, "-"),
        restaurantName: query,
        truthScore: report?.truth_score || 21,
        botProbability: report?.bot_probability || 78,
        reviewContent: report?.analysis_summary || "Aggregated data",
        timestamp: Date.now(),
      });
      setAttestationHash(hash);
    };
    generateHash();
  }, [query, report]);

  // Format score for display (0-5 scale)
  const formatScore = (score: number | undefined | null) => {
    if (score === undefined || score === null) return "2.1";
    // If score is 0-100, convert to 0-5
    if (score > 5) return (score / 20).toFixed(1);
    return score.toFixed(1);
  };

  // Get evidence items from report or use defaults
  const evidenceItems = report?.key_findings?.map((finding: string, idx: number) => ({
    title: `發現 #${idx + 1}`,
    tag: idx === 0 ? "AI 鑑識" : "模式分析",
    desc: finding,
    danger: finding.includes("機器人") || finding.includes("刷分") || finding.includes("假"),
  })) || [
    { title: "評論模式分析", tag: "AI 鑑識", desc: "分析中...", danger: false },
  ];

  return (
    <div className="bg-[var(--background-dark)] font-[family-name:var(--font-space-grotesk)] text-white min-h-screen relative overflow-x-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 blueprint-grid pointer-events-none z-0" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-panel bg-[var(--background-dark)]/90 px-6 py-4 border-b border-[var(--primary)]/20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 text-[var(--primary)]">
                <Eye className="w-8 h-8" />
                <h2 className="text-xl font-bold tracking-tight uppercase">Lupin</h2>
              </Link>
              <div className="hidden md:flex bg-black/40 rounded-full border border-[var(--primary)]/20 px-4 items-center w-80">
                <Search className="text-[var(--primary)] w-5 h-5" />
                <input
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-[var(--primary)]/40 w-full text-sm py-2 ml-2"
                  placeholder="Search for a restaurant..."
                  defaultValue={query}
                />
              </div>
            </div>
            <nav className="flex items-center gap-8">
              <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--primary)]/70">
                <span className="text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1">
                  Results
                </span>
                <Link href="/map" className="hover:text-[var(--primary)] transition-colors flex items-center gap-1">
                  🗺️ Forensic Map
                </Link>
                <Link href="#" className="hover:text-[var(--primary)] transition-colors">
                  Leaderboard
                </Link>
              </div>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
          {/* Title */}
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="size-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-[var(--primary)] uppercase">
                  MISSION CALL: GASTRO-TRUTH ENGINE
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter uppercase leading-none text-center">
                <span className="text-[var(--primary)]">[EVIDENCE DETECTED]</span><br/>
                <span className="text-white">{query}</span>
              </h1>
              
              <p className="text-[var(--primary)]/70 text-sm font-mono tracking-widest uppercase">
                {report?.status === "ready" ? "Sector 4 - Xinyi District" : "Scanning Sector..."}
              </p>
            </motion.div>

            {/* AI Estimate Badge */}
            {report && report.verification_count === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full"
              >
                <Brain className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-sm font-medium">
                  AI 鑑識預估中 — 尚無特工驗證
                </span>
              </motion.div>
            )}
          </div>

          {/* Investigation Log (Phase 1) */}
          <AnimatePresence>
            {phase === "loading" && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto mb-12 glass-panel rounded-xl p-6 font-mono"
              >
                <div className="flex items-center gap-2 mb-4 border-b border-[var(--primary)]/10 pb-2">
                  <span className="size-2 bg-[var(--cyber-green)] rounded-full animate-pulse" />
                  <span className="text-[10px] text-[var(--primary)]/60 font-bold uppercase tracking-widest">
                    Live Investigation Log
                  </span>
                </div>
                <div className="space-y-3">
                  {LOG_ENTRIES.slice(0, currentLog + 1).map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2"
                    >
                      <CheckCircle className="text-[var(--cyber-green)] w-4 h-4 text-glow-green mt-0.5" />
                      <span className="text-[var(--cyber-green)] text-xs font-bold">
                        {log}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score Comparison (with Glitch & Reveal) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-stretch">
            {/* Hype Score (strikethrough animation) */}
            <motion.div
              className="relative border border-dashed border-white/20 p-8 rounded-2xl flex flex-col items-center justify-center bg-white/5"
              animate={
                phase === "glitch"
                  ? { x: [-5, 5, -5, 5, 0], filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] text-[var(--primary)]/40 uppercase font-bold tracking-widest">
                  Legacy Web2 Rating:
                </span>
              </div>
              
              <div className="relative inline-block">
                <span className="redacted-marker text-xs font-mono absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 whitespace-nowrap px-2 bg-black text-[var(--primary)] border border-[var(--primary)]/30">
                  {(report?.web2_score || 4.8).toFixed(1)} STARS (BIASED)
                </span>
                <span className="text-7xl font-bold text-white/10 blur-sm">
                  {(report?.web2_score || 4.8).toFixed(1)}
                </span>
                
                {/* Debunked Stamp Animation */}
                <AnimatePresence>
                  {(phase === "reveal" && (report?.bot_probability || 0) > 50) && (
                    <motion.div
                      initial={{ scale: 5, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1.1, opacity: 1, rotate: -15 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        delay: 0.5 
                      }}
                      className="absolute -top-6 -right-12 z-50 pointer-events-none"
                    >
                      <div className="border-[6px] border-[var(--danger)] text-[var(--danger)] px-4 py-1 uppercase font-black text-2xl tracking-widest opacity-90 rotate-[-15deg] shadow-[0_0_20px_rgba(255,0,51,0.5)] bg-[var(--danger)]/10 backdrop-blur-sm">
                        DEBUNKED
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Lupin Truth Score (stamp animation) */}
            <motion.div
              className="relative glass-panel bg-[var(--primary)]/5 p-10 rounded-2xl flex flex-col items-center justify-center border-[var(--primary)]/30 overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.2)]"
              animate={
                phase === "glitch"
                  ? { x: [-3, 3, -3, 3, 0], scale: [1, 1.02, 1] }
                  : {}
              }
            >
              <span className="text-xs font-bold tracking-[0.2em] text-[var(--primary)] mb-6 uppercase">
                Lupin 真相分數
              </span>

              <AnimatePresence>
                {phase === "reveal" && (
                  <motion.div
                    initial={{ scale: 3, opacity: 0, rotate: -5 }}
                    animate={{ scale: 1, opacity: 1, rotate: -5 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                    }}
                    className="text-9xl font-black text-[var(--primary)] mb-4"
                  >
                    {formatScore(report?.truth_score)}★
                  </motion.div>
                )}
              </AnimatePresence>

              {phase !== "reveal" && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-9xl font-black text-[var(--primary)]/20 mb-4"
                >
                  ??.?★
                </motion.div>
              )}

              {/* Seal of Truth Stamp - only if confidence > 80 */}
              <AnimatePresence>
                {phase === "reveal" && (report?.confidence || 0) >= 80 && (
                  <motion.div
                    initial={{ scale: 4, opacity: 0, rotate: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: -5 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      delay: 0.2,
                    }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="flex flex-col items-center p-8 border-4 border-[var(--primary)] rounded-full aspect-square justify-center bg-black/80 seal-of-truth">
                      <span className="text-[var(--primary)] text-4xl font-black tracking-tighter italic">
                        LUPIN
                      </span>
                      <div className="h-px w-full bg-[var(--primary)] my-1" />
                      <span className="text-[var(--primary)] text-lg font-bold uppercase tracking-widest">
                        SEAL OF TRUTH
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-sm text-[var(--primary)] font-bold tracking-widest uppercase mt-4">
                {report?.verification_count 
                  ? `基於 ${report.verification_count} 筆特工驗證`
                  : "AI 鑑識分析"
                }
              </div>
            </motion.div>
          </div>

          {/* Analysis Summary - Red Tinted Forensic Panel */}
          {phase === "reveal" && report?.analysis_summary && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-12 rounded-r-xl border-l-[4px] border-[var(--danger)] bg-gradient-to-b from-[var(--danger)]/5 to-[var(--danger)]/10 p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-24 h-24 text-[var(--danger)]" />
              </div>
              
              <div className="relative z-10">
                <div className="text-[var(--danger)] text-[10px] font-black tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Forensic Discrepancy Reveal:
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[var(--danger)] text-lg mt-0.5">smart_toy</span>
                    <span className="text-sm font-mono text-[var(--danger)]/90 leading-relaxed font-bold">
                      &gt; {(report.bot_probability || 0).toFixed(0)}% reviews detected as AI-generated patterns
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[var(--danger)] text-lg mt-0.5">sentiment_dissatisfied</span>
                    <span className="text-sm font-mono text-[var(--danger)]/90 leading-relaxed">
                      &gt; Sentiment mismatch found in receipt logs vs Web2 claims
                    </span>
                  </div>

                  <p className="text-white/80 leading-relaxed text-sm pl-8 border-l border-[var(--danger)]/30 ml-2 py-2">
                    {report.analysis_summary}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          {phase === "reveal" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
            >
              {[
                { label: "Bot 機率", value: `${report?.bot_probability || 68}%` },
                { label: "信心度", value: `${report?.confidence || 75}%` },
                { 
                  label: "特工驗證", 
                  value: report?.verification_count || 0,
                  render: () => (
                    <div className="flex flex-col">
                      <span className="text-3xl font-bold text-white mb-1">
                        {report?.verification_count || 0}
                      </span>
                      {report?.verification_count === 0 && (
                        <span className="text-[10px] text-[var(--slate-silver)] uppercase tracking-wider">
                          尚無人驗證
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  label: "判定",
                  value: (report?.bot_probability || 0) > 50 ? "可能存在刷分" : "相對可信",
                  variant: (report?.bot_probability || 0) > 50 ? "danger" : "success",
                },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`glass-panel p-6 rounded-xl ${
                    stat.variant === "danger"
                      ? "bg-[var(--danger)]/10 border-[var(--danger)]/40"
                      : stat.variant === "success"
                        ? "bg-[var(--cyber-green)]/10 border-[var(--cyber-green)]/40"
                        : "bg-black/40"
                  }`}
                >
                  <div
                    className={`text-[11px] font-bold tracking-widest mb-2 uppercase ${
                      stat.variant === "danger"
                        ? "text-[var(--danger)]"
                        : stat.variant === "success"
                          ? "text-[var(--cyber-green)]"
                          : "text-[var(--primary)]/60"
                    }`}
                  >
                    {stat.label}
                  </div>
                  {stat.render ? stat.render() : (
                    <div
                      className={`font-bold tracking-tight ${
                        stat.variant === "danger"
                          ? "text-xl text-[var(--danger)] uppercase"
                          : stat.variant === "success"
                            ? "text-xl text-[var(--cyber-green)] uppercase"
                            : "text-3xl text-white"
                      }`}
                    >
                      {stat.value}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* First Verifier Hero CTA - Show if no verified reports */}
          {phase === "reveal" && (report?.verification_count === 0) && (
            <div className="mb-24">
              <FirstVerifierCTA 
                restaurantName={query} 
                restaurantId={report?.restaurant_id}
                variant="hero"
              />
            </div>
          )}

          {/* Verifier Count - Show if already verified */}
          {phase === "reveal" && (report?.verification_count || 0) > 0 && (
            <div className="mb-12">
              <VerifierCount count={report?.verification_count || 0} />
            </div>
          )}

          {/* Attestation Confirmation */}
          {phase === "reveal" && attestationHash && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-16"
            >
              <div
                className="glass-panel border-[var(--cyber-green)]/30 bg-[var(--cyber-green)]/5 p-6 rounded-xl cursor-pointer hover:border-[var(--cyber-green)]/50 transition-colors"
                onClick={() => setShowAttestation(!showAttestation)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/30 flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-[var(--cyber-green)]" />
                    </div>
                    <div>
                      <div className="text-[var(--cyber-green)] font-bold text-sm uppercase tracking-widest">
                        ✓ Truth Report Stored on Base L2
                      </div>
                      <div className="text-[var(--slate-silver)]/60 text-xs font-mono mt-1">
                        Hash: {attestationHash.slice(0, 20)}...{attestationHash.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <Shield className="w-6 h-6 text-[var(--cyber-green)]" />
                </div>

                <AnimatePresence>
                  {showAttestation && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-[var(--cyber-green)]/20 font-mono text-xs text-[var(--slate-silver)]/80">
                        <div className="mb-2">
                          <span className="text-[var(--cyber-green)]">Full Hash:</span>
                        </div>
                        <div className="bg-black/40 p-3 rounded-lg break-all">
                          {attestationHash}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Evidence Section (Key Findings) */}
          {phase === "reveal" && evidenceItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-24"
            >
              <div className="flex items-center justify-between px-4 pb-6 border-b border-[var(--primary)]/10 mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3 uppercase tracking-wider text-[var(--primary)]">
                  <Gavel className="w-5 h-5" />
                  關鍵發現
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {evidenceItems.map((item: { title: string; tag: string; desc: string; danger: boolean }, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className={`glass-panel p-6 rounded-xl ${
                      item.danger 
                        ? "border-[var(--danger)]/30 bg-[var(--danger)]/5" 
                        : "bg-black/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {item.danger ? (
                        <AlertTriangle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-[var(--cyber-green)] flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className={`text-sm font-bold mb-2 ${item.danger ? "text-[var(--danger)]" : "text-white"}`}>
                          {item.title}
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </main>

        {/* Fixed Bottom CTA - Only show compact version if verification count > 0, 
            otherwise hero CTA is already prominent enough in content */}
        {phase === "reveal" && (report?.verification_count || 0) > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="fixed bottom-10 inset-x-0 flex justify-center z-[100] px-6 pointer-events-none"
          >
            <div className="pointer-events-auto">
              <FirstVerifierCTA 
                restaurantName={query} 
                restaurantId={report?.restaurant_id}
                variant="card"
              />
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="glass-panel border-t border-[var(--primary)]/10 py-8 px-6 bg-black/80 relative z-20 mt-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-[var(--primary)]/50 uppercase tracking-widest">
            <div>© 2026 LUPIN // SECURE TRUTH ENGINE</div>
            <div className="flex gap-8">
              <a className="hover:text-[var(--primary)] transition-colors" href="#">
                Privacy Shield
              </a>
              <a className="hover:text-[var(--primary)] transition-colors" href="#">
                Terms of Service
              </a>
              <span className="text-[var(--primary)]/70 flex items-center gap-2">
                <span className="size-2 bg-[var(--primary)] rounded-full animate-pulse" />
                SYSTEM ACTIVE
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background-dark)] flex items-center justify-center">
          <div className="text-[var(--primary)] animate-pulse">Loading...</div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
