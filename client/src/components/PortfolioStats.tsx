import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DayData } from "@/lib/mockData";

interface Props {
  data: DayData[];
}

export function PortfolioStats({ data }: Props) {
  // Calculate statistics
  const profitDays = data.filter(day => {
    const prevDay = data[data.indexOf(day) - 1];
    return prevDay ? day.totalValue > prevDay.totalValue : false;
  }).length;

  const lossDays = data.length - profitDays;

  // Calculate coin performance
  const coinPerformance = new Map<string, number>();

  data[0]?.coins.forEach(coin => {
    const firstPrice = parseFloat(coin.valueUsd);
    const lastPrice = parseFloat(data[data.length - 1]?.coins.find(c => c.symbol === coin.symbol)?.valueUsd || "0");
    const performance = ((lastPrice - firstPrice) / firstPrice) * 100;
    coinPerformance.set(coin.symbol, performance);
  });

  // Find best and worst performing coins
  const performances = Array.from(coinPerformance.entries());
  const bestCoin = performances.reduce((a, b) => a[1] > b[1] ? a : b);
  const worstCoin = performances.reduce((a, b) => a[1] < b[1] ? a : b);

  // Calculate total portfolio performance
  const startValue = data[0]?.totalValue || 0;
  const endValue = data[data.length - 1]?.totalValue || 0;
  const totalPerformance = ((endValue - startValue) / startValue) * 100;

  return (
    <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-orange-400 to-orange-600">
        <CardContent className="pt-4 pb-3">
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="text-xs font-medium opacity-90">Profitable Days</p>
              <h3 className="text-xl font-bold">{profitDays}</h3>
              <p className="text-xs opacity-75">vs {lossDays} loss days</p>
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
            <p className="text-xs opacity-75">+{bestCoin[1].toFixed(2)}%</p>
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
              {totalPerformance >= 0 ? '+' : ''}{totalPerformance.toFixed(2)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}