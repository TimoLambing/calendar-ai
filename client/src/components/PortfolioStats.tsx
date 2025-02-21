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
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Profitable Days</p>
              <h3 className="text-2xl font-bold">{profitDays}</h3>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">vs {lossDays} loss days</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Best Performer</p>
          <h3 className="text-2xl font-bold">{bestCoin[0]}</h3>
          <p className="text-sm text-green-600">+{bestCoin[1].toFixed(2)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Worst Performer</p>
          <h3 className="text-2xl font-bold">{worstCoin[0]}</h3>
          <p className="text-sm text-red-600">{worstCoin[1].toFixed(2)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Portfolio Value</p>
          <h3 className="text-2xl font-bold">${endValue.toLocaleString()}</h3>
          <p className={`text-sm ${totalPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPerformance >= 0 ? '+' : ''}{totalPerformance.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
