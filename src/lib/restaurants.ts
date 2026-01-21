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

// 根據 nodeId 獲取餐廳資料
export async function getRestaurantByNodeId(nodeId: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("node_id", nodeId)
    .single();

  if (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }

  return data as Restaurant;
}

// 根據餐廳 ID 獲取餐廳資料
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }

  return data as Restaurant;
}

// 獲取所有餐廳（用於地圖顯示）
export async function getAllRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }

  return data as Restaurant[];
}

// 將餐廳狀態設為 DEBUNKED
export async function markRestaurantAsDebunked(restaurantId: string): Promise<boolean> {
  const { error } = await supabase
    .from("restaurants")
    .update({ 
      status: "debunked",
      updated_at: new Date().toISOString()
    })
    .eq("id", restaurantId);

  if (error) {
    console.error("Error updating restaurant status:", error);
    return false;
  }

  return true;
}

// 更新特工的 clues_balance
export async function addCluesBalance(agentPrivyDid: string, amount: number): Promise<boolean> {
  const { error } = await supabase.rpc("add_clues", { 
    agent_privy_did: agentPrivyDid, 
    amount 
  });

  if (error) {
    console.error("Error adding clues:", error);
    return false;
  }

  return true;
}

// 記錄解碼動作
export async function recordDecode(
  agentPrivyDid: string, 
  restaurantId: string,
  cluesEarned: number
): Promise<boolean> {
  const { error } = await supabase
    .from("decode_logs")
    .insert({
      agent_privy_did: agentPrivyDid,
      restaurant_id: restaurantId,
      clues_earned: cluesEarned,
      decoded_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error recording decode:", error);
    return false;
  }

  return true;
}
