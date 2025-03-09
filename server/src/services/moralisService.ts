// server/src/services/moralisService.ts

import Moralis from "moralis";
import { config } from "../config/environment-config";
import { ethers } from "ethers";

/**
 * Initializes Moralis with the API key if not already started.
 */
async function initializeMoralis() {
  if (!Moralis.Core.isStarted) {
    console.log("[moralisService] Initializing Moralis with API key");
    await Moralis.start({ apiKey: config.MORALIS_API_KEY });
    console.log("[moralisService] Moralis initialized");
  }
}

/**
 * Fetches the current ETH price for a given chain.
 * @param blockNumbers: string[] Array of block numbers
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)
 * @returns ETH price in USD
 */
async function getHistoricalEthPrices(
  blockNumbers: string[],
  chain: "0x1" | "0x2105" = "0x1"
): Promise<Record<string, number>> {
  const priceMap: Record<string, number> = {};
  for (const blockNumber of blockNumbers) {
    try {
      console.log(
        "[getHistoricalEthPrices] Fetching price for block:",
        blockNumber
      );
      const response = await Moralis.EvmApi.token.getTokenPrice({
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH as a proxy for ETH
        chain,
        toBlock: Number(blockNumber), // Fetch price at this block
      });
      const data = response.toJSON();
      priceMap[blockNumber] = data.usdPrice || 2100.92; // Fallback to 2100.92 if no price
      console.log(
        "[getHistoricalEthPrices] Success for block:",
        blockNumber,
        "price:",
        priceMap[blockNumber]
      );
    } catch (error) {
      console.error(
        `[getHistoricalEthPrices] Error for block ${blockNumber}:`,
        error
      );
      priceMap[blockNumber] = 2100.92; // Fallback to 2100.92 if fetch fails
    }
  }
  return priceMap;
}

/**
 * Fetches EVM transactions (native ETH) for a wallet.
 * @param walletAddress Wallet address
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)
 * @returns Array of transactions with calculated valueUsd
 */
export async function fetchEvmTransactions(
  walletAddress: string,
  chain: "0x1" | "0x2105" = "0x1"
) {
  try {
    await initializeMoralis();
    console.log(
      `[fetchEvmTransactions] wallet = ${walletAddress}, chain = ${chain}`
    );

    const response =
      await Moralis.EvmApi.transaction.getWalletTransactionsVerbose({
        address: walletAddress,
        chain,
        limit: 100,
      });

    const transactions = response.toJSON().result || [];

    // Get unique block numbers and fetch prices once
    const blockNumbers = [
      ...new Set(transactions.map((tx) => tx.block_number)),
    ];
    const priceMap = await getHistoricalEthPrices(blockNumbers, chain);

    // Map transactions with cached prices
    return transactions.map((tx) => {
      const ethValue = parseFloat(ethers.formatEther(tx.value || "0"));
      const usdValue = ethValue * (priceMap[tx.block_number] || 0);
      return {
        ...tx,
        value_usd: `$${usdValue.toFixed(2)}`, // Verbose USD value, e.g., "$392.88"
      };
    });
  } catch (error) {
    console.error("[fetchEvmTransactions] Error:", error);
    return [];
  }
}

/**
 * Fetches EVM token transfers (ERC-20) for a wallet.
 * @param walletAddress Wallet address
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)
 * @returns Array of token transfer transactions
 */
export async function fetchEvmTokenTransfers(
  walletAddress: string,
  chain: "0x1" | "0x2105" = "0x1"
) {
  try {
    await initializeMoralis();
    console.log(
      `[fetchEvmTokenTransfers] wallet = ${walletAddress}, chain = ${chain}`
    );

    const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
      address: walletAddress,
      chain,
      limit: 100,
    });
    return response.toJSON().result || [];
  } catch (error) {
    console.error("[fetchEvmTokenTransfers] Error:", error);
    return [];
  }
}

/**
 * Fetches current EVM token balances (Ethereum or Base).
 * @param walletAddress Wallet address
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)
 * @returns Array of token balances
 */
export async function fetchEvmTokenBalances(
  walletAddress: string,
  chain: "0x1" | "0x2105" = "0x1"
) {
  try {
    await initializeMoralis();
    console.log(
      `[fetchEvmTokenBalances] wallet = ${walletAddress}, chain = ${chain}`
    );

    const balancesResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
      address: walletAddress,
      chain,
    });
    return balancesResponse.toJSON();
  } catch (error) {
    console.error("[fetchEvmTokenBalances] Error:", error);
    return [];
  }
}

/**
 * Fetches current Solana token balances (SPL + native SOL).
 * @param walletAddress Solana wallet address
 * @returns Array of token balances
 */
export async function fetchSolanaTokenBalances(walletAddress: string) {
  try {
    await initializeMoralis();
    console.log("[fetchSolanaTokenBalances] wallet =", walletAddress);

    const splResponse = await Moralis.SolApi.account.getSPL({
      address: walletAddress,
      network: "mainnet",
    });
    const splTokens = splResponse.toJSON();

    const nativeResponse = await Moralis.SolApi.account.getBalance({
      address: walletAddress,
      network: "mainnet",
    });
    const solBalance = nativeResponse.toJSON();

    const allTokens = [
      {
        symbol: "SOL",
        balance: solBalance.solana || "0",
        decimals: "9",
        usdValue: solBalance.solana ? await getSolPrice(solBalance.solana) : 0,
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
        thumbnail:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
      },
      ...splTokens.map((token: any) => ({
        symbol: token.symbol || "Unknown",
        balance: token.amountRaw || "0",
        decimals: token.decimals || "9",
        usdValue: token.usdPrice
          ? parseFloat(token.amount) * token.usdPrice
          : 0,
        logo: token.logo || null,
        thumbnail: token.thumbnail || null,
      })),
    ].filter((token) => parseFloat(token.balance) >= 0);

    return allTokens;
  } catch (error) {
    console.error("[fetchSolanaTokenBalances] Error:", error);
    return [
      {
        symbol: "SOL",
        balance: "0",
        decimals: "9",
        usdValue: 0,
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
        thumbnail:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
      },
    ];
  }
}

/**
 * Fetches Solana transaction history (limited support via Moralis).
 * @param walletAddress Solana wallet address
 * @returns Array of transactions (currently limited)
 */
export async function fetchSolanaTransactions(walletAddress: string) {
  try {
    await initializeMoralis();
    console.log("[fetchSolanaTransactions] wallet =", walletAddress);
    const response = await Moralis.SolApi.account.getPortfolio({
      address: walletAddress,
      network: "mainnet",
    });
    return []; // Placeholder until a better solution is integrated
  } catch (error) {
    console.error("[fetchSolanaTransactions] Error:", error);
    return [];
  }
}

/**
 * Fetches daily token balances from startDate to endDate for EVM or Solana with optimization.
 * @param walletAddress Wallet address
 * @param startDate Start date
 * @param endDate End date
 * @param chain Chain ID ("0x1", "0x2105", "solana")
 * @returns Array of daily balance objects
 */
export async function fetchDailyTokenBalances(
  walletAddress: string,
  startDate: Date,
  endDate: Date,
  chain: "0x1" | "0x2105" | "solana" = "0x1"
) {
  await initializeMoralis();
  console.log(
    `[fetchDailyTokenBalances] wallet = ${walletAddress}, chain = ${chain}, startDate = ${startDate}, endDate = ${endDate}`
  );

  const dailyResults = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  let lastValidBalance = null;

  while (currentDate <= endDate) {
    console.log("[fetchDailyTokenBalances] Processing date:", currentDate);
    try {
      if (chain === "0x1" || chain === "0x2105") {
        const blockResponse = await Moralis.EvmApi.block.getDateToBlock({
          date: currentDate.toISOString(),
          chain,
        });
        const blockNumber = blockResponse.raw.block;

        console.log(
          "[fetchDailyTokenBalances] Fetching balances for block:",
          blockNumber
        );
        const balancesResponse =
          await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
            address: walletAddress,
            chain,
            toBlock: blockNumber,
          });
        const tokensArray = balancesResponse.response.result || [];

        const dailyBalance = {
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
        };

        dailyResults.push(dailyBalance);
        lastValidBalance = dailyBalance; // Cache the last valid balance
        console.log(
          "[fetchDailyTokenBalances] Success for date:",
          currentDate,
          "tokens:",
          tokensArray.length
        );
      } else if (chain === "solana") {
        const balances = await fetchSolanaTokenBalances(walletAddress);
        dailyResults.push({
          date: new Date(currentDate),
          blockNumber: null,
          tokens: balances.map((token: any) => ({
            symbol: token.symbol,
            balance: token.balance,
            decimals: token.decimals,
            usdValue: token.usdValue,
            logo: token.logo,
            thumbnail: token.thumbnail,
          })),
        });
        lastValidBalance = dailyResults[dailyResults.length - 1];
        console.log(
          "[fetchDailyTokenBalances] Success for Solana date:",
          currentDate,
          "balances:",
          balances.length
        );
      }
    } catch (error: any) {
      console.error(
        `[fetchDailyTokenBalances] Error at ${currentDate.toDateString()}:`,
        error
      );
      if (lastValidBalance && error.details?.status === 400) {
        // Fallback to last valid balance for unsynced blocks
        dailyResults.push({
          date: new Date(currentDate),
          blockNumber: lastValidBalance.blockNumber,
          tokens: lastValidBalance.tokens.map((token) => ({
            ...token,
            usdValue: token.usdValue || 0, // Preserve last known USD value
          })),
        });
        console.log(
          "[fetchDailyTokenBalances] Fallback applied for:",
          currentDate
        );
      } else {
        dailyResults.push({
          date: new Date(currentDate),
          blockNumber: null,
          tokens: [],
        });
        console.log(
          "[fetchDailyTokenBalances] No fallback, empty tokens for:",
          currentDate
        );
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(
    "[fetchDailyTokenBalances] Returning dailyResults length:",
    dailyResults.length
  );
  return dailyResults;
}

/**
 * Fetches the current USD price of SOL.
 * @param balance Optional SOL balance in lamports for direct USD calculation
 * @returns USD price per SOL or total USD value if balance provided
 */
async function getSolPrice(balance?: string): Promise<number> {
  try {
    const response = await Moralis.SolApi.token.getTokenPrice({
      address: "So11111111111111111111111111111111111111111",
      network: "mainnet",
    });
    const usdPrice = response.toJSON().usdPrice || 150;
    return balance ? (parseFloat(balance) / 1e9) * usdPrice : usdPrice;
  } catch (error) {
    console.error("[getSolPrice] Error:", error);
    return balance ? (parseFloat(balance) / 1e9) * 150 : 150;
  }
}
