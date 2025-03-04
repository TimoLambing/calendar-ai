/*************************************************
 * server/src/controllers/walletController.ts
 *
 * Purpose:
 * 1) Single-day snapshot approach (getWalletHistory)
 *    => lumps all “current” tx/balances into today’s snapshot
 * 2) Full daily approach from earliest transaction
 *    to today (dailyFullHistory)
 * 3) Exposes route handlers for wallet endpoints,
 *    returning daily snapshots for the front end.
 *************************************************/
import { Request, Response } from "express";
import { prisma } from "../prisma/prisma";
import { ethers } from "ethers";
import {
  fetchEvmTransactions,
  fetchEvmTokenBalances,
  fetchSolanaTransactions,
  fetchSolanaTokenBalances,
  fetchDailyTokenBalances,
} from "../services/moralisService";

/**
 * convertToUsd
 * Dummy approach to get USD value
 */
function convertToUsd(symbol: string, rawAmount: string, decimals: number) {
  // placeholder random value
  return Math.random() * 100;
}

/**
 * parseEvmTransaction
 * Convert raw EVM tx to our "Transaction" model shape
 */
function parseEvmTransaction(tx: any, userAddr: string) {
  // Identify inbound or outbound
  const fromAddr = (tx.from_address || "").toLowerCase();
  const isOutbound = fromAddr === userAddr.toLowerCase();
  const type = isOutbound ? "SELL" : "BUY";

  // Convert Wei
  const rawWei = tx.value || "0";
  const ethAmount = parseFloat(ethers.formatEther(rawWei));

  // block_timestamp => JS Date
  const timeMs = tx.block_timestamp
    ? Date.parse(tx.block_timestamp)
    : Date.now();

  return {
    symbol: "ETH",
    type,
    amount: ethAmount,
    valueUsd: 0, // placeholder
    timestamp: new Date(timeMs),
  };
}

/**
 * parseSolanaTransaction
 * Example placeholder
 */
function parseSolanaTransaction(tx: any, userAddr: string) {
  return {
    symbol: "SOL",
    type: "UNKNOWN",
    amount: 0,
    valueUsd: 0,
    timestamp: new Date(),
  };
}

/**
 * createOrUpdateDailySnapshot (Single-day approach)
 * => lumps all TX + balances into one "today" snapshot
 */
async function createOrUpdateDailySnapshot(
  address: string,
  chain: "ethereum" | "solana"
) {
  let rawTxs: any[] = [];
  let rawBalances: any[] = [];

  if (chain === "ethereum") {
    rawTxs = await fetchEvmTransactions(address);
    rawBalances = await fetchEvmTokenBalances(address);
  } else {
    rawTxs = await fetchSolanaTransactions(address);
    rawBalances = await fetchSolanaTokenBalances(address);
  }

  // parse transactions
  const txsToCreate =
    chain === "ethereum"
      ? rawTxs.map((tx) => parseEvmTransaction(tx, address))
      : rawTxs.map((tx) => parseSolanaTransaction(tx, address));

  // parse balances
  const coinBalances = rawBalances.map((token) => {
    const decimals = token.decimals ? parseInt(token.decimals, 10) : 18;
    const rawAmountStr = token.balance || "0";
    const amountFloat = parseFloat(rawAmountStr) / 10 ** decimals;
    const usdValue = convertToUsd(
      token.symbol || "TKN",
      rawAmountStr,
      decimals
    );

    return {
      symbol: token.symbol || "TKN",
      amount: amountFloat,
      valueUsd: usdValue,
      timestamp: new Date(),
      logo: token.logo || null,
      thumbnail: token.thumbnail || null,
    };
  });

  // sum
  const totalValue = coinBalances.reduce((sum, c) => sum + c.valueUsd, 0);

  // upsert wallet
  const wallet = await prisma.wallet.upsert({
    where: { address },
    update: {},
    create: { address },
  });

  // find or create today's snapshot
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let snapshot = await prisma.walletSnapshot.findFirst({
    where: {
      walletAddress: wallet.address,
      timestamp: { gte: startOfDay },
    },
    include: { balances: true, transactions: true },
  });

  if (!snapshot) {
    snapshot = await prisma.walletSnapshot.create({
      data: {
        walletAddress: wallet.address,
        timestamp: new Date(),
        totalValue,
        balances: {
          create: coinBalances.map((cb) => ({
            symbol: cb.symbol,
            amount: cb.amount,
            valueUsd: cb.valueUsd,
            timestamp: cb.timestamp,
            logo: cb.logo,
            thumbnail: cb.thumbnail,
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
      include: { balances: true, transactions: true },
    });
  } else {
    // update existing
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
            logo: cb.logo,
            thumbnail: cb.thumbnail,
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
      include: { balances: true, transactions: true },
    });
  }

  return snapshot;
}

/**
 * dailyFullHistory
 * => truly build per-day snapshots from earliest TX date to now
 * => each day has that day's TX + that day's balances
 */
export async function dailyFullHistory(req: Request, res: Response) {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // 1) fetch all EVM tx
    const allTxs = await fetchEvmTransactions(address);
    if (!allTxs.length) {
      return res.json({ message: "No transactions found" });
    }

    // parse them so we can filter by date
    const parsedTxs = allTxs.map((raw) => parseEvmTransaction(raw, address));
    // find earliest tx date
    let earliestDate = new Date();
    for (const tx of parsedTxs) {
      if (tx.timestamp < earliestDate) earliestDate = tx.timestamp;
    }

    // if earliest is in the future, fallback
    const now = new Date();
    if (earliestDate > now) {
      earliestDate = new Date(now.getTime() - 86400000);
    }
    // sort the parsedTxs by ascending date just to be safe
    parsedTxs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    console.log("[dailyFullHistory] earliest tx date =", earliestDate);

    // 2) fetch day-by-day token balances from earliest to now
    // if you want *real historical* balances, use `fetchDailyTokenBalances`
    const dailyBalances = await fetchDailyTokenBalances(
      address,
      earliestDate,
      now
    );
    // dailyBalances is an array of { date, tokens[] } from your Moralis function

    // 3) We'll loop from earliestDate => now (day by day),
    //    filter TXs for that day, find the day’s token data from dailyBalances,
    //    then create a snapshot for that day.

    // a helper to skip time
    function addOneDay(d: Date): Date {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 1);
      return nd;
    }

    let currentDate = new Date(earliestDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= now) {
      const dayStart = new Date(currentDate);
      const dayEnd = addOneDay(dayStart);

      // filter TX for this day
      const dayTxs = parsedTxs.filter(
        (tx) => tx.timestamp >= dayStart && tx.timestamp < dayEnd
      );

      // find the daily Balances from dailyBalances array
      // because dailyBalances might not have an entry for *every* day
      // we find the one that matches or is near
      // e.g. you might do an exact match:
      const found = dailyBalances.find((db) => {
        // your code sets db.date to midnight, so let's compare same day
        // or you do an approximation
        const dbMid = new Date(db.date);
        dbMid.setHours(0, 0, 0, 0);
        return dbMid.getTime() === dayStart.getTime();
      });

      // if none found, skip or create empty
      const tokensForDay = found ? found.tokens : [];
      // parse them into coinBalances
      const coinBalances = tokensForDay.map((t: any) => {
        const decimals = t.decimals ? parseInt(t.decimals, 10) : 18;
        const rawAmountStr = t.balance || "0";
        const amountFloat = parseFloat(rawAmountStr) / 10 ** decimals;
        // placeholder random
        const usdValue = Math.random() * 100;

        return {
          symbol: t.symbol || "TKN",
          amount: amountFloat,
          valueUsd: usdValue,
          timestamp: dayStart,
          logo: t.logo,
          thumbnail: t.thumbnail,
        };
      });

      const totalValue = coinBalances.reduce((sum, cb) => sum + cb.valueUsd, 0);

      // upsert wallet
      const wallet = await prisma.wallet.upsert({
        where: { address },
        update: {},
        create: { address },
      });

      // find or create snapshot for this day
      let snapshot = await prisma.walletSnapshot.findFirst({
        where: {
          walletAddress: address,
          timestamp: { gte: dayStart, lt: dayEnd },
        },
      });

      // We also want to store the dayTxs => the "transactions" array
      // so we can see only that day’s transactions
      // transform them into DB shape
      const dayTxsDb = dayTxs.map((tx) => ({
        symbol: tx.symbol,
        type: tx.type,
        amount: tx.amount,
        valueUsd: tx.valueUsd,
        timestamp: tx.timestamp,
      }));

      if (!snapshot) {
        snapshot = await prisma.walletSnapshot.create({
          data: {
            walletAddress: address,
            timestamp: dayStart,
            totalValue,
            balances: {
              create: coinBalances.map((cb) => ({
                symbol: cb.symbol,
                amount: cb.amount,
                valueUsd: cb.valueUsd,
                timestamp: cb.timestamp,
                logo: cb.logo,
                thumbnail: cb.thumbnail,
              })),
            },
            transactions: {
              create: dayTxsDb,
            },
          },
        });
      } else {
        // update
        await prisma.walletSnapshot.update({
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
                logo: cb.logo,
                thumbnail: cb.thumbnail,
              })),
            },
            transactions: {
              deleteMany: {},
              create: dayTxsDb,
            },
          },
        });
      }

      // move to next day
      currentDate = addOneDay(currentDate);
    }

    return res.json({
      success: true,
      message: "Daily snapshots created/updated",
    });
  } catch (error) {
    console.error("[dailyFullHistory] Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to build full daily history" });
  }
}

/*-----------------------------------------------------------
  Other controller functions used by wallet routes
-----------------------------------------------------------*/

/**
 * getWalletHistory (single-day approach)
 * GET /wallets/:address/history
 */
export async function getWalletHistory(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const chain = (req.query.chain as "ethereum" | "solana") || "ethereum";

    if (!address || address === "undefined") {
      return res.status(400).json({ error: "Address is required" });
    }

    // This lumps all current TX + balances into “today” snapshot
    await createOrUpdateDailySnapshot(address, chain);

    // Return all snapshots sorted desc
    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        snapshots: {
          orderBy: { timestamp: "desc" },
          include: { balances: true, transactions: true },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    return res.json(wallet.snapshots);
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    return res.status(500).json({ error: "Failed to fetch wallet history" });
  }
}

/**
 * getWalletSnapshots
 * GET /wallets/:address/snapshots
 */
export async function getWalletSnapshots(req: Request, res: Response) {
  try {
    const { address } = req.params;
    if (!address || address === "undefined") {
      return res.status(400).json({ error: "Address is required" });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        snapshots: {
          orderBy: { timestamp: "desc" },
          include: { balances: true, transactions: true },
        },
      },
    });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    return res.json(wallet.snapshots);
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return res.status(500).json({ error: "Failed to fetch snapshots" });
  }
}

/**
 * getWallet
 * GET /wallets/:address
 * Return wallet details + performance
 */
export async function getWallet(req: Request, res: Response) {
  try {
    const { address } = req.params;
    if (!address || address === "undefined") {
      return res.status(400).json({ error: "Address is required" });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        followedBy: true,
        snapshots: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // If you want to do real performance, you'd fetch more snapshots
    const snapArr = wallet.snapshots || [];
    const totalValue = snapArr[0]?.totalValue || 0;

    // Optional performance calculation example
    const calcPerformance = (arr: any[], period: "24h" | "7d" | "30d") => {
      if (arr.length < 2) return 0;
      const latest = arr[0];
      const periodMap = { "24h": 1, "7d": 7, "30d": 30 };
      const prevSnap = arr.find((s) => {
        const diff = (latest.timestamp - s.timestamp) / (24 * 60 * 60 * 1000);
        return diff >= periodMap[period];
      });
      if (!prevSnap) return 0;
      return (
        ((latest.totalValue - prevSnap.totalValue) / prevSnap.totalValue) * 100
      );
    };

    const performance = {
      "24h": calcPerformance(snapArr, "24h"),
      "7d": calcPerformance(snapArr, "7d"),
      "30d": calcPerformance(snapArr, "30d"),
      totalValue,
    };

    return res.json({
      address: wallet.address,
      isFollowed: wallet.followedBy.length > 0,
      performanceStats: performance,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return res.status(500).json({ error: "Failed to fetch wallet details" });
  }
}

/**
 * followWallet
 * POST /followed-wallets
 */
export async function followWallet(req: Request, res: Response) {
  try {
    const { address, currentUserAddress } = req.body;
    if (!address || !currentUserAddress) {
      return res
        .status(400)
        .json({ error: "Missing address or currentUserAddress" });
    }

    await prisma.wallet.update({
      where: { address: currentUserAddress },
      data: {
        following: {
          connectOrCreate: {
            where: { address },
            create: { address },
          },
        },
      },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Error following wallet:", error);
    return res.status(500).json({ error: "Failed to follow wallet" });
  }
}

/**
 * unfollowWallet
 * DELETE /followed-wallets/:address
 */
export async function unfollowWallet(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { currentUserAddress } = req.body;
    if (!address || !currentUserAddress) {
      return res
        .status(400)
        .json({ error: "Missing address or currentUserAddress" });
    }

    await prisma.wallet.update({
      where: { address: currentUserAddress },
      data: {
        following: {
          disconnect: { address },
        },
      },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing wallet:", error);
    return res.status(500).json({ error: "Failed to unfollow wallet" });
  }
}

/**
 * getFollowedWallets
 * GET /followed-wallets
 */
export async function getFollowedWallets(req: Request, res: Response) {
  try {
    const currentUserAddress = req.query.currentUserAddress as string;
    if (!currentUserAddress) {
      return res.json([]);
    }

    const wallet = await prisma.wallet.findUnique({
      where: { address: currentUserAddress },
      include: {
        following: {
          include: {
            snapshots: {
              orderBy: { timestamp: "desc" },
              take: 1,
            },
          },
        },
      },
    });
    if (!wallet) {
      return res.json([]);
    }

    const calcPerformance = (arr: any[], period: "24h" | "7d" | "30d") => {
      if (arr.length < 2) return 0;
      const latest = arr[0];
      const periodMap = { "24h": 1, "7d": 7, "30d": 30 };
      const prevSnap = arr.find((s) => {
        const diff = (latest.timestamp - s.timestamp) / (24 * 60 * 60 * 1000);
        return diff >= periodMap[period];
      });
      if (!prevSnap) return 0;
      return (
        ((latest.totalValue - prevSnap.totalValue) / prevSnap.totalValue) * 100
      );
    };

    const followedWallets = wallet.following.map((f, i) => {
      const sArr = f.snapshots || [];
      const totalValue = sArr[0]?.totalValue || 0;
      const dailyPerf = calcPerformance(sArr, "24h");
      return {
        address: f.address,
        performancePercent: dailyPerf,
        totalValue,
        rank: i + 1,
      };
    });
    return res.json(followedWallets);
  } catch (error) {
    console.error("Error fetching followed wallets:", error);
    return res.status(500).json({ error: "Failed to fetch followed wallets" });
  }
}

/**
 * createOrUpdateWallet
 * POST /wallets
 */
export async function createOrUpdateWallet(req: Request, res: Response) {
  try {
    const { address, ...rest } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: { ...rest },
      create: { address },
    });
    return res.json(wallet);
  } catch (error) {
    console.error("Error creating/updating wallet:", error);
    return res.status(500).json({ error: "Failed to create or update wallet" });
  }
}
