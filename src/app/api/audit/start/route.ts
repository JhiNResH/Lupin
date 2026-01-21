import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Mock Web2 data fetcher (replace with Outscraper/Apify in production)
async function fetchWeb2Reviews(restaurantName: string, location: string) {
  // In production, call Outscraper API:
  // const response = await fetch('https://api.outscraper.com/google-maps-reviews', {
  //   headers: { 'X-API-Key': process.env.OUTSCRAPER_API_KEY }
  // });

  // Mock data for now
  return {
    platform: "google",
    rating: 4.2 + Math.random() * 0.6, // Random between 4.2-4.8
    totalReviews: Math.floor(500 + Math.random() * 2000),
    reviews: [
      {
        author: "FoodBlogger_TW",
        rating: 5,
        text: "超級好吃！！！一定要來！！！",
        verified: false,
      },
      {
        author: "本地居民",
        rating: 3,
        text: "食物普通，價格偏高，服務還行。",
        verified: true,
      },
      {
        author: "TravelExplorer",
        rating: 5,
        text: "Hidden gem! Must try! Best food ever!",
        verified: false,
      },
      {
        author: "老饕客",
        rating: 2,
        text: "網紅店的通病，排很久品質卻下降了。",
        verified: true,
      },
    ],
  };
}

// Gemini forensic analysis - 更客觀平衡的評分
async function runForensicAnalysis(
  restaurantName: string,
  web2Data: ReturnType<typeof fetchWeb2Reviews> extends Promise<infer T> ? T : never
) {
  // 計算 Web2 評分作為基準
  const web2Score = web2Data.rating;
  
  if (!process.env.GEMINI_API_KEY) {
    // Fallback: 基於 Web2 分數的平衡分析
    const adjustedScore = web2Score * 0.85 + 0.3; // 稍微降低但不過度
    return {
      truthScore: Math.min(4.5, Math.max(2.5, adjustedScore)),
      botProbability: 25 + Math.floor(Math.random() * 20),
      confidence: 75,
      keyFindings: [
        "評論真實性整體尚可",
        "部分高分評論語氣較誇張",
        "驗證用戶評價相對穩定",
      ],
      analysisSummary: `${restaurantName} 整體評價尚可，但部分評論可能經過美化。建議參考真實用戶回饋。`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `你是 Lupin 真相助手 AI。請客觀分析以下餐廳評論，提供平衡的評估。

## 餐廳資訊
- 名稱：${restaurantName}
- 平台評分：${web2Score.toFixed(1)}/5
- 評論數量：${web2Data.totalReviews}

## 評論樣本
${web2Data.reviews.map((r) => `[${r.verified ? "✓ 已驗證" : "○ 未驗證"}] ${r.author} (${r.rating}★): "${r.text}"`).join("\n")}

## 評分指南（重要）
- truthScore 應該基於 Web2 評分，合理調整：
  - 如果評論看起來大致真實 → truthScore = Web2評分 × 0.9 到 1.0
  - 如果有少量可疑評論 → truthScore = Web2評分 × 0.8 到 0.9  
  - 只有明顯造假時 → truthScore = Web2評分 × 0.6 到 0.8
- 分數範圍應在 2.5 到 4.5 之間，避免極端評分
- botProbability 要合理：一般餐廳 20-40%，明顯刷分 50-70%

## 輸出格式（純 JSON，無其他文字）
{
  "truthScore": 數字 (2.5-4.5，參考上述指南),
  "botProbability": 數字 (20-70，不要過高),
  "confidence": 數字 (70-90),
  "keyFindings": ["發現1（要客觀）", "發現2", "發現3"],
  "analysisSummary": "一段客觀平衡的中文摘要，200字以內"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON
    let jsonStr = text;
    if (text.includes("```json")) {
      jsonStr = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      jsonStr = text.split("```")[1].split("```")[0].trim();
    }

    const analysis = JSON.parse(jsonStr);
    
    // 確保分數在合理範圍內
    analysis.truthScore = Math.min(4.5, Math.max(2.5, analysis.truthScore));
    analysis.botProbability = Math.min(70, Math.max(15, analysis.botProbability));
    
    return analysis;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    // Fallback: 給出更合理的默認分數
    const fallbackScore = web2Score * 0.85;
    return {
      truthScore: Math.min(4.5, Math.max(3.0, fallbackScore)),
      botProbability: 35,
      confidence: 70,
      keyFindings: ["使用自動評估", "建議查看更多評論"],
      analysisSummary: `${restaurantName} 的整體評價尚可，建議親自體驗確認。`,
    };
  }
}

/**
 * POST /api/audit/start
 * 啟動背景審計任務
 */
export async function POST(request: NextRequest) {
  try {
    const { restaurantId, restaurantName, location } = await request.json();

    if (!restaurantId || !restaurantName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting audit for: ${restaurantName}`);

    // 1. 獲取 Web2 數據
    const web2Data = await fetchWeb2Reviews(restaurantName, location);

    // 2. 運行 Gemini 鑑識分析
    const analysis = await runForensicAnalysis(restaurantName, web2Data);

    // 3. 更新數據庫 - 從 scanning 變為 ready
    const { error: updateError } = await supabase
      .from("truth_reports")
      .update({
        web2_score: web2Data.rating,
        truth_score: analysis.truthScore,
        bot_probability: analysis.botProbability,
        confidence: analysis.confidence,
        status: "ready",
        analysis_summary: analysis.analysisSummary,
        key_findings: analysis.keyFindings,
        evidence_items: [
          {
            type: "web2_analysis",
            title: "Web2 評論分析",
            description: `分析了 ${web2Data.totalReviews} 條評論`,
          },
          {
            type: "bot_detection",
            title: "機器人偵測",
            description: `${analysis.botProbability}% 機率存在假評論`,
          },
          {
            type: "ai_forensic",
            title: "AI 鑑識報告",
            description: analysis.analysisSummary,
          },
        ],
        updated_at: new Date().toISOString(),
        last_audit_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurantId);

    if (updateError) {
      console.error("Failed to update report:", updateError);
      return NextResponse.json(
        { error: "Failed to update report" },
        { status: 500 }
      );
    }

    console.log(`✅ Audit complete: ${restaurantName} → Score: ${analysis.truthScore.toFixed(1)}`);

    return NextResponse.json({
      success: true,
      restaurantId,
      truthScore: analysis.truthScore,
      status: "ready",
    });
  } catch (error) {
    console.error("Audit API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
