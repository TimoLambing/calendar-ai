/*************************************************
 * server/src/services/solanaService.ts (UPDATED)
 *
 * Purpose:
 * 1) Provide a named function that returns Solana
 *    wallet data via Helius, matching your usage.
 *************************************************/

import { config } from "../config/environment-config";

/**
 * fetchSolanaData
 * Fetch Solana wallet data (transactions, token balances) via Helius
 */
export async function fetchSolanaData(walletAddress: string) {
  try {
    const txUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${config.HELIUS_API_KEY}`;
    const txRes = await fetch(txUrl);
    const txData = await txRes.json();

    const balanceUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${config.HELIUS_API_KEY}`;
    const balanceRes = await fetch(balanceUrl);
    const balanceData = await balanceRes.json();

    return {
      transactions: txData,
      tokenBalances: balanceData.tokens,
    };
  } catch (error) {
    console.error("Error fetching Solana data:", error);
    return null;
  }
}

/**
 * parseSolanaTransaction (optional)
 * Example placeholder for Solana transaction parsing
 */
export function parseSolanaTransaction(tx: any, userAddress: string) {
  return {
    symbol: "SOL",
    type: "UNKNOWN",
    amount: 0,
    valueUsd: 0,
    timestamp: new Date(),
  };
}
