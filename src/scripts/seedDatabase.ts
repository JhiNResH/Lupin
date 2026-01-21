// 種子數據導入腳本
// 執行: npx ts-node src/scripts/seedDatabase.ts

import { createClient } from "@supabase/supabase-js";
import { TAIPEI_SEED_DATA, convertToSupabaseFormat } from "../data/seedRestaurants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

async function seedDatabase() {
  console.log("🌱 開始導入台北 20 間熱門餐廳數據...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const restaurant of TAIPEI_SEED_DATA) {
    const data = convertToSupabaseFormat(restaurant);

    const { error } = await supabase
      .from("truth_reports")
      .upsert(data, { onConflict: "restaurant_id" });

    if (error) {
      console.log(`❌ 失敗: ${restaurant.name} - ${error.message}`);
      errorCount++;
    } else {
      console.log(`✅ 成功: ${restaurant.name} (${data.truth_score}★)`);
      successCount++;
    }
  }

  console.log(`\n📊 導入完成:`);
  console.log(`   成功: ${successCount}`);
  console.log(`   失敗: ${errorCount}`);
  console.log(`   總計: ${TAIPEI_SEED_DATA.length}`);
}

// 執行
seedDatabase().catch(console.error);
