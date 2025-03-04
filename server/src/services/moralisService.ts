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
 * fetchSolanaTokenBalances
 * Fetch current Solana token balances using Moralis Solana API
 */
export async function fetchSolanaTokenBalances(walletAddress: string) {
  try {
    await initializeMoralis();
    console.log("[fetchSolanaTokenBalances] wallet =", walletAddress);

    const response = await Moralis.SolanaApi.account.getSPL({
      address: walletAddress,
      network: "mainnet",
    });
    const tokens = response.toJSON();

    // Fetch native SOL balance separately
    const nativeBalance = await Moralis.SolanaApi.account.getBalance({
      address: walletAddress,
      network: "mainnet",
    });
    const solBalance = nativeBalance.toJSON();

    // Combine SOL and SPL tokens
    const allTokens = [
      {
        symbol: "SOL",
        balance: solBalance?.balance || "0",
        decimals: "9",
        usdValue: solBalance?.balance
          ? (parseFloat(solBalance.balance) / 1e9) * (await getSolPrice())
          : 0,
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
        thumbnail:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
      },
      ...tokens.map((token: any) => ({
        symbol: token.symbol || "Unknown",
        balance: token.amount || "0",
        decimals: token.decimals || "9",
        usdValue: token.usdPrice
          ? (parseFloat(token.amount) / 10 ** parseInt(token.decimals)) *
            token.usdPrice
          : 0,
        logo: token.logo || null,
        thumbnail: token.thumbnail || null,
      })),
    ];

    return allTokens;
  } catch (error) {
    console.error("[fetchSolanaTokenBalances] Error:", error);
    return [];
  }
}

/**
 * fetchSolanaTransactions
 * Placeholder for Solana transaction history (not fully implemented)
 */
export async function fetchSolanaTransactions(walletAddress: string) {
  try {
    await initializeMoralis();
    console.log("[fetchSolanaTransactions] wallet =", walletAddress);

    // Moralis doesn't provide a direct transaction history endpoint for Solana,
    // so this is a placeholder. You'd need Helius or another provider for full history.
    return [];
  } catch (error) {
    console.error("[fetchSolanaTransactions] Error:", error);
    return [];
  }
}

/**
 * fetchDailyTokenBalances
 * Fetch day-by-day token balances from startDate to endDate using Moralis
 */
export async function fetchDailyTokenBalances(
  walletAddress: string,
  startDate: Date,
  endDate: Date,
  chain: "0x1" | "solana" = "0x1"
) {
  await initializeMoralis();
  console.log("[fetchDailyTokenBalances] wallet =", walletAddress);

  const dailyResults = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    try {
      if (chain === "0x1") {
        // Ethereum
        const blockResponse = await Moralis.EvmApi.block.getDateToBlock({
          date: currentDate.toISOString(),
          chain,
        });
        const blockNumber = blockResponse.raw.block;

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
          tokens: tokensArray.map((token: any) => ({
            symbol: token.symbol,
            balance: token.balanceFormatted || token.balance,
            decimals: token.decimals,
            usdValue: token.usdValue || 0,
            logo: token.logo,
            thumbnail: token.thumbnail,
          })),
        });
      } else if (chain === "solana") {
        // Solana - Moralis doesn't support historical SPL balances directly,
        // so we fetch current balances and simulate daily snapshots
        // For true historical data, you'd need a provider like Helius
        const balances = await fetchSolanaTokenBalances(walletAddress);
        dailyResults.push({
          date: new Date(currentDate),
          blockNumber: null, // Solana doesn't use block numbers like EVM
          tokens: balances.map((token: any) => ({
            symbol: token.symbol,
            balance: token.balance,
            decimals: token.decimals,
            usdValue: token.usdValue,
            logo: token.logo,
            thumbnail: token.thumbnail,
          })),
        });
      }
    } catch (error) {
      console.error(
        `[fetchDailyTokenBalances] Error at ${currentDate.toDateString()}:`,
        error
      );
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailyResults;
}

/**
 * Helper to get SOL price (simplified)
 */
async function getSolPrice(): Promise<number> {
  try {
    const response = await Moralis.SolanaApi.token.getTokenPrice({
      address: "So11111111111111111111111111111111111111111", // SOL token address
      network: "mainnet",
    });
    return response.toJSON().usdPrice || 150; // Fallback to approximate price
  } catch (error) {
    console.error("[getSolPrice] Error:", error);
    return 150; // Fallback price
  }
}
