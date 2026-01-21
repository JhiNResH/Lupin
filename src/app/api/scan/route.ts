import { NextRequest, NextResponse } from "next/server";
import { getInitialData } from "@/lib/intelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantName, location } = body;

    if (!restaurantName) {
      return NextResponse.json(
        { error: "Restaurant name is required" },
        { status: 400 }
      );
    }

    // Use getInitialData to check DB first, then fetch Web2 + AI analysis
    const { intelligence, isNewAnalysis, source } = await getInitialData(
      restaurantName,
      location || "Unknown"
    );

    // Build response based on intelligence data
    return NextResponse.json({
      success: true,
      restaurantId: intelligence.restaurant_id,
      restaurantName: intelligence.restaurant_name,
      location: intelligence.location,

      // Scores
      truthScore: intelligence.final_truth_score,
      botProbability: intelligence.ai_bot_probability ?? 50,
      hypeScore: intelligence.web2_score,
      realScore: (intelligence.final_truth_score / 20).toFixed(1), // Convert 0-100 to 0-5 scale

      // Metadata
      isAiEstimate: intelligence.is_ai_estimate,
      verifiedReportCount: intelligence.verified_report_count,
      source,
      isNewAnalysis,

      // Confidence based on source
      confidence: source === "agent_verified" 
        ? 95 + Math.min(intelligence.verified_report_count, 5)
        : 75,

      keyFindings: intelligence.is_ai_estimate
        ? [
            "⚠️ This is an AI estimate - no agent reports yet",
            `Web2 platforms show ${intelligence.web2_score.toFixed(1)}★ average`,
            `AI detected ${intelligence.ai_bot_probability}% bot probability`,
          ]
        : [
            `✅ Verified by ${intelligence.verified_report_count} Lupin agents`,
            `Original Web2 score: ${intelligence.web2_score.toFixed(1)}★`,
            `Agent-verified truth score: ${intelligence.verified_truth_score}`,
          ],

      verdict: intelligence.is_ai_estimate
        ? "AI estimate only - be the first agent to verify!"
        : "Agent-verified truth score available",

      evidenceItems: [
        {
          type: "data_source",
          title: source === "agent_verified" ? "Agent Verified" : "AI Analysis",
          description:
            source === "agent_verified"
              ? `Based on ${intelligence.verified_report_count} verified receipt upload(s)`
              : "Based on Web2 data forensic analysis",
        },
        {
          type: "web2_comparison",
          title: "Web2 vs Truth Score",
          description: `Platform: ${intelligence.web2_score.toFixed(1)}★ → Lupin: ${(intelligence.final_truth_score / 20).toFixed(1)}★`,
        },
        {
          type: "bot_detection",
          title: "Bot Pattern Analysis",
          description: `${intelligence.ai_bot_probability}% probability of fake/bot reviews detected`,
        },
      ],

      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { error: "Failed to process scan request" },
      { status: 500 }
    );
  }
}
