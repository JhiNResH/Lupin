---
description: Lupin 開發工作流與技術規範
---

# Lupin 開發技能與技術架構 (2026 核心版)

執行任何 Lupin 相關開發時，請遵循以下規範：

---

## 1. 身份驗證與無感錢包 (Web3 Auth)

- **Privy SDK**: 核心登入方案。利用 `Social Login` 實現無助記詞開戶。
- **Delegated Actions**: 授權 Lupin Agent 在背景自動執行「聲譽簽名」，用戶無需手動確認。
- **Agent ID Logic**:
  - 利用 Privy `DID` 作為唯一標識
  - 後端自動生成 `Agent-#[4-digit]` 隨機代號並與錢包綁定
  - 使用 `src/hooks/useAgent.ts` 和 `src/lib/supabase.ts`

---

## 2. 鏈上證明與安全 (Attestation & Security)

- **Foundry / Solidity**: 開發部署於 **Base L2** 的 `LupinAttestation.sol` 合約
- **EAS (Ethereum Attestation Service)**:
  - 將真相報告的 `Hash` (SHA-256) 存入鏈上
  - 實現不可篡改的「真相時間戳記」
- **viem 整合**: 使用 `src/lib/contracts.ts` 中的 `submitTruthReport()` 函數

---

## 3. AI 真相引擎 (AI & Data Intelligence)

- **Google Gemini API (gemini-3-flash-preview)**:
  - OCR 辨識：提取發票收據中的店名、日期、消費金額
  - 真相報告生成：綜合多方數據，產出鑑識級別的評分摘要
- **pgvector (Supabase)**:
  - 存儲評論的 `Embeddings`
  - 執行向量相似度比對，抓取重複、模式化的洗分評論
- **Intelligence Layer**: 使用 `src/lib/intelligence.ts` 中的：
  - `getInitialData()` - 先查 DB，再抓 Web2 + Gemini 分析
  - `updateWithAgentReport()` - 用真實權重覆蓋 AI 預估

---

## 4. 前端與交互 (Mobile-First Web)

- **Next.js 15 (App Router)**: 利用 Server Components 處理數據聚合
- **Tailwind CSS + Lucide Icons**: 樣式與圖標
- **Framer Motion**:
  - 實作「偵探掃描」雷達動畫
  - 實作「Web2 分數劃掉 -> Lupin 真相印章蓋下」的衝擊性視覺
- **關鍵檔案**:
  - `src/app/page.tsx` - 首頁 (雷達掃描器)
  - `src/app/results/page.tsx` - 結果頁 (真相揭曉動畫)
  - `src/components/StatusHeader.tsx` - 頁首 + Privy 登入

---

## 5. 後端與數據庫 (Backend Infrastructure)

- **Supabase (PostgreSQL)**:
  - `agents` 表：存儲特工資料
  - `restaurant_intelligence` 表：餐廳真相分數
- **API Routes**:
  - `POST /api/scan` - 執行掃描分析
- **環境變數** (`.env.local`):
  ```
  NEXT_PUBLIC_PRIVY_APP_ID=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  GEMINI_API_KEY=
  ```

---

## 6. 開發範例 (Development Paradigms)

### 使用 TruthScoreEngine：

```typescript
import { TruthScoreEngine } from "@/lib/truthScoreEngine";

// 搜索餐廳並獲取分數
const result = await TruthScoreEngine.searchAndScore("麥當勞", "台北");
// result.isAIPredicted: true (無特工數據時)
// result.confidence: 0-100
// result.showSeal: true (當 confidence >= 80%)
```

### React Hook 用法：

```typescript
import { useTruthScore } from "@/hooks/useTruthScore";

function ResultsPage() {
  const { score, loading } = useTruthScore({
    restaurantName: "麥當勞",
    location: "台北",
    enableRealtime: true, // 實時訂閱更新
  });

  if (score?.isAIPredicted) {
    return <div>AI 鑑識預估中...</div>;
  }
  // score.showSeal 為 true 時顯示印章
}
```

### 特工上傳收據後：

```typescript
import { TruthScoreEngine } from "@/lib/truthScoreEngine";

const updated = await TruthScoreEngine.submitAgentReview(
  restaurantId,
  agentPrivyDid,
  agentId,
  truthScore, // 0-5
  receiptHash,
  reviewContent,
);
// updated.confidence 會自動更新
// 當 confidence >= 80% 時 showSeal = true
```

### 混合分數計算邏輯：

```typescript
import { calculateHybridScore } from "@/lib/truthScoreEngine";

const result = calculateHybridScore(
  aiScore, // AI 預估分 (0-5)
  agentScores, // [3.5, 4.0, 2.8, ...]
  verificationCount, // 收據驗證次數
);
// THRESHOLD = 50 次時達到 100% 特工權重
```

---

## 7. 約束條件 (Constraints)

1. **Privacy First**: 永不暴露原始收據圖片
2. **Mobile-First**: 響應式設計優先
3. **Optimistic UI**: 收據提交使用樂觀更新（先顯示成功，再等鏈上確認）
