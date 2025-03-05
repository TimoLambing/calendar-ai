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
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)
 * @returns ETH price in USD
 */
export async function getEthPrice(
  chain: "0x1" | "0x2105" = "0x1"
): Promise<number> {
  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH address
      chain,
    });
    return response.toJSON().usdPrice || 2100.92; // Default to $2,100.92 if no price
  } catch (error) {
    console.error("[getEthPrice] Error:", error);
    return 2100.92; // Fallback price
  }
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

    const response = await Moralis.EvmApi.transaction.getWalletTransactions({
      address: walletAddress,
      chain,
      limit: 100,
    });
    const ethPrice = await getEthPrice(chain);
    const transactions = response.toJSON().result || [];

    return transactions.map((tx) => ({
      ...tx,
      value_usd: parseFloat(ethers.formatEther(tx.value || "0")) * ethPrice,
    }));
  } catch (error) {
    console.error("[fetchEvmTransactions] Error:", error);
    return [];
  }
}

/**
 * Fetches EVM token transfers (ERC-20) for a wallet.
 * @param walletAddress Wallet address
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)z
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
        balance: solBalance?.balance || "0",
        decimals: "9",
        usdValue: solBalance?.balance
          ? await getSolPrice(solBalance.balance)
          : 0,
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
 * Fetches daily token balances from startDate to endDate for EVM or Solana.
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
    `[fetchDailyTokenBalances] wallet = ${walletAddress}, chain = ${chain}`
  );

  const dailyResults = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    try {
      if (chain === "0x1" || chain === "0x2105") {
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
      }
    } catch (error) {
      console.error(
        `[fetchDailyTokenBalances] Error at ${currentDate.toDateString()}:`,
        error
      );
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

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
