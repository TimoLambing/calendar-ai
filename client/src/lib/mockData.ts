import { CoinBalance, Transaction } from "@/schemas";

// You can customize the comments for each volatility range by editing the comments arrays below
// Volatility ranges are defined by their thresholds:
// - extreme_gain: > 50% gains
// - high_gain: 30-50% gains
// - moderate_gain: 10-30% gains
// - extreme_loss: < -50% losses
// - high_loss: -30% to -50% losses
// - moderate_loss: -10% to -30% losses

export const volatilityComments = {
  extreme_gain: {
    // Gains > 50%
    threshold: 50,
    comments: [
      "Chad trader detected! Save some gains for the rest of us 💪",
      "Moon mission confirmed! Next stop: Your ex's Instagram story 🚀",
      "Finally, time to start that crypto influencer YouTube channel! 📈",
      "Wen Binance Blockchain Week VIP ticket? 🎫",
      "Time to update the Lambo pre-order! 🏎️",
    ],
  },
  high_gain: {
    // Gains between 30-50%
    threshold: 30,
    comments: [
      "Wife-changing gains incoming! 💎",
      "Finally, Ramen is off the menu boys! 🍜",
      "Time to update that Tinder bio with 'crypto entrepreneur' 📱",
      "Look who's ready for Miami Crypto Week! 🌴",
      "From McDonald's to Michelin stars real quick! 🌟",
    ],
  },
  moderate_gain: {
    // Gains between 10-30%
    threshold: 10,
    comments: [
      "Starting to feel like a proper degen now! 🎰",
      "Maybe that Discord alpha wasn't a scam after all! 🤔",
      "Time to flex on Crypto Twitter! 🐦",
      "Almost enough gains to quit the day job... almost! 💼",
      "Portfolio looking thicc today! 👀",
    ],
  },
  extreme_loss: {
    // Losses > 50%
    threshold: -50,
    comments: [
      "Looks like someone's back to cup noodles for dinner 🍜",
      "Did you try turning your monitor upside down? 🙃",
      "Your wife's boyfriend won't be happy about this one 😬",
      "Maybe it's time to start an OnlyFans? 📸",
      "Achievement Unlocked: Maximum Pain 💀",
    ],
  },
  high_loss: {
    // Losses between 30-50%
    threshold: -30,
    comments: [
      "Have you tried not being poor? 💸",
      "Time to delete the app and pretend this never happened 🙈",
      "Sir, this is a casino. And you're losing. 🎰",
      "McDonald's is hiring! Just saying... 🍔",
      "Can't lose money if you can't log in *taps head* 🤔",
    ],
  },
  moderate_loss: {
    // Losses between 10-30%
    threshold: -10,
    comments: [
      "Buy high, sell low strategy working perfectly! 📉",
      "At least you still have your health! ...right? 🏥",
      "Time to start that 'technical analysis' course! 📚",
      "HODL they said, it'll be fun they said... 😅",
      "Is this what they call 'buying the dip'? 🎢",
    ],
  },
};

// Helper function to get comment based on volatility
function getVolatilityComment(percentChange: number): string | undefined {
  let category;
  if (percentChange > volatilityComments.extreme_gain.threshold) {
    category = volatilityComments.extreme_gain;
  } else if (percentChange > volatilityComments.high_gain.threshold) {
    category = volatilityComments.high_gain;
  } else if (percentChange > volatilityComments.moderate_gain.threshold) {
    category = volatilityComments.moderate_gain;
  } else if (percentChange < volatilityComments.extreme_loss.threshold) {
    category = volatilityComments.extreme_loss;
  } else if (percentChange < volatilityComments.high_loss.threshold) {
    category = volatilityComments.high_loss;
  } else if (percentChange < volatilityComments.moderate_loss.threshold) {
    category = volatilityComments.moderate_loss;
  }

  return category?.comments[
    Math.floor(Math.random() * category.comments.length)
  ];
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
  { id: '1', snapshotId: '1', symbol: "BTC", amount: "0.5", valueUsd: "25000" },
  { id: '2', snapshotId: '1', symbol: "ETH", amount: "4.2", valueUsd: "12600" },
  {
    id: '3',
    snapshotId: '1',
    symbol: "$GRIFFAIN",
    amount: "42069",
    valueUsd: "8500",
  },
  {
    id: '4',
    snapshotId: '1',
    symbol: "$TIBBIR",
    amount: "666666",
    valueUsd: "12000",
  },
  {
    id: '5',
    snapshotId: '1',
    symbol: "$FARTCOIN",
    amount: "1000000",
    valueUsd: "15000",
  },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    walletId: '1',
    timestamp: new Date(),
    type: "BUY",
    symbol: "$GRIFFAIN",
    amount: "42069",
    valueUsd: "8500",
    currentValue: "8500",
  },
  {
    id: '2',
    walletId: '1',
    timestamp: new Date(),
    type: "SELL",
    symbol: "$FARTCOIN",
    amount: "500000",
    valueUsd: "7500",
    currentValue: "7500",
  },
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
      currentValue *= 1 + volatility;
      if (currentValue > maxValue) currentValue = maxValue;
    } else {
      currentValue *= 1 - volatility;
      if (currentValue < minValue) currentValue = minValue;
    }

    const roundedValue = Math.round(currentValue);
    const previousValue = mockData[mockData.length - 1]?.totalValue;
    const percentChange = previousValue
      ? ((roundedValue - previousValue) / previousValue) * 100
      : 0;

    // Get commentary based on volatility thresholds
    const commentary = getVolatilityComment(percentChange);

    const dayData = {
      date,
      totalValue: roundedValue,
      coins: mockCoins.map((coin) => ({
        ...coin,
        valueUsd: Math.round(
          parseFloat(coin.valueUsd) * (1 + (Math.random() * 0.4 - 0.2))
        ).toString(),
      })),
      transactions: mockTransactions.map((tx) => ({
        ...tx,
        currentValue: Math.round(
          parseFloat(tx.valueUsd) * (1 + (Math.random() * 0.4 - 0.2))
        ).toString(),
      })),
      commentary,
    };

    mockData.push(dayData);
  }

  return mockData;
}
