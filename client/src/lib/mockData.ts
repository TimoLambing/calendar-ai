import { CoinBalance, Transaction } from "@shared/schema";

export interface DayData {
  date: Date;
  totalValue: number;
  coins: CoinBalance[];
  transactions: Transaction[];
  notes?: string;
}

const mockCoins: CoinBalance[] = [
  { id: 1, snapshotId: 1, symbol: "BTC", amount: "0.5", valueUsd: "25000" },
  { id: 2, snapshotId: 1, symbol: "ETH", amount: "4.2", valueUsd: "12600" },
  { id: 3, snapshotId: 1, symbol: "SOL", amount: "85", valueUsd: "8500" }
];

const mockTransactions: Transaction[] = [
  { 
    id: 1, 
    walletId: 1, 
    timestamp: new Date(), 
    type: "BUY", 
    symbol: "BTC", 
    amount: "0.1", 
    valueUsd: "5000" 
  },
  { 
    id: 2, 
    walletId: 1, 
    timestamp: new Date(), 
    type: "SELL", 
    symbol: "ETH", 
    amount: "1.5", 
    valueUsd: "4500" 
  }
];

export function generateMockData(startDate: Date, days: number): DayData[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Simulate some value fluctuation
    const multiplier = 1 + (Math.random() * 0.1 - 0.05); // ±5% daily change
    const totalValue = Math.round(46100 * multiplier);

    return {
      date,
      totalValue,
      coins: mockCoins.map(coin => ({
        ...coin,
        valueUsd: Math.round(parseFloat(coin.valueUsd) * multiplier).toString()
      })),
      transactions: mockTransactions,
      notes: i % 3 === 0 ? "Market showing bullish signals today" : undefined
    };
  });
}