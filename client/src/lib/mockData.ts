import { CoinBalance, Transaction } from "@shared/schema";

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
      "Woah, how's that new wife idea looking for ya? 💍",
      "Tell me you're retarded enough not to take profit here? 🤡",
      "Bruh, ain't no way you don't have insider information 🕵️",
      "You're gonna show that to your wife now and gamble it away, right? 🎰",
      "For the love of god, TAKE PROFIT. 💸"
    ]
  },
  high_gain: { // Gains between 30-50%
    threshold: 30,
    comments: [
      "Woah, how's that new wife idea looking for ya? 💍",
      "Tell me you're retarded enough not to take profit here? 🤡",
      "Bruh, ain't no way you don't have insider information 🕵️",
      "You're gonna show that to your wife now and gamble it away, right? 🎰",
      "For the love of god, TAKE PROFIT. 💸"
    ]
  },
  extreme_loss: { // Losses > 50%
    threshold: -50,
    comments: [
      "Why would anyone bet so poorly? 🤦‍♂️",
      "Looks like you've nosedived into complete shitters here mate. 💩",
      "Good gamble legend. 🎲",
      "Your wife needs a new man. There's no way she can do worse than this. 💔"
    ]
  },
  high_loss: { // Losses between 30-50%
    threshold: -30,
    comments: [
      "Why would anyone bet so poorly? 🤦‍♂️",
      "Looks like you've nosedived into complete shitters here mate. 💩",
      "Good gamble legend. 🎲",
      "Your wife needs a new man. There's no way she can do worse than this. 💔"
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
    valueUsd: "8500",
    currentValue: "8500"
  },
  {
    id: 2,
    walletId: 1,
    timestamp: new Date(),
    type: "SELL",
    symbol: "$FARTCOIN",
    amount: "500000",
    valueUsd: "7500",
    currentValue: "7500"
  }
];

// Update the generateMockData function to only show days up to today
export function generateMockData(days: number): DayData[] {
  const today = new Date(2025, 1, 21); // February 21, 2025
  const baseValue = 70434; // Starting value for today
  const maxValue = 446780; // Peak value
  const minValue = 30000; // Minimum value

  const getRandomVolatility = (min: number, max: number) => {
    // Ensure we never get close to 0% change
    const minChange = Math.max(min, 1); // Minimum 1% change
    const maxChange = Math.max(max, 45); // Maximum 45% change
    return (Math.random() * (maxChange - minChange) + minChange) / 100;
  };

  let currentValue = baseValue;
  const mockData: DayData[] = [];

  // Generate data for past days up to today
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Randomly decide if it's an up or down day
    const isUpDay = Math.random() > 0.5;
    const volatility = getRandomVolatility(1, 45);

    if (isUpDay) {
      currentValue *= (1 + volatility);
      if (currentValue > maxValue) currentValue = maxValue;
    } else {
      currentValue *= (1 - volatility);
      if (currentValue < minValue) currentValue = minValue;
    }

    const roundedValue = Math.round(currentValue);
    const previousValue = mockData[mockData.length - 1]?.totalValue;
    const percentChange = previousValue ? ((roundedValue - previousValue) / previousValue) * 100 : 0;

    // Get commentary based on volatility thresholds
    const commentary = getVolatilityComment(percentChange);

    const dayData = {
      date,
      totalValue: roundedValue,
      coins: mockCoins.map(coin => ({
        ...coin,
        valueUsd: Math.round(parseFloat(coin.valueUsd) * (1 + (Math.random() * 0.4 - 0.2))).toString()
      })),
      transactions: mockTransactions.map(tx => ({
        ...tx,
        currentValue: Math.round(parseFloat(tx.valueUsd) * (1 + (Math.random() * 0.4 - 0.2))).toString()
      })),
      commentary,
    };

    mockData.push(dayData);
  }

  return mockData;
}