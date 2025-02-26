// client/src/components/PortfolioStats.tsx

import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DayData } from "@/lib/mockData";

interface Props {
  data: DayData[];
}

export function PortfolioStats({ data }: Props) {
  // Create chronological order array for calculations
  const chronologicalData = [...data].reverse();

  // Calculate statistics
  const profitDays = chronologicalData.filter((day, index) => {
    if (index === 0) return false;
    return day.totalValue > chronologicalData[index - 1].totalValue;
  }).length;

  const lossDays = data.length - profitDays - 1; // Subtract 1 for the first day

  // Calculate coin performance with safety checks
  const coinPerformance = new Map<string, number>();

  // Only process if we have data
  if (chronologicalData.length > 0) {
    chronologicalData[0]?.coins.forEach((coin) => {
      const firstPrice = parseFloat(coin.valueUsd);
      const lastPrice = parseFloat(
        chronologicalData[chronologicalData.length - 1]?.coins.find(
          (c) => c.symbol === coin.symbol
        )?.valueUsd || "0"
      );
      const performance = ((lastPrice - firstPrice) / firstPrice) * 100;
      coinPerformance.set(coin.symbol, performance);
    });
  }

  // Find best and worst performing coins with safety checks
  const performances = Array.from(coinPerformance.entries());
  const defaultCoin: [string, number] = ["N/A", 0];

  const bestCoin =
    performances.length > 0
      ? performances.reduce((a, b) => (a[1] > b[1] ? a : b))
      : defaultCoin;

  const worstCoin =
    performances.length > 0
      ? performances.reduce((a, b) => (a[1] < b[1] ? a : b))
      : defaultCoin;

  // Calculate total portfolio performance with safety checks
  const startValue = chronologicalData[0]?.totalValue || 0;
  const endValue =
    chronologicalData[chronologicalData.length - 1]?.totalValue || 0;
  const totalPerformance =
    startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  return (
    <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-orange-400 to-orange-600">
        <CardContent className="pt-4 pb-3">
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="text-xs font-medium opacity-90">Profitable Days</p>
              <h3 className="text-xl font-bold">{profitDays || 0}</h3>
              <p className="text-xs opacity-75">vs {lossDays || 0} loss days</p>
            </div>
            <Trophy className="h-6 w-6 opacity-75" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-pink-400 to-pink-600">
        <CardContent className="pt-4 pb-3">
          <div className="text-white">
            <p className="text-xs font-medium opacity-90">Best Performer</p>
            <h3 className="text-xl font-bold">{bestCoin[0]}</h3>
            <p className="text-xs opacity-75">
              {bestCoin[1] > 0 ? "+" : ""}
              {bestCoin[1].toFixed(2)}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-400 to-blue-600">
        <CardContent className="pt-4 pb-3">
          <div className="text-white">
            <p className="text-xs font-medium opacity-90">Worst Performer</p>
            <h3 className="text-xl font-bold">{worstCoin[0]}</h3>
            <p className="text-xs opacity-75">{worstCoin[1].toFixed(2)}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-400 to-green-600">
        <CardContent className="pt-4 pb-3">
          <div className="text-white">
            <p className="text-xs font-medium opacity-90">Portfolio Value</p>
            <h3 className="text-xl font-bold">${endValue.toLocaleString()}</h3>
            <p className="text-xs opacity-75">
              {totalPerformance >= 0 ? "+" : ""}
              {totalPerformance.toFixed(2)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
