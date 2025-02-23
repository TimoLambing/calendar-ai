import { DayData } from './mockData';
import { generateMockData } from './mockData';

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

// Generate a random wallet address
function generateWalletAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Generate mock performance data for different time periods
export function getMockLeaderboardData(period: string, showBest: boolean = true): WalletPerformance[] {
  const wallets: WalletPerformance[] = [];
  const performanceRanges = {
    best: {
      min: 5,
      max: showBest ? 200 : -5
    },
    worst: {
      min: showBest ? -200 : -5,
      max: 5
    }
  };

  // Generate 50 wallets
  for (let i = 0; i < 50; i++) {
    const range = showBest ? performanceRanges.best : performanceRanges.worst;
    const performancePercent = (Math.random() * (range.max - range.min) + range.min) * 
      (period === '24h' ? 0.2 : // Smaller changes for shorter periods
       period === '7d' ? 0.5 :
       period === '30d' ? 1 :
       period === '60d' ? 1.5 :
       period === '180d' ? 2 :
       2.5); // 360d

    wallets.push({
      address: generateWalletAddress(),
      performancePercent: Number(performancePercent.toFixed(2)),
      totalValue: Math.floor(Math.random() * 1000000) + 10000, // Random value between 10k and 1M
      rank: i + 1,
      isFollowed: Math.random() > 0.9 // 10% chance of being followed
    });
  }

  // Sort by performance
  return wallets.sort((a, b) => 
    showBest ? 
      b.performancePercent - a.performancePercent : 
      a.performancePercent - b.performancePercent
  );
}

// For now, return mock data while we implement proper wallet integration
export async function getWalletHistory(address: string): Promise<DayData[]> {
  return generateMockData(28);
}

// Get ERC20 token balances (to be implemented with proper wallet integration)
export async function getWalletTokens(address: string) {
  return [];
}

// Mock wallet details
export function getMockWalletDetails(address: string) {
  return {
    address,
    isFollowed: Math.random() > 0.5,
    performanceStats: {
      "24h": Number((Math.random() * 40 - 20).toFixed(2)), // -20% to +20%
      "7d": Number((Math.random() * 60 - 30).toFixed(2)),  // -30% to +30%
      "30d": Number((Math.random() * 100 - 50).toFixed(2)), // -50% to +50%
      totalValue: Math.floor(Math.random() * 1000000) + 10000,
    }
  };
}