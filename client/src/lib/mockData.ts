import { CoinBalance, Transaction } from "@shared/schema";

export interface DayData {
  date: Date;
  totalValue: number;
  coins: CoinBalance[];
  transactions: Transaction[];
  notes?: string;
  commentary?: string;
}

// You can customize the comments for each volatility range by editing the comments arrays below
// Volatility ranges are defined by their thresholds:
// - extreme_gain: > 50% gains
// - high_gain: 30-50% gains
// - extreme_loss: < -50% losses
// - high_loss: -30% to -50% losses

export const volatilityComments = {
  extreme_gain: { // Gains > 50%
    threshold: 50,
    comments: [
      // Add your custom comments here for extreme gains
      "To the moon! 🚀 Next stop: Mars!",
      "Crypto genius or lucky gambler? Who cares, you're rich! 💎",
      "Time to buy that NFT of a rock you always wanted! 🪨",
      "Your portfolio is so high it needs a space suit! 👨‍🚀"
    ]
  },
  high_gain: { // Gains between 30-50%
    threshold: 30,
    comments: [
      // Add your high gain comments here
      "Move over Warren Buffett, there's a new sheriff in town! 🤠",
      "Time to screenshot this and never shut up about it! 📸",
      "Lamborghini dealer just added you on LinkedIn! 🏎️",
      "You're basically the Wolf of Meme Street now! 🐺"
    ]
  },
  extreme_loss: { // Losses > 50%
    threshold: -50,
    comments: [
      // Add your extreme loss comments here
      "Achievement Unlocked: Diamond Hands of Steel! 💎",
      "Time to update that McDonald's application... 🍔",
      "Your portfolio just pulled a magic trick - it disappeared! 🎩",
      "NGMI (Not Gonna Make It) status: Confirmed ⚰️"
    ]
  },
  high_loss: { // Losses between 30-50%
    threshold: -30,
    comments: [
      // Add your high loss comments here
      "You could've retired your parents, but you bought $FARTCOIN instead! 💨",
      "This is why your ex left you... 💔",
      "Ramen noodles are actually quite nutritious! 🍜",
      "Your financial advisor just blocked you on all social media! 🚫"
    ]
  }
};

// Helper function to get comment based on volatility
function getVolatilityComment(percentChange: number): string | undefined {
  let category;
  if (percentChange > volatilityComments.extreme_gain.threshold) {
    category = volatilityComments.extreme_gain;
  } else if (percentChange > volatilityComments.high_gain.threshold) {
    category = volatilityComments.high_gain;
  } else if (percentChange < volatilityComments.extreme_loss.threshold) {
    category = volatilityComments.extreme_loss;
  } else if (percentChange < volatilityComments.high_loss.threshold) {
    category = volatilityComments.high_loss;
  }

  return category?.comments[Math.floor(Math.random() * category.comments.length)];
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

export function generateMockData(days: number): DayData[] {
  const startDate = new Date(2024, 1, 1); // February 1st, 2024
  let baseValue = 30000; // Starting value
  const maxValue = 446780; // Peak value
  const endValue = 70434; // Final crash value

  const peakDay = Math.floor(days * 0.6); // Peak around 60% through the month
  const mockData: DayData[] = [];

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Calculate value based on position in the timeline
    if (i < peakDay) {
      // Rising phase - more aggressive growth
      const progress = i / peakDay;
      baseValue = baseValue * (1 + (0.4 * progress + Math.random() * 0.2));
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

    // Get commentary based on volatility thresholds
    const commentary = getVolatilityComment(percentChange);

    const dayData = {
      date,
      totalValue: roundedValue,
      coins: mockCoins.map(coin => ({
        ...coin,
        valueUsd: Math.round(parseFloat(coin.valueUsd) * (1 + (Math.random() * 0.4 - 0.2))).toString()
      })),
      transactions: mockTransactions,
      commentary,
    };

    mockData.push(dayData);
    return dayData;
  });
}