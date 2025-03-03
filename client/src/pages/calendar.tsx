// client/src/pages/calendar.tsx

import { CalendarCard } from "@/components/CalendarCard";
import { PortfolioStats } from "@/components/PortfolioStats";
import { WalletConnect } from "@/components/WalletConnect";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppState } from "@/store/appState";
import { getWalletHistory } from "@/lib/web3"; // Real fetch from your backend

export default function Calendar() {
  const {
    state: { address },
  } = useAppState();

  const chain = "ethereum"; // or detect the chain, but default to "ethereum"
  const {
    data: snapshots,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wallet-history", address, chain],
    queryFn: () => getWalletHistory(address || "", chain),
    enabled: !!address,
  });

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WalletConnect />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center text-gray-300">
        Loading wallet history...
      </div>
    );
  }

  if (error || !snapshots) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center text-red-500">
        Failed to load wallet history
      </div>
    );
  }

  // 'snapshots' is an array of { id, timestamp, totalValue, balances[], transactions[] }
  // Some might lack a timestamp if the API didn't return it. We'll do a safety filter:
  const validSnapshots = snapshots.filter((snap: any) => snap.timestamp);

  // Sort descending by date
  const sorted = [...validSnapshots].sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

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
            </div>
            <div className="flex items-center gap-4">
              <WalletConnect minimal />
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

        {/* If you have a PortfolioStats component that needs day-based data, pass it if desired */}
        <PortfolioStats data={[]} />

        {sorted.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No snapshots found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map((snap: any, index: number) => {
              // Convert snap.timestamp safely
              const dayDate = new Date(snap.timestamp);
              const nextSnap = sorted[index + 1];
              return (
                <CalendarCard
                  key={snap.id}
                  date={dayDate}
                  value={snap.totalValue}
                  previousDayValue={nextSnap?.totalValue}
                  coins={snap.balances || []}
                  transactions={snap.transactions || []}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* import { CalendarCard } from "@/components/CalendarCard";
import { PortfolioStats } from "@/components/PortfolioStats";
import { WalletConnect } from "@/components/WalletConnect";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { DayData } from "@/lib/mockData";
import { getWalletHistory } from "@/lib/web3";
import { useAppState } from "@/store/appState";

export default function Calendar() {
  const { state: { address } } = useAppState();
  // Query for wallet history when connected
  const { data: walletData, isLoading } = useQuery<DayData[]>({
    queryKey: ["wallet-history", address],
    queryFn: async () => {
      if (!address) return [];
      // IMPORTANT: getWalletHistory should fetch real data from your backend
      // For example, you could do:
      // const res = await fetch(`/api/wallets/${walletAddress}/snapshots`);
      // return await res.json();
      // or rely on getWalletHistory if it’s already replaced with real fetch logic
      return getWalletHistory(address);
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
  });



  // If there's no wallet connected, no data is displayed at all.
  // If there's no data from the backend, show "No transaction history..."
  const displayData = walletData || [];


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
              {!address && (
                <p className="text-yellow-400 mt-2 text-sm">
                  Connect a wallet to see your actual portfolio data.
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <WalletConnect minimal />
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
 */
