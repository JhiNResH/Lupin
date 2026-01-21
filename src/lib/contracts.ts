import { createPublicClient, createWalletClient, http, custom } from "viem";
import { base } from "viem/chains";

// LupinAttestation contract ABI (simplified)
export const LUPIN_ATTESTATION_ABI = [
  {
    inputs: [
      { name: "reportHash", type: "bytes32" },
      { name: "restaurantId", type: "string" },
      { name: "truthScore", type: "uint8" },
    ],
    name: "submitAttestation",
    outputs: [{ name: "attestationId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "attestationId", type: "uint256" }],
    name: "getAttestation",
    outputs: [
      { name: "reportHash", type: "bytes32" },
      { name: "reporter", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "restaurantId", type: "string" },
      { name: "truthScore", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "attestationId", type: "uint256" },
      { indexed: true, name: "reporter", type: "address" },
      { indexed: false, name: "reportHash", type: "bytes32" },
    ],
    name: "AttestationSubmitted",
    type: "event",
  },
] as const;

// Contract address on Base L2 (placeholder - deploy your own)
export const LUPIN_ATTESTATION_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

// Public client for reading from Base
export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Create wallet client (for use with Privy embedded wallet)
export function createLupinWalletClient(provider: unknown) {
  return createWalletClient({
    chain: base,
    transport: custom(provider as Parameters<typeof custom>[0]),
  });
}

// Hash a truth report for on-chain attestation
export async function hashTruthReport(report: {
  restaurantId: string;
  restaurantName: string;
  truthScore: number;
  botProbability: number;
  reviewContent: string;
  timestamp: number;
}): Promise<`0x${string}`> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(report));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hashHex}` as `0x${string}`;
}

// Submit truth report attestation to Base L2
export async function submitTruthReport(
  walletClient: ReturnType<typeof createLupinWalletClient>,
  report: {
    restaurantId: string;
    restaurantName: string;
    truthScore: number;
    botProbability: number;
    reviewContent: string;
  }
): Promise<{
  success: boolean;
  hash?: `0x${string}`;
  txHash?: `0x${string}`;
  error?: string;
}> {
  try {
    // Create the full report with timestamp
    const fullReport = {
      ...report,
      timestamp: Date.now(),
    };

    // Hash the report
    const reportHash = await hashTruthReport(fullReport);

    // Get the wallet address
    const [address] = await walletClient.getAddresses();

    // Simulate the contract call (in production, this would be a real tx)
    // For demo purposes, we'll return a mock response
    if (LUPIN_ATTESTATION_ADDRESS === "0x0000000000000000000000000000000000000000") {
      // Mock mode - contract not deployed yet
      console.log("📝 Mock attestation submitted:", {
        reportHash,
        reporter: address,
        restaurantId: report.restaurantId,
        truthScore: report.truthScore,
      });

      return {
        success: true,
        hash: reportHash,
        txHash: `0x${Array(64).fill("0").map(() => Math.floor(Math.random() * 16).toString(16)).join("")}` as `0x${string}`,
      };
    }

    // Real contract interaction
    const txHash = await walletClient.writeContract({
      address: LUPIN_ATTESTATION_ADDRESS,
      abi: LUPIN_ATTESTATION_ABI,
      functionName: "submitAttestation",
      args: [reportHash, report.restaurantId, report.truthScore],
      account: address,
    });

    return {
      success: true,
      hash: reportHash,
      txHash,
    };
  } catch (error) {
    console.error("Failed to submit truth report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
