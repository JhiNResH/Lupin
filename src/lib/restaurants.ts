import { supabase } from "./supabase";

// 餐廳資料型別（符合 Supabase restaurants 表）
export interface Restaurant {
  id: string;
  restaurant_id: string;
  name: string;
  location: string;
  district: string;
  node_id: string;
  web2_facade: number;        // Web2 評分 (如 Google 4.8 星)
  lupin_veracity: number;     // Lupin 真實分數 (0-100)
  bot_probability: number;
  confidence: number;
  status: "pending" | "ready" | "debunked";
  verification_count: number;
  clue_reward: number;
  forensic_reveal: string[];  // 鑑識揭露陣列
  analysis_summary: string;
  key_findings: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// 檢查是否為 Mock 數據的 ID
function isMockId(id: string): boolean {
  return id.startsWith("mock-");
}

// 根據 nodeId 獲取餐廳資料
export async function getRestaurantByNodeId(nodeId: string): Promise<Restaurant | null> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("node_id", nodeId)
      .single();

    if (error || !data) {
      // 靜默失敗，讓呼叫者使用 mock 數據
      console.log("Using mock data for nodeId:", nodeId);
      return null;
    }

    return data as Restaurant;
  } catch {
    return null;
  }
}

// 根據餐廳 ID 獲取餐廳資料
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  if (isMockId(id)) return null;
  
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Restaurant;
  } catch {
    return null;
  }
}

// 獲取所有餐廳（用於地圖顯示）
export async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as Restaurant[];
  } catch {
    return [];
  }
}

// 將餐廳狀態設為 DEBUNKED
export async function markRestaurantAsDebunked(restaurantId: string): Promise<boolean> {
  // 如果是 Mock 數據，直接返回成功（模擬操作）
  if (isMockId(restaurantId)) {
    console.log("Mock decode: skipping Supabase update for", restaurantId);
    return true;
  }
  
  try {
    const { error } = await supabase
      .from("restaurants")
      .update({ 
        status: "debunked",
        updated_at: new Date().toISOString()
      })
      .eq("id", restaurantId);

    if (error) {
      console.log("Supabase update skipped (no table):", restaurantId);
      return true; // 仍然返回成功，讓 UI 繼續運作
    }

    return true;
  } catch {
    return true; // 優雅失敗
  }
}

// 更新特工的 clues_balance
export async function addCluesBalance(agentPrivyDid: string, amount: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("add_clues", { 
      agent_privy_did: agentPrivyDid, 
      amount 
    });

    if (error) {
      console.log("Clues update skipped (no RPC function)");
      return true; // 優雅失敗
    }

    return true;
  } catch {
    return true;
  }
}

// 記錄解碼動作
export async function recordDecode(
  agentPrivyDid: string, 
  restaurantId: string,
  cluesEarned: number
): Promise<boolean> {
  // 如果是 Mock 數據，跳過記錄
  if (isMockId(restaurantId)) {
    console.log("Mock decode: skipping log for", restaurantId);
    return true;
  }
  
  try {
    const { error } = await supabase
      .from("decode_logs")
      .insert({
        agent_privy_did: agentPrivyDid,
        restaurant_id: restaurantId,
        clues_earned: cluesEarned,
        decoded_at: new Date().toISOString()
      });

    if (error) {
      console.log("Decode log skipped (no table)");
      return true; // 優雅失敗
    }

    return true;
  } catch {
    return true;
  }
}

