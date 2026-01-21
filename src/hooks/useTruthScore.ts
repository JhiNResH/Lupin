"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TruthScoreEngine,
  type TruthScoreResult,
} from "@/lib/truthScoreEngine";

interface UseTruthScoreOptions {
  restaurantName: string;
  location: string;
  enableRealtime?: boolean;
}

interface UseTruthScoreReturn {
  score: TruthScoreResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * React Hook for using TruthScoreEngine
 * Provides real-time updates when new agent reviews are submitted
 */
export function useTruthScore({
  restaurantName,
  location,
  enableRealtime = true,
}: UseTruthScoreOptions): UseTruthScoreReturn {
  const [score, setScore] = useState<TruthScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    if (!restaurantName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await TruthScoreEngine.searchAndScore(
        restaurantName,
        location
      );
      setScore(result);
    } catch (err) {
      console.error("useTruthScore error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch score");
    } finally {
      setLoading(false);
    }
  }, [restaurantName, location]);

  // Initial fetch
  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  // Real-time subscription
  useEffect(() => {
    if (!score?.restaurantId || !enableRealtime) return;

    const unsubscribe = TruthScoreEngine.subscribeToScoreChanges(
      score.restaurantId,
      (updatedScore) => {
        setScore(updatedScore);
      }
    );

    return unsubscribe;
  }, [score?.restaurantId, enableRealtime]);

  return {
    score,
    loading,
    error,
    refresh: fetchScore,
  };
}

/**
 * Helper component props for displaying trust score
 */
export interface TruthScoreDisplayProps {
  score: TruthScoreResult;
}

/**
 * Get status label in Chinese
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "VERIFIED_BY_LUPIN":
      return "LUPIN 完全驗證";
    case "HIGHLY_VERIFIED":
      return "高度驗證";
    case "PARTIAL_VERIFIED":
      return "部分驗證";
    case "AI_ANALYZING":
    default:
      return "AI 鑑識預估中";
  }
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "VERIFIED_BY_LUPIN":
      return "text-[var(--cyber-green)]";
    case "HIGHLY_VERIFIED":
      return "text-[var(--primary)]";
    case "PARTIAL_VERIFIED":
      return "text-yellow-400";
    case "AI_ANALYZING":
    default:
      return "text-[var(--slate-silver)]";
  }
}
