// client/src/pages/calendar.tsx

import { CalendarCard } from "@/components/CalendarCard";
import { PortfolioStats } from "@/components/PortfolioStats";
import { WalletConnect } from "@/components/WalletConnect";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText } from "lucide-react";
import { generateMockData, type DayData } from "@/lib/mockData";
import { useState } from "react";
import { getWalletHistory } from "@/lib/web3";
import { useQuery } from "@tanstack/react-query";

export default function Calendar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  // Query for wallet history when connected
  const { data: walletData, isLoading } = useQuery<DayData[]>({
    queryKey: ["wallet-history", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return getWalletHistory(walletAddress);
    },
    enabled: !!walletAddress,
    staleTime: 30000, // Refresh every 30 seconds
  });

  // Fallback to mock data when wallet is not connected
  const mockData: DayData[] = generateMockData(28);

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    setWalletConnected(true);
  };

  // Use wallet data if available, otherwise use mock data
  const displayData = walletConnected ? walletData || [] : mockData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Portfolio Calendar
              </h1>
              <p className="text-gray-400 mt-1">
                Track your daily portfolio performance
              </p>
              {!walletConnected && (
                <p className="text-yellow-400 mt-2 text-sm">
                  Currently showing mock data. Connect wallet to see your actual
                  portfolio.
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <WalletConnect onConnect={handleWalletConnect} minimal />
              <Link href="/journal">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 hover:bg-gray-700"
                >
                  <ScrollText className="h-4 w-4" />
                  Trading Journal
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="space-y-8">
          <PortfolioStats data={displayData} />

          {isLoading ? (
            <div className="text-center text-gray-400 mt-8">
              Loading wallet history...
            </div>
          ) : displayData.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              No transaction history found for this wallet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayData.map((day: DayData, index: number) => (
                <CalendarCard
                  key={day.date.toISOString()}
                  date={day.date}
                  value={day.totalValue}
                  previousDayValue={displayData[index + 1]?.totalValue}
                  coins={day.coins}
                  transactions={day.transactions}
                  notes={day.notes}
                  commentary={day.commentary}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
