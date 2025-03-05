// client/src/pages/calendar.tsx

import { CalendarCard } from "@/components/CalendarCard";
import { PortfolioStats } from "@/components/PortfolioStats";
import { WalletConnect } from "@/components/WalletConnect";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppState } from "@/store/appState";
import { fetchAllSnapshots } from "@/lib/web3";
import { useState } from "react";
import useGenerateSnapshots from "@/hooks/use-generate-snapshots";

export default function Calendar() {
  const { state: { address } } = useAppState();
  const { generate, isGenerating } = useGenerateSnapshots();

  // State for current month/year
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate start and end dates for the current month
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const {
    data: snapshots,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wallet-snapshots", address, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => fetchAllSnapshots(address || "", startDate, endDate),
    enabled: !!address,
    // refetchInterval: (data) =>
    //   Array.isArray(data) && data.length ? false : 100000,
  });

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    generate({ startDate, endDate });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    generate({ startDate, endDate });
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WalletConnect />
      </div>
    );
  }

  if (isGenerating || isLoading || (!snapshots?.length && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center text-gray-300">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-8 w-8 text-gray-400"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h-8z"
            />
          </svg>
          <span>Loading wallet snapshots...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center text-red-500">
        Failed to load snapshots: {error.message}
      </div>
    );
  }

  const validSnapshots = snapshots?.filter((s: any) => s.timestamp) || [];
  const sorted = [...validSnapshots].sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Format month/year for display
  const monthYear = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

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

        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousMonth}
            className="hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-white">{monthYear}</h2>
          <Button
            variant="outline"
            onClick={goToNextMonth}
            className="hover:bg-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <PortfolioStats data={[]} />

        {sorted.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No snapshots found for {monthYear}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map((snap: any, index: number) => {
              const currentDate = new Date(snap.timestamp);
              const nextSnap = sorted[index + 1];
              return (
                <CalendarCard
                  key={snap.id}
                  date={currentDate}
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