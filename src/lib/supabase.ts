import { createClient } from "@supabase/supabase-js";

// Supabase client (use environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate a unique Agent ID
export function generateAgentId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `Agent-#${randomNum}`;
}

// Agent type definition
export interface Agent {
  id: string;
  privy_did: string;
  agent_id: string;
  wallet_address: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  truth_reports_count: number;
  stones_balance: number;
}

// Create or get an Agent based on Privy DID
export async function getOrCreateAgent(
  privyDid: string,
  walletAddress?: string,
  displayName?: string,
  avatarUrl?: string
): Promise<Agent | null> {
  try {
    // First, try to find existing agent
    const { data: existingAgent, error: findError } = await supabase
      .from("agents")
      .select("*")
      .eq("privy_did", privyDid)
      .single();

    if (existingAgent && !findError) {
      // Update wallet address if it changed
      if (walletAddress && existingAgent.wallet_address !== walletAddress) {
        await supabase
          .from("agents")
          .update({ wallet_address: walletAddress })
          .eq("privy_did", privyDid);
      }
      return existingAgent as Agent;
    }

    // Create new agent with unique Agent-#XXXX ID
    const agentId = generateAgentId();

    const { data: newAgent, error: createError } = await supabase
      .from("agents")
      .insert({
        privy_did: privyDid,
        agent_id: agentId,
        wallet_address: walletAddress || null,
        display_name: displayName || agentId,
        avatar_url: avatarUrl || null,
        truth_reports_count: 0,
        stones_balance: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create agent:", createError);
      return null;
    }

    console.log(`✅ New agent created: ${agentId}`);
    return newAgent as Agent;
  } catch (error) {
    console.error("Error in getOrCreateAgent:", error);
    return null;
  }
}

// Increment truth reports count for an agent
export async function incrementTruthReports(privyDid: string): Promise<void> {
  await supabase.rpc("increment_truth_reports", { agent_privy_did: privyDid });
}

// Add stones to agent balance
export async function addStones(
  privyDid: string,
  amount: number
): Promise<void> {
  await supabase.rpc("add_stones", { agent_privy_did: privyDid, amount });
}
