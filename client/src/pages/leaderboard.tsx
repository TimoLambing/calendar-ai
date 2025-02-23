import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, TrendingDown, Users, ExternalLink } from "lucide-react";

type TimePeriod = "24h" | "7d" | "30d" | "60d" | "180d" | "360d";

interface WalletPerformance {
  address: string;
  performancePercent: number;
  totalValue: number;
  rank: number;
  isFollowed?: boolean;
}

export default function Leaderboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("24h");
  const [showBest, setShowBest] = useState(true);

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = useQuery<WalletPerformance[]>({
    queryKey: ['leaderboard', timePeriod, showBest],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?period=${timePeriod}&sort=${showBest ? 'best' : 'worst'}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard data');
      return response.json();
    }
  });

  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "60d", label: "60d" },
    { value: "180d", label: "180d" },
    { value: "360d", label: "360d" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
              <p className="text-gray-400 mt-1">Track top performing wallets</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/following">
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Following
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Time period selector */}
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((period) => (
              <Button
                key={period.value}
                variant={timePeriod === period.value ? "default" : "outline"}
                onClick={() => setTimePeriod(period.value)}
                className="min-w-[60px]"
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Performance type tabs */}
          <Tabs defaultValue="best" className="w-full" onValueChange={(value) => setShowBest(value === 'best')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="best" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Best Performers
              </TabsTrigger>
              <TabsTrigger value="worst" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Worst Performers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="best" className="mt-6">
              <WalletList data={leaderboardData} isLoading={isLoading} type="best" />
            </TabsContent>
            <TabsContent value="worst" className="mt-6">
              <WalletList data={leaderboardData} isLoading={isLoading} type="worst" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface WalletListProps {
  data?: WalletPerformance[];
  isLoading: boolean;
  type: 'best' | 'worst';
}

function WalletList({ data, isLoading, type }: WalletListProps) {
  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-12">
        Loading {type} performers...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        No performance data available
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {data.map((wallet) => (
        <Card key={wallet.address} className="hover:bg-gray-100/5 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  {wallet.rank}
                </div>
                <div>
                  <div className="font-medium">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </div>
                  <div className="text-sm text-gray-400">
                    ${wallet.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-lg font-bold ${type === 'best' ? 'text-green-500' : 'text-red-500'}`}>
                  {type === 'best' ? '+' : ''}{wallet.performancePercent.toFixed(2)}%
                </div>
                <Link href={`/wallet/${wallet.address}`}>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
