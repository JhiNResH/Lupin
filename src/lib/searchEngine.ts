import { supabase } from "./supabase";

// Truth Report type from database
export interface TruthReport {
  id: string;
  restaurant_id: string;
  name: string;
  location: string;
  // Scores
  web2_score: number;
  truth_score: number;
  bot_probability: number;
  confidence: number;
  // Status
  status: "pending" | "scanning" | "ready" | "verified";
  verification_count: number;
  // Analysis
  analysis_summary: string;
  key_findings: string[];
  evidence_items: {
    type: string;
    title: string;
    description: string;
  }[];
  // Timestamps
  created_at: string;
  updated_at: string;
  last_audit_at: string | null;
}

export interface SearchResult {
  found: boolean;
  report: TruthReport | null;
  status: "instant" | "scanning" | "pending";
  message: string;
}

/**
 * 優化的搜尋邏輯：先查庫，沒有就觸發採集
 * 參考 Perplexity 模式：已有數據秒開，沒有就背景採集
 */
export async function handleSearch(
  restaurantName: string,
  location: string = "unknown"
): Promise<SearchResult> {
  const restaurantId = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}_${location.toLowerCase().replace(/\s+/g, "-")}`;

  // 1. 從 Supabase 找現成的真相報告
  const { data: report, error } = await supabase
    .from("truth_reports")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .single();

  if (report && !error) {
    // 找到了！秒開，體驗極好
    console.log(`✅ Cache hit: ${restaurantName}`);
    return {
      found: true,
      report: report as TruthReport,
      status: "instant",
      message: "真相報告已就緒",
    };
  }

  // 2. 沒有現成報告 - 檢查是否正在掃描中
  const { data: pendingReport } = await supabase
    .from("truth_reports")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "scanning")
    .single();

  if (pendingReport) {
    // 正在掃描中，返回掃描狀態
    console.log(`⏳ Scanning in progress: ${restaurantName}`);
    return {
      found: false,
      report: pendingReport as TruthReport,
      status: "scanning",
      message: "偵探掃描中，請稍候...",
    };
  }

  // 3. 完全沒有數據 - 創建待處理記錄並觸發背景採集
  console.log(`🔍 New restaurant: ${restaurantName} - triggering audit`);

  // 創建初始記錄（狀態為 scanning）
  const initialReport: Partial<TruthReport> = {
    restaurant_id: restaurantId,
    name: restaurantName,
    location,
    web2_score: 0,
    truth_score: 0,
    bot_probability: 0,
    confidence: 0,
    status: "scanning",
    verification_count: 0,
    analysis_summary: "AI 偵探正在掃描中...",
    key_findings: [],
    evidence_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_audit_at: null,
  };

  await supabase.from("truth_reports").upsert(initialReport);

  // 4. 觸發背景審計任務（非阻塞）
  triggerBackgroundAudit(restaurantId, restaurantName, location);

  return {
    found: false,
    report: initialReport as TruthReport,
    status: "pending",
    message: "已啟動偵探掃描，稍後自動更新",
  };
}

/**
 * 觸發背景審計任務
 * 這是異步的，用戶不需要在頁面死等
 */
async function triggerBackgroundAudit(
  restaurantId: string,
  restaurantName: string,
  location: string
): Promise<void> {
  try {
    // 調用內部 API 啟動審計任務
    const response = await fetch("/api/audit/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, restaurantName, location }),
    });

    if (!response.ok) {
      console.error("Failed to trigger background audit");
    }
  } catch (error) {
    console.error("Background audit trigger error:", error);
  }
}

/**
 * 訂閱報告狀態更新（用於 UI 實時更新）
 */
export function subscribeToReportUpdates(
  restaurantId: string,
  onUpdate: (report: TruthReport) => void
) {
  const subscription = supabase
    .channel(`report-${restaurantId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "truth_reports",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as TruthReport);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * 檢查報告是否已就緒
 */
export async function checkReportStatus(
  restaurantId: string
): Promise<TruthReport | null> {
  const { data } = await supabase
    .from("truth_reports")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .single();

  return data as TruthReport | null;
}
