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

  const getRandomVolatility = (min: number, max: number) => {
    // Ensure we never get close to 0% change
    const minChange = Math.max(min, 5); // Minimum 5% change
    const maxChange = Math.max(max, 15); // Maximum change increased
    return (Math.random() * (maxChange - minChange) + minChange) / 100;
  };

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    if (i < peakDay) {
      // Rising phase - aggressive growth with minimum 5% daily change
      const upVolatility = getRandomVolatility(5, 35);
      baseValue *= (1 + upVolatility);
      if (baseValue > maxValue) baseValue = maxValue;
    } else {
      // Falling phase - aggressive decline with minimum 5% daily change
      const downVolatility = getRandomVolatility(5, 35);
      baseValue *= (1 - downVolatility);
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