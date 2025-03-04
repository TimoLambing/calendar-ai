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
 * Parses an EVM transaction into our Transaction model.
 * @param tx Raw transaction data
 * @param userAddr User's wallet address
 * @returns Parsed transaction object
 */
function parseEvmTransaction(tx: any, userAddr: string) {
  const fromAddr = (tx.from_address || "").toLowerCase();
  const isOutbound = fromAddr === userAddr.toLowerCase();
  const type = isOutbound ? "SELL" : "BUY";
  const rawWei = tx.value || "0";
  const ethAmount = parseFloat(ethers.formatEther(rawWei));
  const timeMs = tx.block_timestamp
    ? Date.parse(tx.block_timestamp)
    : Date.now();

  return {
    symbol: "ETH",
    type,
    amount: ethAmount,
    valueUsd: 0, // Moralis doesn’t provide tx USD value; fetch separately if needed
    timestamp: new Date(timeMs),
  };
}

/**
 * Parses a Solana transaction (placeholder).
 * @param tx Raw transaction data
 * @param userAddr User's wallet address
 * @returns Parsed transaction object
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
 * Creates or updates a daily snapshot for a wallet.
 * @param address Wallet address
 * @param chain Chain type ("ethereum", "base", "solana")
 * @returns Snapshot object or null on error
 */
async function createOrUpdateDailySnapshot(
  address: string,
  chain: "ethereum" | "base" | "solana"
) {
  const chainId =
    chain === "ethereum" ? "0x1" : chain === "base" ? "0x2105" : "solana";
  let rawTxs: any[] = [];
  let rawBalances: any[] = [];

  if (chain === "ethereum" || chain === "base") {
    rawTxs = await fetchEvmTransactions(address, chainId as "0x1" | "0x2105");
    rawBalances = await fetchEvmTokenBalances(
      address,
      chainId as "0x1" | "0x2105"
    );
  } else {
    rawTxs = await fetchSolanaTransactions(address);
    rawBalances = await fetchSolanaTokenBalances(address);
  }

  const txsToCreate =
    chain !== "solana"
      ? rawTxs.map((tx) => parseEvmTransaction(tx, address))
      : rawTxs.map((tx) => parseSolanaTransaction(tx, address));

  const coinBalances = rawBalances.map((token) => ({
    symbol: token.symbol || (chain === "solana" ? "SOL" : "ETH"),
    amount:
      parseFloat(token.balance) /
      10 ** parseInt(token.decimals || (chain === "solana" ? "9" : "18")),
    valueUsd: token.usdValue || 0,
    timestamp: new Date(),
    logo: token.logo || null,
    thumbnail: token.thumbnail || null,
  }));

  const totalValue = coinBalances.reduce((sum, c) => sum + c.valueUsd, 0);

  const wallet = await prisma.wallet.upsert({
    where: { address },
    update: {},
    create: { address },
  });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let snapshot = await prisma.walletSnapshot.findFirst({
    where: { walletAddress: wallet.address, timestamp: { gte: startOfDay } },
    include: { balances: true, transactions: true },
  });

  if (!snapshot) {
    snapshot = await prisma.walletSnapshot.create({
      data: {
        walletAddress: wallet.address,
        timestamp: new Date(),
        totalValue,
        balances: { create: coinBalances },
        transactions: { create: txsToCreate },
      },
      include: { balances: true, transactions: true },
    });
  } else {
    snapshot = await prisma.walletSnapshot.update({
      where: { id: snapshot.id },
      data: {
        totalValue,
        balances: { deleteMany: {}, create: coinBalances },
        transactions: { deleteMany: {}, create: txsToCreate },
      },
      include: { balances: true, transactions: true },
    });
  }

  return snapshot;
}

/**
 * Builds full daily history of snapshots from earliest transaction to today.
 * @param req Express request object
 * @param res Express response object
 */
export async function dailyFullHistory(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const chain =
      (req.query.chain as "ethereum" | "base" | "solana") || "ethereum";
    if (!address) return res.status(400).json({ error: "Address is required" });

    const chainId =
      chain === "ethereum" ? "0x1" : chain === "base" ? "0x2105" : "solana";
    const allTxs =
      chain !== "solana"
        ? await fetchEvmTransactions(address, chainId as "0x1" | "0x2105")
        : await fetchSolanaTransactions(address);
    const parsedTxs =
      chain !== "solana"
        ? allTxs.map((tx) => parseEvmTransaction(tx, address))
        : allTxs.map((tx) => parseSolanaTransaction(tx, address));
    let earliestDate = parsedTxs.length
      ? parsedTxs.reduce(
          (min, tx) => (tx.timestamp < min ? tx.timestamp : min),
          new Date()
        )
      : new Date(Date.now() - 86400000);
    const now = new Date();

    const dailyBalances = await fetchDailyTokenBalances(
      address,
      earliestDate,
      now,
      chainId
    );
    let currentDate = new Date(earliestDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= now) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate.setDate(currentDate.getDate() + 1));
      const dayTxs = parsedTxs.filter(
        (tx) => tx.timestamp >= dayStart && tx.timestamp < dayEnd
      );
      const found = dailyBalances.find(
        (db) => new Date(db.date).toDateString() === dayStart.toDateString()
      );
      const tokensForDay = found ? found.tokens : [];
      const coinBalances = tokensForDay.map((t: any) => ({
        symbol: t.symbol || (chain === "solana" ? "SOL" : "ETH"),
        amount:
          parseFloat(t.balance) /
          10 ** parseInt(t.decimals || (chain === "solana" ? "9" : "18")),
        valueUsd: t.usdValue || 0,
        timestamp: dayStart,
        logo: t.logo,
        thumbnail: t.thumbnail,
      }));

      const totalValue = coinBalances.reduce((sum, cb) => sum + cb.valueUsd, 0);
      const wallet = await prisma.wallet.upsert({
        where: { address },
        update: {},
        create: { address },
      });
      let snapshot = await prisma.walletSnapshot.findFirst({
        where: { walletAddress: address, timestamp: dayStart },
      });

      if (!snapshot) {
        await prisma.walletSnapshot.create({
          data: {
            walletAddress: address,
            timestamp: dayStart,
            totalValue,
            balances: { create: coinBalances },
            transactions: { create: dayTxs },
          },
        });
      } else {
        await prisma.walletSnapshot.update({
          where: { id: snapshot.id },
          data: {
            totalValue,
            balances: { deleteMany: {}, create: coinBalances },
            transactions: { deleteMany: {}, create: dayTxs },
          },
        });
      }
      currentDate = dayEnd;
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

/**
 * Fetches wallet history with a single-day snapshot.
 * @param req Express request object
 * @param res Express response object
 */
export async function getWalletHistory(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const chain =
      (req.query.chain as "ethereum" | "base" | "solana") || "ethereum";
    if (!address) return res.status(400).json({ error: "Address is required" });

    await createOrUpdateDailySnapshot(address, chain);
    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        snapshots: {
          orderBy: { timestamp: "desc" },
          include: { balances: true, transactions: true },
        },
      },
    });

    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    return res.json(wallet.snapshots);
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    return res.status(500).json({ error: "Failed to fetch wallet history" });
  }
}

/**
 * Fetches existing wallet snapshots.
 * @param req Express request object
 * @param res Express response object
 */
export async function getWalletSnapshots(req: Request, res: Response) {
  try {
    const { address } = req.params;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        snapshots: {
          orderBy: { timestamp: "desc" },
          include: { balances: true, transactions: true },
        },
      },
    });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    return res.json(wallet.snapshots);
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return res.status(500).json({ error: "Failed to fetch snapshots" });
  }
}

/**
 * Fetches wallet details and performance stats.
 * @param req Express request object
 * @param res Express response object
 */
export async function getWallet(req: Request, res: Response) {
  try {
    const { address } = req.params;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        followedBy: true,
        snapshots: { orderBy: { timestamp: "desc" }, take: 1 },
      },
    });
    if (!wallet) return res.status(404).json({ error: "Wallet not found" });

    const snapArr = wallet.snapshots || [];
    const totalValue = snapArr[0]?.totalValue || 0;
    const calcPerformance = (arr: any[], period: "24h" | "7d" | "30d") => {
      if (arr.length < 2) return 0;
      const latest = arr[0];
      const periodMap = { "24h": 1, "7d": 7, "30d": 30 };
      const prevSnap = arr.find(
        (s) =>
          (latest.timestamp - s.timestamp) / (24 * 60 * 60 * 1000) >=
          periodMap[period]
      );
      return prevSnap
        ? ((latest.totalValue - prevSnap.totalValue) / prevSnap.totalValue) *
            100
        : 0;
    };

    return res.json({
      address: wallet.address,
      isFollowed: wallet.followedBy.length > 0,
      performanceStats: {
        "24h": calcPerformance(snapArr, "24h"),
        "7d": calcPerformance(snapArr, "7d"),
        "30d": calcPerformance(snapArr, "30d"),
        totalValue,
      },
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return res.status(500).json({ error: "Failed to fetch wallet details" });
  }
}

/**
 * Follows a wallet.
 * @param req Express request object
 * @param res Express response object
 */
export async function followWallet(req: Request, res: Response) {
  try {
    const { address, currentUserAddress } = req.body;
    if (!address || !currentUserAddress)
      return res
        .status(400)
        .json({ error: "Missing address or currentUserAddress" });

    await prisma.wallet.update({
      where: { address: currentUserAddress },
      data: {
        following: {
          connectOrCreate: { where: { address }, create: { address } },
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
 * Unfollows a wallet.
 * @param req Express request object
 * @param res Express response object
 */
export async function unfollowWallet(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { currentUserAddress } = req.body;
    if (!address || !currentUserAddress)
      return res
        .status(400)
        .json({ error: "Missing address or currentUserAddress" });

    await prisma.wallet.update({
      where: { address: currentUserAddress },
      data: { following: { disconnect: { address } } },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing wallet:", error);
    return res.status(500).json({ error: "Failed to unfollow wallet" });
  }
}

/**
 * Fetches followed wallets.
 * @param req Express request object
 * @param res Express response object
 */
export async function getFollowedWallets(req: Request, res: Response) {
  try {
    const currentUserAddress = req.query.currentUserAddress as string;
    if (!currentUserAddress) return res.json([]);

    const wallet = await prisma.wallet.findUnique({
      where: { address: currentUserAddress },
      include: {
        following: {
          include: { snapshots: { orderBy: { timestamp: "desc" }, take: 1 } },
        },
      },
    });
    if (!wallet) return res.json([]);

    const calcPerformance = (arr: any[], period: "24h" | "7d" | "30d") => {
      if (arr.length < 2) return 0;
      const latest = arr[0];
      const periodMap = { "24h": 1, "7d": 7, "30d": 30 };
      const prevSnap = arr.find(
        (s) =>
          (latest.timestamp - s.timestamp) / (24 * 60 * 60 * 1000) >=
          periodMap[period]
      );
      return prevSnap
        ? ((latest.totalValue - prevSnap.totalValue) / prevSnap.totalValue) *
            100
        : 0;
    };

    const followedWallets = wallet.following.map((f, i) => {
      const sArr = f.snapshots || [];
      const totalValue = sArr[0]?.totalValue || 0;
      return {
        address: f.address,
        performancePercent: calcPerformance(sArr, "24h"),
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
 * Creates or updates a wallet and generates 30-day history for new wallets.
 * @param req Express request object
 * @param res Express response object
 */
export async function createOrUpdateWallet(req: Request, res: Response) {
  try {
    const { address, chain = "ethereum", ...rest } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const chainId =
      chain === "ethereum" ? "0x1" : chain === "base" ? "0x2105" : "solana";
    const existingWallet = await prisma.wallet.findUnique({
      where: { address },
    });
    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: { ...rest },
      create: { address, createdAt: new Date() },
    });

    if (!existingWallet) {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);

      const dailyBalances = await fetchDailyTokenBalances(
        address,
        startDate,
        endDate,
        chainId
      );
      for (const daily of dailyBalances) {
        const { date, tokens } = daily;
        const coinBalances = tokens.map((token: any) => ({
          symbol: token.symbol || (chain === "solana" ? "SOL" : "ETH"),
          amount:
            parseFloat(token.balance) /
            10 ** parseInt(token.decimals || (chain === "solana" ? "9" : "18")),
          valueUsd: token.usdValue || 0,
          timestamp: new Date(date),
          logo: token.logo || null,
          thumbnail: token.thumbnail || null,
        }));

        const totalValue = coinBalances.reduce(
          (sum, cb) => sum + cb.valueUsd,
          0
        );
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);

        let snapshot = await prisma.walletSnapshot.findFirst({
          where: { walletAddress: address, timestamp: dayStart },
        });

        if (!snapshot) {
          snapshot = await prisma.walletSnapshot.create({
            data: {
              walletAddress: address,
              timestamp: dayStart,
              totalValue,
              balances: { create: coinBalances },
              transactions: { create: [] },
            },
          });
        } else {
          await prisma.walletSnapshot.update({
            where: { id: snapshot.id },
            data: {
              totalValue,
              balances: { deleteMany: {}, create: coinBalances },
              transactions: { deleteMany: {}, create: [] },
            },
          });
        }
        console.log(
          `Created/updated snapshot for ${date.toDateString()}:`,
          snapshot
        );
      }
    }

    return res.json(wallet);
  } catch (error) {
    console.error("Error creating/updating wallet:", error);
    return res.status(500).json({ error: "Failed to create or update wallet" });
  }
}
