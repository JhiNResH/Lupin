"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, useCallback } from "react";
import { getOrCreateAgent, type Agent } from "@/lib/supabase";

export function useAgent() {
  const { user, authenticated } = usePrivy();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeAgent = useCallback(async () => {
    if (!authenticated || !user) {
      setAgent(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user details from Privy
      const privyDid = user.id;
      const walletAddress = user.wallet?.address;
      const displayName =
        user.google?.name ||
        user.twitter?.username ||
        user.email?.address?.split("@")[0];
      const avatarUrl =
        (user.google as { picture?: string } | undefined)?.picture ||
        user.twitter?.profilePictureUrl ||
        (user.discord as { imageUrl?: string } | undefined)?.imageUrl;

      // Get or create agent in Supabase
      const agentData = await getOrCreateAgent(
        privyDid,
        walletAddress,
        displayName,
        avatarUrl
      );

      if (agentData) {
        setAgent(agentData);
        console.log(`🕵️ Agent loaded: ${agentData.agent_id}`);
      } else {
        setError("Failed to initialize agent");
      }
    } catch (err) {
      console.error("Agent initialization error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [authenticated, user]);

  useEffect(() => {
    initializeAgent();
  }, [initializeAgent]);

  return {
    agent,
    loading,
    error,
    refresh: initializeAgent,
  };
}
