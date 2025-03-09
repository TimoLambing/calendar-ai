// server/src/controllers/walletController.ts

import { Request, Response } from "express";
import { prisma } from "../prisma/prisma";
import { ethers } from "ethers";
import {
  fetchEvmTransactions,
  fetchEvmTokenTransfers,
  fetchEvmTokenBalances,
  fetchSolanaTransactions,
  fetchSolanaTokenBalances,
  fetchDailyTokenBalances,
} from "../services/moralisService";

/**
 * Parses an EVM native transaction into our Transaction model.
 * @param tx Raw transaction data
 * @param userAddr User's wallet address
 * @param chain Chain ID ("0x1" for Ethereum, "0x2105" for Base)
 * @returns Parsed transaction object
 */
async function parseEvmTransaction(
  tx: any,
  userAddr: string,
  _chain: "0x1" | "0x2105" = "0x1"
) {
  const fromAddr = (tx.from || "").toLowerCase();
  const toAddr = (tx.to || "").toLowerCase();
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
    valueUsd: ethAmount,
    timestamp: new Date(timeMs),
    txHash: tx.hash,
    toAddress: toAddr,
  };
}

/**
 * Parses an EVM token transfer into our Transaction model.
 * @param tx Raw token transfer data
 * @param userAddr User's wallet address
 * @returns Parsed transaction object
 */
function parseEvmTokenTransfer(tx: any, userAddr: string) {
  const fromAddr = (tx.from_address || "").toLowerCase();
  const toAddr = (tx.to_address || "").toLowerCase();
  const isOutbound = fromAddr === userAddr.toLowerCase();
  const type = isOutbound ? "SELL" : "BUY";
  const decimals = parseInt(tx.value_decimals || "18", 10);
  const amount = parseFloat(tx.value || "0") / 10 ** decimals;

  return {
    symbol: tx.token_symbol || "Unknown",
    type,
    amount,
    valueUsd: tx.value_usd || amount * (tx.usdPrice || 0),
    timestamp: new Date(tx.block_timestamp),
    txHash: tx.transaction_hash,
    toAddress: toAddr,
  };
}

/**
 * Parses a Solana transaction (placeholder).
 * @param tx Raw transaction data
 * @param userAddr User's wallet address
 * @returns Parsed transaction object
 */
function parseSolanaTransaction(tx: any, _userAddr: string) {
  return {
    symbol: "SOL",
    type: "UNKNOWN",
    amount: 0,
    valueUsd: 0,
    timestamp: new Date(),
    txHash: tx.signature || null,
    toAddress: null,
  };
}

/**
 * Creates or updates a daily snapshot with transactions.
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
  let rawTokenTxs: any[] = [];
  let rawBalances: any[] = [];

  if (chain === "ethereum" || chain === "base") {
    rawTxs = await fetchEvmTransactions(address, chainId as "0x1" | "0x2105");
    rawTokenTxs = await fetchEvmTokenTransfers(
      address,
      chainId as "0x1" | "0x2105"
    );
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
      ? [
          ...(await Promise.all(
            rawTxs.map((tx) =>
              parseEvmTransaction(tx, address, chainId as "0x1" | "0x2105")
            )
          )),
          ...rawTokenTxs.map((tx) => parseEvmTokenTransfer(tx, address)),
        ]
      : rawTxs.map((tx) => parseSolanaTransaction(tx, address));

  const coinBalances = rawBalances.map((token: any) => ({
    symbol: token.symbol || (chain === "solana" ? "SOL" : "ETH"),
    amount:
      parseFloat(token.balance) /
      10 ** parseInt(token.decimals || (chain === "solana" ? "9" : "18")),
    valueUsd: token.usdValue || 0,
    timestamp: new Date(),
    logo: token.logo || null,
    thumbnail: token.thumbnail || null,
  }));

  const totalValue = coinBalances.reduce(
    (sum: number, c: any) => sum + c.valueUsd,
    0
  );

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
 * Builds full daily history of snapshots with transactions.
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
        ? [
            ...(await fetchEvmTransactions(
              address,
              chainId as "0x1" | "0x2105"
            )),
            ...(await fetchEvmTokenTransfers(
              address,
              chainId as "0x1" | "0x2105"
            )),
          ]
        : await fetchSolanaTransactions(address);

    const parsedTxs =
      chain !== "solana"
        ? await Promise.all(
            allTxs.map((tx: any) =>
              tx.value
                ? parseEvmTransaction(tx, address, chainId as "0x1" | "0x2105")
                : parseEvmTokenTransfer(tx, address)
            )
          )
        : allTxs.map((tx: any) => parseSolanaTransaction(tx, address));

    let earliestDate = parsedTxs.length
      ? parsedTxs.reduce(
          (min: Date, tx: any) => (tx.timestamp < min ? tx.timestamp : min),
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
        (t: any) => t.timestamp >= dayStart && t.timestamp < dayEnd
      );

      const found = dailyBalances.find(
        (db: any) =>
          new Date(db.date).toDateString() === dayStart.toDateString()
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

      const totalValue = coinBalances.reduce(
        (sum: number, cb: any) => sum + cb.valueUsd,
        0
      );

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
 * Fetches existing wallet snapshots, if startDate and endDate are provided, filters by date range.
 * @param req Express request object
 * @param res Express response object
 */
export async function getWalletSnapshots(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { startDate, endDate } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // Validate and parse dates
    let dateFilter: Record<string, Date> | undefined;
    if (startDate || endDate) {
      if (startDate && isNaN(Date.parse(startDate as string))) {
        return res.status(400).json({ error: "Invalid startDate format" });
      }
      if (endDate && isNaN(Date.parse(endDate as string))) {
        return res.status(400).json({ error: "Invalid endDate format" });
      }

      dateFilter = {
        ...(startDate ? { gte: new Date(startDate as string) } : {}),
        ...(endDate ? { lte: new Date(endDate as string) } : {}),
      };
    }

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        snapshots: {
          where: dateFilter ? { timestamp: dateFilter } : undefined,
          orderBy: { timestamp: "desc" },
          include: {
            balances: true,
            transactions: true,
          },
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
        (s: any) =>
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
    if (!address || !currentUserAddress) {
      return res
        .status(400)
        .json({ error: "Missing address or currentUserAddress" });
    }

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
    if (!address || !currentUserAddress) {
      return res
        .status(400)
        .json({ error: "Missing address or currentUserAddress" });
    }

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
        (s: any) =>
          (latest.timestamp - s.timestamp) / (24 * 60 * 60 * 1000) >=
          periodMap[period]
      );
      return prevSnap
        ? ((latest.totalValue - prevSnap.totalValue) / prevSnap.totalValue) *
            100
        : 0;
    };

    const followedWallets = wallet.following.map((f: any, i: number) => {
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
 * Creates or updates a wallet without generating snapshots.
 * @param req Express request object
 * @param res Express response object
 */
export async function createOrUpdateWallet(req: Request, res: Response) {
  try {
    const { address, chainId, chain, ...rest } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const wallet = await prisma.wallet.upsert({
      where: { address },
      create: {
        address,
        createdAt: new Date(),
        chains: chainId ? [chainId] : [],
        currentChain: chainId || null,
      },
      update: {
        ...rest,
        ...(chainId
          ? {
              chains: {
                push: chainId,
              },
              currentChain: chainId,
            }
          : {}),
      },
    });

    // Ensure chains array is unique
    const uniqueChains = [...new Set(wallet.chains)];
    if (uniqueChains.length !== wallet.chains.length) {
      await prisma.wallet.update({
        where: { address },
        data: { chains: uniqueChains },
      });
    }

    return res.json({
      wallet,
      message: "Wallet created or updated successfully",
    });
  } catch (error) {
    console.error("Error creating/updating wallet:", error);
    return res.status(500).json({ error: "Failed to create or update wallet" });
  }
}

/**
 * Generates wallet snapshots for a specific date range, only for missing dates.
 * @param req Express request object
 * @param res Express response object
 */
export async function generateWalletSnapshots(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { chain = "ethereum", startDate, endDate } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    console.log(
      "[generateWalletSnapshots] Request - address:",
      address,
      "chain:",
      chain,
      "startDate:",
      startDate,
      "endDate:",
      endDate
    );

    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;

    if (
      (startDate && isNaN(start!.getTime())) ||
      (endDate && isNaN(end!.getTime()))
    ) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (start && end && start > end) {
      return res
        .status(400)
        .json({ error: "startDate must be before endDate" });
    }

    const chainId =
      chain === "ethereum" ? "0x1" : chain === "base" ? "0x2105" : "solana";

    // Default range
    if (!start || !end) {
      end = new Date();
      start = new Date(end);
      start.setDate(end.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    console.log(
      "[generateWalletSnapshots] Processed dates - start:",
      start,
      "end:",
      end
    );

    // Check wallet
    const wallet = await prisma.wallet.findUnique({
      where: { address },
    });
    if (!wallet) {
      return res
        .status(404)
        .json({ error: "Wallet not found. Please create wallet first." });
    }

    // Existing snapshots
    const existingSnapshots = await prisma.walletSnapshot.findMany({
      where: {
        walletAddress: address,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      select: {
        timestamp: true,
      },
    });

    const existingDates = new Set(
      existingSnapshots.map((s) => s.timestamp.toDateString())
    );

    console.log(
      "[generateWalletSnapshots] Existing dates count:",
      existingDates.size
    );

    // Missing dates
    const missingDates: Date[] = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      if (!existingDates.has(dayStart.toDateString())) {
        missingDates.push(dayStart);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(
      "[generateWalletSnapshots] Missing dates count:",
      missingDates.length
    );

    if (missingDates.length === 0) {
      return res.json({
        createdSnapshotsCount: 0,
        message: `All snapshots already exist from ${start.toDateString()} to ${end.toDateString()}`,
      });
    }

    // Fetch transactions
    const allTxs =
      chain !== "solana"
        ? [
            ...(await fetchEvmTransactions(
              address,
              chainId as "0x1" | "0x2105"
            )),
            ...(await fetchEvmTokenTransfers(
              address,
              chainId as "0x1" | "0x2105"
            )),
          ]
        : await fetchSolanaTransactions(address);

    const parsedTxs =
      chain !== "solana"
        ? await Promise.all(
            allTxs.map((tx: any) =>
              tx.value
                ? parseEvmTransaction(tx, address, chainId as "0x1" | "0x2105")
                : parseEvmTokenTransfer(tx, address)
            )
          )
        : allTxs.map((tx: any) => parseSolanaTransaction(tx, address));

    const dailyBalances = await fetchDailyTokenBalances(
      address,
      start,
      end,
      chainId
    );

    const createdSnapshots = [];

    const io = req.app.get("socketio");

    for (const dayStart of missingDates) {
      console.log("[generateWalletSnapshots] Processing date:", dayStart);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTxs = parsedTxs.filter(
        (tx: any) => tx.timestamp >= dayStart && tx.timestamp <= dayEnd
      );

      const foundBalance = dailyBalances.find(
        (db: any) =>
          new Date(db.date).toDateString() === dayStart.toDateString()
      );

      const tokensForDay = foundBalance ? foundBalance.tokens : [];
      const coinBalances = tokensForDay.map((token: any) => ({
        symbol: token.symbol || (chain === "solana" ? "SOL" : "ETH"),
        amount:
          parseFloat(token.balance) /
          10 ** parseInt(token.decimals || (chain === "solana" ? "9" : "18")),
        valueUsd: token.usdValue || 0,
        timestamp: dayStart,
        logo: token.logo || null,
        thumbnail: token.thumbnail || null,
      }));

      const totalValue = coinBalances.reduce(
        (sum: number, cb: any) => sum + cb.valueUsd,
        0
      );

      const snapshot = await prisma.walletSnapshot.create({
        data: {
          walletAddress: address,
          timestamp: dayStart,
          totalValue,
          balances: { create: coinBalances },
          transactions: { create: dayTxs },
        },
        include: {
          balances: true,
          transactions: true,
        },
      });

      io.to(address).emit("snapshotGenerated", snapshot);
      createdSnapshots.push(snapshot);
    }

    console.log(
      "[generateWalletSnapshots] Created snapshots count:",
      createdSnapshots.length
    );

    io.to(address).emit("snapshotsGenerated", {
      walletAddress: address,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      createdSnapshotsCount: createdSnapshots.length,
      message: `Processed ${
        createdSnapshots.length
      } new snapshots from ${start.toDateString()} to ${end.toDateString()}`,
    });

    return res.json({
      createdSnapshotsCount: createdSnapshots.length,
      message: `Processed ${
        createdSnapshots.length
      } new snapshots from ${start.toDateString()} to ${end.toDateString()}`,
    });
  } catch (error) {
    console.error("Error generating wallet snapshots:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate wallet snapshots" });
  }
}
