"use client";

import { useState, useEffect, useCallback } from "react";
import {
  handleSearch,
  subscribeToReportUpdates,
  type TruthReport,
  type SearchResult,
} from "@/lib/searchEngine";

interface UseSearchOptions {
  enableRealtime?: boolean;
  autoRetry?: boolean;
  retryInterval?: number;
}

interface UseSearchReturn {
  search: (restaurantName: string, location?: string) => Promise<void>;
  result: SearchResult | null;
  report: TruthReport | null;
  isSearching: boolean;
  isScanning: boolean;
  isReady: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * React Hook for smart search with real-time updates
 * - 先查庫，有就秒開
 * - 沒有就顯示掃描中，背景採集
 * - 實時訂閱更新
 */
export function useSearch({
  enableRealtime = true,
  autoRetry = true,
  retryInterval = 3000,
}: UseSearchOptions = {}): UseSearchReturn {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [report, setReport] = useState<TruthReport | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived states
  const isScanning = result?.status === "scanning" || result?.status === "pending";
  const isReady = result?.status === "instant" || report?.status === "ready";

  // Search function
  const search = useCallback(
    async (restaurantName: string, location: string = "unknown") => {
      if (!restaurantName.trim()) {
        setError("請輸入餐廳名稱");
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResult = await handleSearch(restaurantName, location);
        setResult(searchResult);
        setReport(searchResult.report);

        console.log(`Search result: ${searchResult.status}`);
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "搜尋失敗");
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Real-time subscription for scanning reports
  useEffect(() => {
    if (!enableRealtime || !report?.restaurant_id || report.status === "ready") {
      return;
    }

    console.log(`Subscribing to updates: ${report.restaurant_id}`);

    const unsubscribe = subscribeToReportUpdates(
      report.restaurant_id,
      (updatedReport) => {
        console.log(`Report updated: ${updatedReport.status}`);
        setReport(updatedReport);

        if (updatedReport.status === "ready") {
          setResult((prev) =>
            prev ? { ...prev, status: "instant", found: true } : null
          );
        }
      }
    );

    return unsubscribe;
  }, [enableRealtime, report?.restaurant_id, report?.status]);

  // Auto-retry for scanning reports (fallback if realtime fails)
  useEffect(() => {
    if (!autoRetry || !isScanning || !report?.restaurant_id) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const { checkReportStatus } = await import("@/lib/searchEngine");
        const updated = await checkReportStatus(report.restaurant_id);

        if (updated && updated.status === "ready") {
          setReport(updated);
          setResult((prev) =>
            prev ? { ...prev, status: "instant", found: true } : null
          );
        }
      } catch (err) {
        console.error("Auto-retry error:", err);
      }
    }, retryInterval);

    return () => clearInterval(interval);
  }, [autoRetry, isScanning, report?.restaurant_id, retryInterval]);

  // Reset function
  const reset = useCallback(() => {
    setResult(null);
    setReport(null);
    setError(null);
  }, []);

  return {
    search,
    result,
    report,
    isSearching,
    isScanning,
    isReady,
    error,
    reset,
  };
}
