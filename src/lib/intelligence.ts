import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Restaurant intelligence type
export interface RestaurantIntelligence {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  location: string;
  // Web2 hype score (from Google/Yelp)
  web2_score: number;
  web2_review_count: number;
  // AI-generated temporary score (when no agent data)
  ai_truth_score: number | null;
  ai_bot_probability: number | null;
  ai_analysis_timestamp: string | null;
  // Agent-verified score (overrides AI when available)
  verified_truth_score: number | null;
  verified_report_count: number;
  // Final score (uses verified if available, else AI)
  final_truth_score: number;
  is_ai_estimate: boolean;
  created_at: string;
  updated_at: string;
}

// Mock Web2 API response
interface Web2ReviewData {
  platform: string;
  rating: number;
  totalReviews: number;
  reviews: {
    author: string;
    rating: number;
    text: string;
    timestamp: number;
    verified: boolean;
  }[];
}

// Forensic analysis prompt for Gemini - 更客觀平衡的版本
const FORENSIC_ANALYSIS_PROMPT = `You are Lupin's Truth Assistant. Provide balanced, objective analysis of restaurant reviews.

## Scoring Guidelines (IMPORTANT)
- truthScore should be based on Web2 rating with reasonable adjustments:
  - If reviews appear mostly genuine → truthScore = Web2 rating × 0.9 to 1.0
  - If some suspicious reviews → truthScore = Web2 rating × 0.8 to 0.9
  - Only for obvious manipulation → truthScore = Web2 rating × 0.6 to 0.8
- Score range should be 50-90 (mapped to 2.5-4.5 on 5-point scale)
- botProbability should be reasonable: typical 20-40%, suspicious 50-70%

## Analysis Framework:
1. Review authenticity patterns (balanced view)
2. Verified vs unverified reviewer comparison
3. Temporal distribution analysis
4. Language pattern detection

Return ONLY valid JSON (no markdown):
{
  "truthScore": number (50-90, based on guidelines above),
  "botProbability": number (20-70, be reasonable),
  "confidenceLevel": number (70-90),
  "keyPatterns": ["finding1 (objective)", "finding2", "finding3"],
  "forensicSummary": "balanced analysis paragraph in Chinese, under 200 chars",
  "recommendedAction": "trust" | "verify" | "caution"
}`;

// Fetch mock Web2 data (Google Places, Yelp, etc.)
async function fetchWeb2Data(
  restaurantName: string,
  location: string
): Promise<Web2ReviewData[]> {
  // In production, integrate with:
  // - Google Places API
  // - Yelp Fusion API
  // - TripAdvisor API
  // - Outscraper/Apify for scraping

  // Mock data simulating Web2 platforms
  return [
    {
      platform: "google",
      rating: 4.7,
      totalReviews: 2847,
      reviews: [
        {
          author: "FoodInfluencer_88",
          rating: 5,
          text: "OMG AMAZING!!! Best food EVER!!! Must try!!!",
          timestamp: Date.now() - 86400000,
          verified: false,
        },
        {
          author: "LocalDiner42",
          rating: 2,
          text: "Waited 45min for cold ramen. Portion shrunk since they went viral.",
          timestamp: Date.now() - 172800000,
          verified: true,
        },
        {
          author: "TasteExplorer2024",
          rating: 5,
          text: "Hidden gem! Best kept secret! Must visit!",
          timestamp: Date.now() - 259200000,
          verified: false,
        },
        {
          author: "HonestReview_TW",
          rating: 3,
          text: "Food is decent but overpriced for the quality. Service was slow.",
          timestamp: Date.now() - 345600000,
          verified: true,
        },
      ],
    },
    {
      platform: "yelp",
      rating: 4.5,
      totalReviews: 1203,
      reviews: [
        {
          author: "YelpElite_Jane",
          rating: 5,
          text: "Absolutely incredible experience! Will definitely return!",
          timestamp: Date.now() - 432000000,
          verified: true,
        },
        {
          author: "Skeptic_Eater",
          rating: 2,
          text: "Overhyped. Food was mediocre at best. Not worth the wait.",
          timestamp: Date.now() - 518400000,
          verified: true,
        },
      ],
    },
  ];
}

// Run AI forensic analysis on Web2 data using Gemini
async function runForensicAnalysis(
  restaurantName: string,
  web2Data: Web2ReviewData[]
): Promise<{
  truthScore: number;
  botProbability: number;
  confidenceLevel: number;
  keyPatterns: string[];
  forensicSummary: string;
  recommendedAction: string;
}> {
  // Default fallback if Gemini is not available
  const fallbackAnalysis = {
    truthScore: 45,
    botProbability: 65,
    confidenceLevel: 75,
    keyPatterns: [
      "High ratio of generic 5-star reviews",
      "Verified local diners report lower satisfaction",
      "Review velocity spike after influencer posts",
    ],
    forensicSummary:
      "Analysis indicates significant manipulation patterns. Authentic local reviews suggest actual experience quality is substantially lower than platform ratings.",
    recommendedAction: "caution" as const,
  };

  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY found, using fallback analysis");
    return fallbackAnalysis;
  }

  try {
    const allReviews = web2Data.flatMap((d) => d.reviews);
    const avgRating =
      web2Data.reduce((sum, d) => sum + d.rating, 0) / web2Data.length;
    const totalReviews = web2Data.reduce((sum, d) => sum + d.totalReviews, 0);

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `${FORENSIC_ANALYSIS_PROMPT}

Analyze: ${restaurantName}

Web2 Platform Data:
- Average Rating: ${avgRating.toFixed(1)}/5
- Total Reviews: ${totalReviews}
- Platforms: ${web2Data.map((d) => d.platform).join(", ")}

Sample Reviews:
${allReviews
  .map(
    (r) =>
      `[${r.verified ? "VERIFIED" : "UNVERIFIED"}] ${r.author} (${r.rating}★): "${r.text}"`
  )
  .join("\n")}

Provide your forensic analysis as JSON only.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = text;
    if (text.includes("```json")) {
      jsonStr = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      jsonStr = text.split("```")[1].split("```")[0].trim();
    }

    const analysis = JSON.parse(jsonStr);
    return {
      truthScore: analysis.truthScore ?? fallbackAnalysis.truthScore,
      botProbability: analysis.botProbability ?? fallbackAnalysis.botProbability,
      confidenceLevel: analysis.confidenceLevel ?? fallbackAnalysis.confidenceLevel,
      keyPatterns: analysis.keyPatterns ?? fallbackAnalysis.keyPatterns,
      forensicSummary: analysis.forensicSummary ?? fallbackAnalysis.forensicSummary,
      recommendedAction: analysis.recommendedAction ?? fallbackAnalysis.recommendedAction,
    };
  } catch (error) {
    console.error("Gemini forensic analysis error:", error);
    return fallbackAnalysis;
  }
}

// Main function: Get initial data for a restaurant
export async function getInitialData(
  restaurantName: string,
  location: string
): Promise<{
  intelligence: RestaurantIntelligence;
  isNewAnalysis: boolean;
  source: "cached" | "ai_estimate" | "agent_verified";
}> {
  const restaurantId = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}_${location.toLowerCase().replace(/\s+/g, "-")}`;

  // Step 1: Check if we have existing data in Supabase
  const { data: existingData } = await supabase
    .from("restaurant_intelligence")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .single();

  if (existingData) {
    // Check if we have agent-verified data
    if (existingData.verified_report_count > 0) {
      return {
        intelligence: existingData as RestaurantIntelligence,
        isNewAnalysis: false,
        source: "agent_verified",
      };
    }

    // Return cached AI estimate if recent (within 24 hours)
    const analysisAge =
      Date.now() - new Date(existingData.ai_analysis_timestamp).getTime();
    if (analysisAge < 24 * 60 * 60 * 1000) {
      return {
        intelligence: existingData as RestaurantIntelligence,
        isNewAnalysis: false,
        source: "cached",
      };
    }
  }

  // Step 2: Fetch Web2 data
  const web2Data = await fetchWeb2Data(restaurantName, location);
  const avgWeb2Score =
    web2Data.reduce((sum, d) => sum + d.rating, 0) / web2Data.length;
  const totalReviews = web2Data.reduce((sum, d) => sum + d.totalReviews, 0);

  // Step 3: Run AI forensic analysis with Gemini
  const forensicResult = await runForensicAnalysis(restaurantName, web2Data);

  // Step 4: Create or update intelligence record
  const intelligenceRecord: Partial<RestaurantIntelligence> = {
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    location,
    web2_score: avgWeb2Score,
    web2_review_count: totalReviews,
    ai_truth_score: forensicResult.truthScore,
    ai_bot_probability: forensicResult.botProbability,
    ai_analysis_timestamp: new Date().toISOString(),
    verified_truth_score: existingData?.verified_truth_score || null,
    verified_report_count: existingData?.verified_report_count || 0,
    // Use verified score if available, otherwise AI estimate
    final_truth_score:
      existingData?.verified_report_count > 0
        ? existingData.verified_truth_score!
        : forensicResult.truthScore,
    is_ai_estimate: !(existingData?.verified_report_count > 0),
    updated_at: new Date().toISOString(),
  };

  // Upsert to Supabase
  const { data: savedData, error } = await supabase
    .from("restaurant_intelligence")
    .upsert(intelligenceRecord, { onConflict: "restaurant_id" })
    .select()
    .single();

  if (error) {
    console.error("Failed to save intelligence:", error);
  }

  return {
    intelligence: (savedData || intelligenceRecord) as RestaurantIntelligence,
    isNewAnalysis: true,
    source: "ai_estimate",
  };
}

// Function to update with agent-verified data (called after receipt upload)
export async function updateWithAgentReport(
  restaurantId: string,
  agentTruthScore: number,
  reportHash: string
): Promise<RestaurantIntelligence | null> {
  // Get existing data
  const { data: existing } = await supabase
    .from("restaurant_intelligence")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .single();

  if (!existing) {
    console.error("Restaurant not found:", restaurantId);
    return null;
  }

  // Calculate new verified score (weighted average with existing)
  const currentCount = existing.verified_report_count || 0;
  const currentScore = existing.verified_truth_score || agentTruthScore;

  // Weighted average: new reports have more weight initially
  const newCount = currentCount + 1;
  const weight = Math.min(0.4, 1 / newCount); // New report weight (max 40%)
  const newVerifiedScore = Math.round(
    currentScore * (1 - weight) + agentTruthScore * weight
  );

  // Update record - verified score now overrides AI estimate
  const { data: updated, error } = await supabase
    .from("restaurant_intelligence")
    .update({
      verified_truth_score: newVerifiedScore,
      verified_report_count: newCount,
      final_truth_score: newVerifiedScore, // Override AI with verified
      is_ai_estimate: false,
      updated_at: new Date().toISOString(),
    })
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update with agent report:", error);
    return null;
  }

  console.log(
    `✅ Agent report applied: ${restaurantId} | AI: ${existing.ai_truth_score} → Verified: ${newVerifiedScore}`
  );

  return updated as RestaurantIntelligence;
}
