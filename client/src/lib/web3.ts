import { DayData } from './mockData';
import { generateMockData } from './mockData';

export interface WalletConnection {
  address: string;
  balance: string;
}

// For now, return mock data while we implement proper wallet integration
export async function getWalletHistory(address: string): Promise<DayData[]> {
  return generateMockData(28);
}

// Get ERC20 token balances (to be implemented with proper wallet integration)
export async function getWalletTokens(address: string) {
  return [];
}