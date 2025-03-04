/*************************************************
 * server/src/services/moralisService.ts
 *
 * Purpose:
 * 1) Provide Moralis-based fetch for EVM & Solana
 * 2) Provide daily approach (fetchDailyTokenBalances)
 *    that loops from startDate to endDate, calling
 *    Moralis for each day’s block.
 *************************************************/
import Moralis from "moralis";
import { config } from "../config/environment-config";

/**
 * initializeMoralis
 * Ensures Moralis is started once with your API key
 */
async function initializeMoralis() {
  if (!Moralis.Core.isStarted) {
    console.log("[moralisService] Initializing Moralis with API key");
    await Moralis.start({ apiKey: config.MORALIS_API_KEY });
    console.log("[moralisService] Moralis initialized");
  }
}

/**
 * fetchEvmTransactions
 * Basic EVM transaction history
 */
export async function fetchEvmTransactions(walletAddress: string) {
  try {
    await initializeMoralis();
    console.log("[fetchEvmTransactions] wallet =", walletAddress);

    const url = new URL(
      `https://deep-index.moralis.io/api/v2/${walletAddress}`
    );
    url.searchParams.append("chain", "0x1"); // Ethereum mainnet
    url.searchParams.append("limit", "100");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": config.MORALIS_API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Moralis typically returns { result: [...], page, page_size, cursor }
    return Array.isArray(data.result) ? data.result : [];
  } catch (error) {
    console.error("[fetchEvmTransactions] Error:", error);
    return [];
  }
}

/**
 * fetchEvmTokenBalances
 * Basic EVM token balances (current)
 */
export async function fetchEvmTokenBalances(walletAddress: string) {
  try {
    await initializeMoralis();
    console.log("[fetchEvmTokenBalances] wallet =", walletAddress);

    const chain = "0x1"; // Ethereum mainnet
    const balancesResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
      address: walletAddress,
      chain,
    });
    return balancesResponse.toJSON(); // array of tokens
  } catch (error) {
    console.error("[fetchEvmTokenBalances] Error:", error);
    return [];
  }
}

/**
 * fetchDailyTokenBalances
 * Example function to fetch day-by-day token balances
 * from startDate to endDate using Moralis block approach.
 */
export async function fetchDailyTokenBalances(
  walletAddress: string,
  startDate: Date,
  endDate: Date
) {
  await initializeMoralis();
  console.log("[fetchDailyTokenBalances] wallet =", walletAddress);

  const chain = "0x1"; // Ethereum mainnet
  let currentDate = new Date(startDate);
  const dailyResults = [];

  while (currentDate <= endDate) {
    // For each day, find approximate block at that day’s date
    const blockResponse = await Moralis.EvmApi.block.getDateToBlock({
      date: currentDate.toISOString(),
      chain,
    });
    const blockNumber = blockResponse.raw.block;
    console.log(
      `[fetchDailyTokenBalances] Date=${currentDate.toDateString()} blockNumber=${blockNumber}`
    );

    // Then fetch token balances at that block
    // Also includes price info if Moralis can find it
    const balancesResponse =
      await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
        address: walletAddress,
        chain,
        toBlock: blockNumber,
      });
    const tokensArray = balancesResponse.response.result || [];

    dailyResults.push({
      date: new Date(currentDate),
      blockNumber,
      tokens: tokensArray,
    });

    // move currentDate + 1 day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailyResults;
}

/**
 * (Optional) fetchSolanaTransactions / fetchSolanaTokenBalances
 * If you want Solana or a daily approach for Solana
 */
export async function fetchSolanaTransactions(walletAddress: string) {
  // ...
  return [];
}

export async function fetchSolanaTokenBalances(walletAddress: string) {
  // ...
  return [];
}
