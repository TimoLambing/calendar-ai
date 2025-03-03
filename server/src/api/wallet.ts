
// server/src/api/wallet.ts
import Moralis from 'moralis';
import { prisma } from "../prisma/prisma";
import { ethers } from "ethers";

// Environment variables
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY!;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;

/**
 * Example: fetch Ethereum wallet data via Alchemy
 * (If you get "Must be authorized" in plain text, you need the correct Alchemy endpoint or an Etherscan-based approach.)
 */
export async function getEthereumWalletData(walletAddress: string) {
    try {
        // This "baseUrl" is not an official Alchemy endpoint; adapt to your real one if needed.
        const baseUrl = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

        // For transactions (placeholder—if it fails, you'll see "Must be authorized" or 401 in plain text)
        const txListUrl = `${baseUrl}?module=account&action=txlist&address=${walletAddress}`;
        const txRes = await fetch(txListUrl);
        const txData = await txRes.json();

        // For token balances
        const balanceRes = await fetch(`${baseUrl}/alchemy_getTokenBalances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "alchemy_getTokenBalances",
                params: [walletAddress],
                id: 1,
            }),
        });
        const balances = await balanceRes.json();

        return {
            transactions: txData.result || [],
            tokenBalances: balances.result?.tokenBalances || [],
        };
    } catch (error) {
        console.error("Error fetching Ethereum data:", error);
        return null;
    }
}

/**
 * Example: fetch Solana wallet data via Helius
 */
export async function getSolanaWalletData(walletAddress: string) {
    try {
        const txUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}`;
        const txRes = await fetch(txUrl);
        const txData = await txRes.json();

        const balanceUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`;
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
 * Etherscan-based fetch for older logic (unchanged)
 */
export async function getEtherWalletTransactions(walletAddress: string) {
    try {
        const url = new URL("https://api.etherscan.io/v2/api");

        url.searchParams.append("chainid", "1");
        url.searchParams.append("module", "account");
        url.searchParams.append("action", "txlist");
        url.searchParams.append("address", walletAddress);
        url.searchParams.append("tag", "latest");
        url.searchParams.append("apikey", process.env.ETHERSCAN_API_KEY!);

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

/**
 * Moralis-based fetch for older logic (unchanged)
 */
export async function getMoralisTransactions(walletAddress: string) {
    try {
        const url = new URL(
            `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/history`
        );
        url.searchParams.append("chain", "eth");

        const requestOptions: RequestInit = {
            method: "GET",
            headers: {
                accept: "application/json",
                "X-API-Key": process.env.MORALIS_API_KEY!,
            },
        };

        const response = await fetch(url.toString(), requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * Convert token amounts to USD - placeholder
 * In reality, you'd call a price feed or rely on your Alchemy/Helius endpoint for actual USD values
 */
function convertToUsd(symbol: string, rawAmount: string, decimals: number) {
    return Math.random() * 100; // Dummy approach
}

/**
 * Convert raw EVM transaction to your "Transaction" format in DB, marking inbound as "BUY" and outbound as "SELL".
 */
function parseEvmTransaction(tx: any, userAddress: string) {
    const fromAddr = (tx.from || "").toLowerCase();
    const toAddr = (tx.to || "").toLowerCase();
    const userAddr = userAddress.toLowerCase();

    const isOutbound = fromAddr === userAddr;
    const type = isOutbound ? "SELL" : "BUY";

    // Convert wei to ETH
    const ethAmount = parseFloat(ethers.formatEther(tx.value || "0"));
    const valueUsd = 0; // or fetch real price
    const timeMs = parseInt(tx.timeStamp || "0", 10) * 1000;

    return {
        symbol: "ETH",
        type,
        amount: ethAmount,
        valueUsd,
        timestamp: new Date(timeMs || Date.now()),
    };
}

/**
 * Create or update a "daily" snapshot, storing coin balances + transactions.
 */
export async function createOrUpdateDailySnapshot(
    walletAddress: string,
    chain: "ethereum" | "solana"
) {
    let data = null;
    if (chain === "ethereum") {
        data = await getEthereumWalletData(walletAddress);
    } else {
        data = await getSolanaWalletData(walletAddress);
    }
    if (!data) return null;

    // Build coinBalances
    const coinBalances: {
        symbol: string;
        amount: number;
        valueUsd: number;
        timestamp: Date;
    }[] = [];

    for (const t of data.tokenBalances || []) {
        const decimals = t.decimals ? parseInt(t.decimals, 10) : 18;
        const rawAmountStr = t.tokenBalance || "0";
        const amountFloat = parseFloat(rawAmountStr) / 10 ** decimals;
        const usdValue = convertToUsd(t.symbol || "TKN", rawAmountStr, decimals);

        coinBalances.push({
            symbol: t.symbol || "TKN",
            amount: amountFloat,
            valueUsd: usdValue,
            timestamp: new Date(),
        });
    }

    // Build transactions
    const txsToCreate: {
        symbol: string;
        type: string;
        amount: number;
        valueUsd: number;
        timestamp: Date;
    }[] = [];

    if (chain === "ethereum" && Array.isArray(data.transactions)) {
        for (const rawTx of data.transactions) {
            const parsedTx = parseEvmTransaction(rawTx, walletAddress);
            txsToCreate.push(parsedTx);
        }
    }
    // If you'd parse Solana transactions similarly, do it here

    // Summation for totalValue
    const totalValue = coinBalances.reduce((sum, c) => sum + c.valueUsd, 0);

    // Upsert the wallet
    const wallet = await prisma.wallet.upsert({
        where: { address: walletAddress },
        update: {},
        create: { address: walletAddress },
    });

    // Find or create today's snapshot
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let snapshot = await prisma.walletSnapshot.findFirst({
        where: {
            walletId: wallet.id,
            timestamp: {
                gte: startOfDay,
            },
        },
        include: { balances: true, transactions: true },
    });

    if (!snapshot) {
        snapshot = await prisma.walletSnapshot.create({
            data: {
                walletId: wallet.id,
                timestamp: new Date(),
                totalValue,
                balances: {
                    create: coinBalances.map((cb) => ({
                        symbol: cb.symbol,
                        amount: cb.amount,
                        valueUsd: cb.valueUsd,
                        timestamp: cb.timestamp,
                    })),
                },
                transactions: {
                    create: txsToCreate.map((tx) => ({
                        symbol: tx.symbol,
                        type: tx.type,
                        amount: tx.amount,
                        valueUsd: tx.valueUsd,
                        timestamp: tx.timestamp,
                    })),
                },
            },
            include: {
                balances: true,
                transactions: true,
            },
        });
    } else {
        // update existing daily snapshot
        snapshot = await prisma.walletSnapshot.update({
            where: { id: snapshot.id },
            data: {
                totalValue,
                balances: {
                    deleteMany: {},
                    create: coinBalances.map((cb) => ({
                        symbol: cb.symbol,
                        amount: cb.amount,
                        valueUsd: cb.valueUsd,
                        timestamp: cb.timestamp,
                    })),
                },
                transactions: {
                    deleteMany: {},
                    create: txsToCreate.map((tx) => ({
                        symbol: tx.symbol,
                        type: tx.type,
                        amount: tx.amount,
                        valueUsd: tx.valueUsd,
                        timestamp: tx.timestamp,
                    })),
                },
            },
            include: {
                balances: true,
                transactions: true,
            },
        });
    }

    return snapshot;
}

export async function getWalletTokenBalanceSnapshots(
    address: string,
    chain: string,
    startDate: string,
    endDate: string
): Promise<any[]> {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    const allTokens: any[] = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
        try {
            // Convert date to block number
            const blockResponse = await Moralis.EvmApi.block.getDateToBlock({
                date: currentDate.toISOString(),
                chain,
            });
            const blockNumber = blockResponse.raw.block;

            // Initialize pagination variables
            let cursor: string | undefined = undefined;

            // Paginate through the token balances if needed
            do {
                const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
                    address,
                    chain,
                    toBlock: blockNumber,
                    cursor, // Pass the cursor for pagination
                });

                // Extract token balances from the response
                const jsonData = response.response.result;  // Use the 'response' property directly

                const snapshots = jsonData.map((token: any) => {
                    return {
                        walletId: address,
                        timestamp: currentDate.toISOString(),
                        name: token.name,
                        symbol: token.symbol,
                        totalValue: token.usdValue,
                        balanceFormatted: token.balanceFormatted,
                        logo: token.logo,
                        thumbnail: token.thumbnail,
                    };
                });

                // Push the fetched data into the allTokens array
                allTokens.push(...snapshots);

                // Check if there's a next page (cursor)
                cursor = response.response.cursor;  // Use 'cursor' from 'response' directly
            } while (cursor); // Continue fetching until no cursor is left

        } catch (error) {
            console.error(`Failed to fetch balances for ${currentDate.toISOString()}:`, error);
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log('All tokens snapshots:', allTokens);
    return allTokens;
}