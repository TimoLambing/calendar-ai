import { CalendarCard } from "@/components/CalendarCard";
import { PortfolioStats } from "@/components/PortfolioStats";
import { WalletConnect } from "@/components/WalletConnect";
import { LoadingCalendarCard } from "@/components/LoadingCalendarCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppState } from "@/store/appState";
import { fetchAllSnapshots } from "@/lib/web3";
import useGenerateSnapshots from "@/hooks/use-generate-snapshots";
import { Loader } from "lucide-react";
import { useMemo } from "react";

export default function Calendar() {
  const { state: { address } } = useAppState();
  const { currentDate, startDate, endDate, isGenerating, goToNextMonth, goToPreviousMonth } = useGenerateSnapshots();

  const {
    data: snapshots = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wallet-snapshots", address, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => fetchAllSnapshots(address || "", startDate, endDate),
    enabled: !!address,
    refetchInterval: (data) => (Array.isArray(data) && data.length ? false : 5000),
  });

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth();
  }, [currentDate]);

  // Create a map of snapshots by date (ISO date string without time)
  const snapshotMap = useMemo(() => {
    const map = new Map<string, any>();
    snapshots.forEach((snap: any) => {
      if (snap.timestamp) {
        const dateKey = new Date(snap.timestamp).toISOString().split("T")[0]; // e.g., "2025-03-01"
        map.set(dateKey, snap);
      }
    });
    return map;
  }, [snapshots]);

  // Calculate days in the current month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentDate);

  // Generate array of dates for the month
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
  });

  // Format month/year for display
  const monthYear = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });


  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WalletConnect />
      </div>
    );
  }

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
            disabled={isGenerating || isLoading ? true : false}
            onClick={goToPreviousMonth}
            className="hover:bg-gray-700"
          >
            {isGenerating || isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <h2 className="text-xl font-semibold text-white">{monthYear}</h2>
          <Button
            variant="outline"
            disabled={isGenerating || isLoading || isCurrentMonth}
            onClick={goToNextMonth}
            className="hover:bg-gray-700"
          >
            {isGenerating || isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <PortfolioStats data={snapshots} />

        {monthDates.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No days to display for {monthYear}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {monthDates.map((date, index) => {
              const dateKey = date.toISOString().split("T")[0];
              const snapshot = snapshotMap.get(dateKey);
              const nextSnap = index < monthDates.length - 1 ? snapshotMap.get(monthDates[index + 1].toISOString().split("T")[0]) : undefined;

              if (isLoading || isGenerating || !snapshot) {
                return <LoadingCalendarCard key={dateKey} />;
              }

              return (
                <CalendarCard
                  key={snapshot.id || dateKey}
                  date={date}
                  value={snapshot.totalValue}
                  previousDayValue={nextSnap?.totalValue}
                  coins={snapshot.balances || []}
                  transactions={snapshot.transactions || []}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}