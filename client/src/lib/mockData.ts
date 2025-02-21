import { CoinBalance, Transaction } from "@shared/schema";

export interface DayData {
  date: Date;
  totalValue: number;
  coins: CoinBalance[];
  transactions: Transaction[];
  notes?: string;
  commentary?: string;
}

const mockCoins: CoinBalance[] = [
  { id: 1, snapshotId: 1, symbol: "BTC", amount: "0.5", valueUsd: "25000" },
  { id: 2, snapshotId: 1, symbol: "ETH", amount: "4.2", valueUsd: "12600" },
  { id: 3, snapshotId: 1, symbol: "$GRIFFAIN", amount: "42069", valueUsd: "8500" },
  { id: 4, snapshotId: 1, symbol: "$TIBBIR", amount: "666666", valueUsd: "12000" },
  { id: 5, snapshotId: 1, symbol: "$FARTCOIN", amount: "1000000", valueUsd: "15000" }
];

const mockTransactions: Transaction[] = [
  { 
    id: 1, 
    walletId: 1, 
    timestamp: new Date(), 
    type: "BUY", 
    symbol: "$GRIFFAIN", 
    amount: "42069", 
    valueUsd: "8500" 
  },
  { 
    id: 2, 
    walletId: 1, 
    timestamp: new Date(), 
    type: "SELL", 
    symbol: "$FARTCOIN", 
    amount: "500000", 
    valueUsd: "7500" 
  }
];

function getGainComment(value: number): string {
  const comments = [
    "Move over Warren Buffett, there's a new sheriff in town! 🤠",
    "Congrats! You're now qualified to give financial advice on TikTok! 🎵",
    "Time to screenshot this and never shut up about it! 📸",
    "You could've bought a $1,000,000 apartment in sunny Spain, or 4 Ferraris. Yet, you decided to be a retard. 🏎️",
    "Look at you, trading AI tokens like you actually understand what AI means! 🤖",
    "Your portfolio is higher than Snoop Dogg right now! 🌿"
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

function getLossComment(value: number): string {
  const comments = [
    "You could've retired your parents, but you bought $FARTCOIN instead! 💨",
    "This is equivalent to an average 10-year salary in the US. Hope the memes were worth it! 💸",
    "Remember when you said 'Trust me bro, this is the future'? 🤡",
    "Your portfolio is performing worse than a banana taped to a wall! 🍌",
    "Time to update that LinkedIn profile... 💼",
    "At least you'll have a great story for your grandkids! 👴"
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

export function generateMockData(days: number): DayData[] {
  const startDate = new Date(2024, 1, 1); // February 1st, 2024
  let baseValue = 30000; // Starting value
  const maxValue = 1330344; // Peak value
  const endValue = 70434; // Final crash value

  const peakDay = Math.floor(days * 0.6); // Peak around 60% through the month

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Calculate value based on position in the timeline
    if (i < peakDay) {
      // Rising phase - more aggressive growth
      const progress = i / peakDay;
      baseValue = baseValue * (1 + (0.4 * progress + Math.random() * 0.2)); // Much more aggressive growth
      if (baseValue > maxValue) baseValue = maxValue;
    } else {
      // Falling phase - dramatic crash
      const remainingDays = days - peakDay;
      const progress = (i - peakDay) / remainingDays;
      baseValue = maxValue - (maxValue - endValue) * (progress * (1 + Math.random() * 0.3));
      if (baseValue < endValue) baseValue = endValue;
    }

    const roundedValue = Math.round(baseValue);
    const previousValue = i > 0 ? mockData[i - 1]?.totalValue : roundedValue;
    const percentChange = ((roundedValue - previousValue) / previousValue) * 100;

    // Add commentary based on performance
    let commentary;
    if (Math.abs(percentChange) > 20) {
      commentary = percentChange > 0 ? getGainComment(roundedValue) : getLossComment(roundedValue);
    }

    return {
      date,
      totalValue: roundedValue,
      coins: mockCoins.map(coin => ({
        ...coin,
        valueUsd: Math.round(parseFloat(coin.valueUsd) * (1 + (Math.random() * 0.4 - 0.2))).toString()
      })),
      transactions: mockTransactions,
      commentary
    };
  });
}

// Initialize mock data array
const mockData: DayData[] = [];