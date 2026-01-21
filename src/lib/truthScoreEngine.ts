import { supabase } from "./supabase";

/**
 * Lupin 分數切換與加權邏輯
 */
export function calculateHybridScore(
  aiScore: number, // AI 預估分 (0-5)
  agentScores: number[], // 特工實證分數陣列
  verificationCount: number // 該店總共被驗證(收據)的次數
) {
  // 1. 設定權重閾值：例如當驗證次數達到 50 次時，完全信任特工數據
  const THRESHOLD = 50;

  // 2. 計算特工權重 (W_agent)
  // 隨著驗證次數增加，權重線性從 0 升至 1
  const agentWeight = Math.min(verificationCount / THRESHOLD, 1);
  const aiWeight = 1 - agentWeight;

  // 3. 計算特工平均實證分
  const avgAgentScore =
    agentScores.length > 0
      ? agentScores.reduce((a, b) => a + b) / agentScores.length
      : aiScore; // 若無特工數據，先暫用 AI 分

  // 4. 加權計算最終分數
  const finalScore = avgAgentScore * agentWeight + aiScore * aiWeight;

  return {
    finalScore: parseFloat(finalScore.toFixed(1)),
    isAIPredicted: agentWeight < 0.2, // 權重太低時標記為「AI 預測中」
    confidence: Math.round(agentWeight * 100), // 信心度即為權重百分比
    status:
      agentWeight >= 1
        ? "VERIFIED_BY_LUPIN"
        : agentWeight >= 0.8
          ? "HIGHLY_VERIFIED"
          : agentWeight >= 0.2
            ? "PARTIAL_VERIFIED"
            : "AI_ANALYZING",
  };
}

// Types for database tables
export interface AIPrediction {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  location: string;
  ai_score: number; // 0-5 scale
  bot_probability: number;
  web2_score: number;
  analysis_summary: string;
  created_at: string;
  updated_at: string;
}

export interface AgentReview {
  id: string;
  restaurant_id: string;
  agent_id: string;
  agent_privy_did: string;
  truth_score: number; // 0-5 scale
  receipt_hash: string;
  review_content: string;
  verified_at: string;
  attestation_tx_hash: string | null;
  created_at: string;
}

export interface TruthScoreResult {
  restaurantId: string;
  restaurantName: string;
  location: string;
  // Scores
  aiScore: number;
  agentScores: number[];
  finalScore: number;
  // Status
  verificationCount: number;
  confidence: number;
  status: string;
  isAIPredicted: boolean;
  showSeal: boolean; // True when confidence >= 80%
  // Metadata
  web2Score: number;
  botProbability: number;
  analysisSummary: string;
  lastUpdated: string;
}

/**
 * TruthScoreEngine - 核心真相分數引擎
 * 從 Supabase 讀取 ai_prediction 和 agent_reviews 表
 * 動態計算混合分數
 */
export class TruthScoreEngine {
  /**
   * 獲取餐廳的完整真相分數
   */
  static async getRestaurantScore(
    restaurantId: string
  ): Promise<TruthScoreResult | null> {
    try {
      // 1. 獲取 AI 預測數據
      const { data: aiPrediction, error: aiError } = await supabase
        .from("ai_prediction")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .single();

      if (aiError || !aiPrediction) {
        console.log("No AI prediction found for:", restaurantId);
        return null;
      }

      // 2. 獲取所有特工評論
      const { data: agentReviews, error: reviewsError } = await supabase
        .from("agent_reviews")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      const reviews = agentReviews || [];
      const agentScores = reviews.map((r: AgentReview) => r.truth_score);
      const verificationCount = reviews.length;

      // 3. 計算混合分數
      const hybridResult = calculateHybridScore(
        aiPrediction.ai_score,
        agentScores,
        verificationCount
      );

      // 4. 組裝結果
      return {
        restaurantId,
        restaurantName: aiPrediction.restaurant_name,
        location: aiPrediction.location,
        aiScore: aiPrediction.ai_score,
        agentScores,
        finalScore: hybridResult.finalScore,
        verificationCount,
        confidence: hybridResult.confidence,
        status: hybridResult.status,
        isAIPredicted: hybridResult.isAIPredicted,
        showSeal: hybridResult.confidence >= 80, // 信心度 >= 80% 顯示印章
        web2Score: aiPrediction.web2_score,
        botProbability: aiPrediction.bot_probability,
        analysisSummary: aiPrediction.analysis_summary,
        lastUpdated: aiPrediction.updated_at,
      };
    } catch (error) {
      console.error("TruthScoreEngine error:", error);
      return null;
    }
  }

  /**
   * 搜索餐廳並獲取分數（如果沒有數據則創建 AI 預測）
   */
  static async searchAndScore(
    restaurantName: string,
    location: string
  ): Promise<TruthScoreResult> {
    const restaurantId = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}_${location.toLowerCase().replace(/\s+/g, "-")}`;

    // 嘗試獲取現有分數
    const existing = await this.getRestaurantScore(restaurantId);
    if (existing) {
      return existing;
    }

    // 否則創建新的 AI 預測（這裡應該調用 Gemini API）
    // 暫時使用 mock 數據
    const mockAIScore = 2.1; // Mock AI score
    const mockWeb2Score = 4.7;
    const mockBotProbability = 68;

    // 插入 AI 預測
    await supabase.from("ai_prediction").upsert({
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      location,
      ai_score: mockAIScore,
      web2_score: mockWeb2Score,
      bot_probability: mockBotProbability,
      analysis_summary: "AI forensic analysis indicates high manipulation probability.",
      updated_at: new Date().toISOString(),
    });

    // 返回結果（無特工數據）
    const hybridResult = calculateHybridScore(mockAIScore, [], 0);

    return {
      restaurantId,
      restaurantName,
      location,
      aiScore: mockAIScore,
      agentScores: [],
      finalScore: hybridResult.finalScore,
      verificationCount: 0,
      confidence: hybridResult.confidence,
      status: hybridResult.status,
      isAIPredicted: true,
      showSeal: false,
      web2Score: mockWeb2Score,
      botProbability: mockBotProbability,
      analysisSummary: "AI forensic analysis in progress...",
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 特工上傳收據後觸發 - 添加新評論並重新計算分數
   */
  static async submitAgentReview(
    restaurantId: string,
    agentPrivyDid: string,
    agentId: string,
    truthScore: number,
    receiptHash: string,
    reviewContent: string,
    attestationTxHash?: string
  ): Promise<TruthScoreResult | null> {
    try {
      // 1. 插入新的特工評論
      const { error: insertError } = await supabase
        .from("agent_reviews")
        .insert({
          restaurant_id: restaurantId,
          agent_id: agentId,
          agent_privy_did: agentPrivyDid,
          truth_score: truthScore,
          receipt_hash: receiptHash,
          review_content: reviewContent,
          verified_at: new Date().toISOString(),
          attestation_tx_hash: attestationTxHash || null,
        });

      if (insertError) {
        console.error("Failed to insert agent review:", insertError);
        return null;
      }

      // 2. 重新計算分數
      const updatedScore = await this.getRestaurantScore(restaurantId);

      // 3. 更新 AI 預測表的 updated_at
      if (updatedScore) {
        await supabase
          .from("ai_prediction")
          .update({ updated_at: new Date().toISOString() })
          .eq("restaurant_id", restaurantId);
      }

      console.log(
        `✅ Agent review submitted: ${restaurantId} | New confidence: ${updatedScore?.confidence}%`
      );

      return updatedScore;
    } catch (error) {
      console.error("submitAgentReview error:", error);
      return null;
    }
  }

  /**
   * 獲取餐廳的所有特工評論（用於 UI 顯示）
   */
  static async getAgentReviews(restaurantId: string): Promise<AgentReview[]> {
    const { data, error } = await supabase
      .from("agent_reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch agent reviews:", error);
      return [];
    }

    return data || [];
  }

  /**
   * 訂閱餐廳分數變化（實時更新）
   */
  static subscribeToScoreChanges(
    restaurantId: string,
    callback: (score: TruthScoreResult) => void
  ) {
    // 訂閱 agent_reviews 表的變化
    const subscription = supabase
      .channel(`score-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_reviews",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async () => {
          // 當有新評論時，重新獲取分數
          const updatedScore = await this.getRestaurantScore(restaurantId);
          if (updatedScore) {
            callback(updatedScore);
          }
        }
      )
      .subscribe();

    // 返回取消訂閱的函數
    return () => {
      supabase.removeChannel(subscription);
    };
  }
}

// Export types
export type { TruthScoreResult as TruthScore };
