// client/src/lib/web3.ts

import { DayData } from "./mockData";
import { generateMockData } from "./mockData";

export interface WalletConnection {
  address: string;
  balance: string;
}

export interface WalletPerformance {
  address: string;
  performancePercent: number;
  totalValue: number;
  rank: number;
  isFollowed?: boolean;
}

export interface JournalEntry {
  id: number;
  comment: string;
  timestamp: string;
  portfolioValue: number;
  valueChange: number;
  walletId: string;
  authorAddress: string;
}

// Generate a random wallet address
function generateWalletAddress(): string {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Generate mock performance data for different time periods
export function getMockLeaderboardData(
  period: string,
  showBest: boolean = true
): WalletPerformance[] {
  const wallets: WalletPerformance[] = [];
  const performanceRanges = {
    best: {
      min: 20, // Minimum 20% gain for best performers
      max: showBest ? 500 : -20, // Up to 500% gains
    },
    worst: {
      min: showBest ? -80 : -20, // Down to -80% losses
      max: 20,
    },
  };

  // Generate 50 wallets
  for (let i = 0; i < 50; i++) {
    const range = showBest ? performanceRanges.best : performanceRanges.worst;
    const performancePercent =
      (Math.random() * (range.max - range.min) + range.min) *
      (period === "24h"
        ? 0.3 // More volatile short-term movements
        : period === "7d"
          ? 0.7
          : period === "30d"
            ? 1.2
            : period === "60d"
              ? 1.8
              : period === "180d"
                ? 2.5
                : 3.0); // 360d - Most volatile

    wallets.push({
      address: generateWalletAddress(),
      performancePercent: Number(performancePercent.toFixed(2)),
      totalValue: Math.floor(Math.random() * 5000000) + 50000, // Random value between 50k and 5M
      rank: i + 1,
      isFollowed: Math.random() > 0.9, // 10% chance of being followed
    });
  }

  // Sort by performance
  return wallets.sort((a, b) =>
    showBest
      ? b.performancePercent - a.performancePercent
      : a.performancePercent - b.performancePercent
  );
}

// Mock wallet details
export function getMockWalletDetails(address: string) {
  return {
    address,
    isFollowed: Math.random() > 0.5,
    performanceStats: {
      "24h": Number((Math.random() * 100 - 50).toFixed(2)), // -50% to +50%
      "7d": Number((Math.random() * 150 - 75).toFixed(2)), // -75% to +75%
      "30d": Number((Math.random() * 300 - 150).toFixed(2)), // -150% to +150%
      totalValue: Math.floor(Math.random() * 5000000) + 50000,
    },
  };
}

// For now, return mock data while we implement proper wallet integration
export async function getWalletHistory(address: string): Promise<DayData[]> {
  // Get current user's wallet address (or use a mock one for demo)
  const currentUserAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

  // Generate more volatile data for other wallets
  // const volatilityFactor = address === currentUserAddress ? 1 : 2;
  return generateMockData(28);
}

// Generate mock journal entries for the last few days
export function getMockJournalEntries(address: string): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const today = new Date();
  const mockComments = [
    "Successfully executed swing trade on BTC dip. Market showing strong support levels.",
    "Increased ETH position due to upcoming network upgrade. Technical indicators looking bullish.",
    "Taking profits on altcoin rally. RSI indicating overbought conditions.",
    "Maintaining current positions. Market volatility suggests cautious approach.",
    "Added to positions during market correction. Long-term fundamentals remain strong.",
  ];

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const valueChange = Math.random() * 40 - 20; // -20% to +20%
    const portfolioValue = Math.floor(Math.random() * 5000000) + 50000;

    entries.push({
      id: i + 1,
      comment: mockComments[i],
      timestamp: date.toISOString(),
      portfolioValue,
      valueChange,
      walletId: "mock-wallet-id",
      authorAddress: address,
    });
  }

  return entries;
}

// Get ERC20 token balances (to be implemented with proper wallet integration)
export async function getWalletTokens(address: string) {
  return [];
}
