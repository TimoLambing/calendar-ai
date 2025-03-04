import Moralis from "moralis";
import { config } from "../config/environment-config";

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
 * Fetches EVM transactions for a wallet (Ethereum or Base).
 * @param walletAddress Wallet address
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)
 * @returns Array of transactions
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
    return response.toJSON().result || [];
  } catch (error) {
    console.error("[fetchEvmTransactions] Error:", error);
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

    // Fetch SPL token balances
    const splResponse = await Moralis.SolApi.account.getSPL({
      address: walletAddress,
      network: "mainnet",
    });
    const splTokens = splResponse.toJSON();

    // Fetch native SOL balance
    const nativeResponse = await Moralis.SolApi.account.getBalance({
      address: walletAddress,
      network: "mainnet",
    });
    const solBalance = nativeResponse.toJSON();

    // Combine SOL and SPL tokens
    const allTokens = [
      {
        symbol: "SOL",
        balance: solBalance?.solana || "0", // Lamports
        decimals: "9",
        usdValue: solBalance?.solana ? await getSolPrice(solBalance.solana) : 0,
        logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
        thumbnail:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111111/logo.png",
      },
      ...splTokens.map((token: any) => ({
        symbol: token.symbol || "Unknown",
        balance: token.amountRaw || "0", // Raw lamports or token units
        decimals: token.decimals || "9",
        usdValue: token.usdPrice
          ? parseFloat(token.amount) * token.usdPrice
          : 0,
        logo: token.logo || null,
        thumbnail: token.thumbnail || null,
      })),
    ].filter((token) => parseFloat(token.balance) >= 0); // Ensure no negative balances

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
 * Fetches Solana transaction history (placeholder; Moralis lacks full support).
 * @param walletAddress Solana wallet address
 * @returns Array of transactions (currently empty)
 */
export async function fetchSolanaTransactions(walletAddress: string) {
  try {
    await initializeMoralis();
    console.log("[fetchSolanaTransactions] wallet =", walletAddress);
    // Note: Moralis doesn’t provide full Solana transaction history.
    // For accurate history, integrate Helius or another Solana RPC provider.
    return [];
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
        // EVM (Ethereum or Base)
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
        // Solana: Moralis doesn’t support historical balances, so use current balances
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
    return balance ? (parseFloat(balance) / 1e9) * 150 : 150; // Fallback
  }
}
