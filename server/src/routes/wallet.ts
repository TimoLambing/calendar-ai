// server/src/routes/wallet.ts

import { Router } from "express";
import { prisma } from "../prisma/prisma";
import { decodeTransaction } from "../utils/ether-decode";
import {
  getEtherWalletTransactions,
  getWalletTokenBalanceSnapshots,
  createOrUpdateDailySnapshot,
} from "../api/wallet";

const router = Router();

/**
 * GET /wallets/:address/history
 * - Creates/updates today's snapshot for the wallet
 * - Then returns all snapshots (desc)
 */
router.get("/wallets/:address/history", async (req, res) => {
  try {
    const { address } = req.params;

    // If chain is undefined or empty, default to "ethereum"
    const chain = (req.query.chain as "ethereum" | "solana") || "ethereum";

    // Create or update daily snapshot
    await createOrUpdateDailySnapshot(address, chain);

    // Return all snapshots sorted by timestamp desc
    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        snapshots: {
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
    console.error("Error fetching wallet history:", error);
    res.status(500).json({ error: "Failed to fetch wallet history" });
  }
});

/**
 * GET /wallets/:address/snapshots
 * - Just returns existing snapshots (desc),
 *   without forcing a new snapshot fetch from Alchemy/Helius.
 */
router.get("/wallets/:address/snapshots", async (req, res) => {
  try {
    const { address } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        snapshots: {
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
    res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

// GET /wallets/:address -> For basic wallet details + performance
router.get("/wallets/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: {
        followedBy: true,
        snapshots: {
          orderBy: { timestamp: "desc" },
          take: 1,
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

    // Quick performance stats
    const latestSnapshot = wallet.snapshots[0];
    const totalValue = latestSnapshot?.totalValue || 0;

    return res.json({
      id: wallet.id,
      address: wallet.address,
      isFollowed: wallet.followedBy.length > 0,
      performanceStats: {
        "24h": calculatePerformance(wallet.snapshots, "24h"),
        "7d": calculatePerformance(wallet.snapshots, "7d"),
        "30d": calculatePerformance(wallet.snapshots, "30d"),
        totalValue,
      },
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return res.status(500).json({ error: "Failed to fetch wallet details" });
  }
});

/**
 * POST /followed-wallets
 * Follow a wallet (unchanged)
 */
router.post("/followed-wallets", async (req, res) => {
  try {
    const { address } = req.body;
    const currentUserAddress = req.body.currentUserAddress;

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

    res.json({ success: true });
  } catch (error) {
    console.error("Error following wallet:", error);
    res.status(500).json({ error: "Failed to follow wallet" });
  }
});

/**
 * DELETE /followed-wallets/:address
 * Unfollow a wallet (unchanged)
 */
router.delete("/followed-wallets/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const currentUserAddress = req.body.currentUserAddress;

    await prisma.wallet.update({
      where: { address: currentUserAddress },
      data: {
        following: {
          disconnect: { address },
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing wallet:", error);
    res.status(500).json({ error: "Failed to unfollow wallet" });
  }
});

/**
 * GET /followed-wallets
 * Return all followed wallets (unchanged)
 */
router.get("/followed-wallets", async (req, res) => {
  try {
    const currentUserAddress = req.query.currentUserAddress as string;

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

    const followedWallets = wallet.following.map(
      (followed: any, index: number) => ({
        address: followed.address,
        performancePercent: calculatePerformance(followed.snapshots, "24h"),
        totalValue: followed.snapshots[0]?.totalValue || 0,
        rank: index + 1,
      })
    );

    return res.json(followedWallets);
  } catch (error) {
    console.error("Error fetching followed wallets:", error);
    return res.status(500).json({ error: "Failed to fetch followed wallets" });
  }
});

// Helper function to compute e.g. 24h performance
function calculatePerformance(
  snapshots: any[],
  period: "24h" | "7d" | "30d"
): number {
  if (!snapshots || snapshots.length < 2) return 0;

  const latest = snapshots[0];
  const periodMap = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
  };

  const previous = snapshots.find((s) => {
    const diff = (latest.timestamp - s.timestamp) / (1000 * 60 * 60 * 24);
    return diff >= periodMap[period];
  });

  if (!previous) return 0;
  return (
    ((latest.totalValue - previous.totalValue) / previous.totalValue) * 100
  );
}

// Create or update a wallet
router.post('/wallets', async (req, res) => {
  try {
    // rest is all the fields except address.
    // This will be useful when updating the wallet.
    const { address, ...rest } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const wallet = await prisma.wallet.upsert({
      where: { address },
      update: { ...rest },
      create: { address },
    });

    // TEST ADDRESS
    // const walletAddress = '0x1e58fdeff054b68cdd33db44b9f724e7bd87dfe7'; 

    const startDate = "2022-01-03";
    const endDate = "2022-01-04";

    const snapshots = await getWalletTokenBalanceSnapshots(address, '0x1', startDate, endDate);

    // Iterate over snapshots and save to Prisma if not already existing
    for (const snapshot of snapshots) {
      const { walletId, timestamp, symbol, totalValue, name, logo, thumbnail } = snapshot;

      // Check if snapshot with same walletId, timestamp, and symbol already exists
      const existingSnapshot = await prisma.tokenSnapshot.findFirst({
        where: {
          walletId,
          timestamp: new Date(timestamp),  // Ensure the timestamp is a Date object
          symbol,
        },
      });
      // Only save if no existing snapshot found
      if (!existingSnapshot) {
        console.log('Creating snapshot:', snapshot);
        await prisma.tokenSnapshot.create({
          data: {
            walletId,
            timestamp: new Date(timestamp),
            symbol,
            totalValue,
            name,
            logo,
            thumbnail,
          },
        });
      }
    }

    return res.json(wallet);
  } catch (error) {
    console.error('Error creating/updating wallet:', error);
    return res.status(500).json({ error: 'Failed to create or update wallet' });
  }
});

export default router;