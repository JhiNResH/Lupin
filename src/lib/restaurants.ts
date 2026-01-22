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

// 新增餐廳資料（舉報功能）
export async function createRestaurant(data: Partial<Restaurant>): Promise<{ success: boolean; id?: string }> {
  // 產生臨時 ID
  const tempId = `mock-submit-${Date.now()}`;
  
  // 填補預設值
  const newRestaurant: Restaurant = {
    id: tempId,
    restaurant_id: data.name?.toLowerCase().replace(/\s+/g, "-") || tempId,
    name: data.name || "Unknown Suspect",
    location: data.location || "Unknown Location",
    district: data.district || "Taipei",
    node_id: `P-${Math.floor(Math.random() * 999)}`, // Pending Node
    web2_facade: 5.0, // 預設滿分，顯示為剛被刷榜
    lupin_veracity: 0,
    bot_probability: Math.floor(Math.random() * 40) + 50, // 50-90% bot probability
    confidence: 0,
    status: "pending",
    verification_count: 0,
    clue_reward: 100, // 高額懸賞
    forensic_reveal: ["Pending forensic audit..."],
    analysis_summary: "User reported suspect. Investigation pending.",
    key_findings: ["User submitted evidence"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...data,
  };

  console.log("Mock creating restaurant:", newRestaurant);

  try {
    // 嘗試寫入 Supabase (如果不是 Mock ID 且環境變數存在)
    if (!isMockId(newRestaurant.id) && process.env.NEXT_PUBLIC_SUPABASE_URL) {
       const { data: inserted, error } = await supabase
        .from("restaurants")
        .insert([newRestaurant])
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, id: inserted.id };
    }
  } catch (error) {
    console.warn("Supabase create failed, falling back to mock success", error);
  }

  // Mock 模式永遠成功
  return { success: true, id: tempId };
}

// 根據行政區獲取餐廳
export async function getRestaurantsByDistrict(districtId: string): Promise<Restaurant[]> {
  try {
    // 從 Supabase 查詢
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      // 如果 districtId 存在且不是所有，則過濾
      .ilike('district', `%${districtId}%`) 
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.log(`Fetch failed for district ${districtId}, returning empty array`);
      return [];
    }

    return data as Restaurant[];
  } catch {
    return [];
  }
}
