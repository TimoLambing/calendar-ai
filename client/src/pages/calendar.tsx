// src/pages/Calendar.tsx

import { CalendarCard } from "@/components/CalendarCard";
import { PortfolioStats } from "@/components/PortfolioStats";
import { WalletConnect } from "@/components/WalletConnect";
import { LoadingCalendarCard } from "@/components/LoadingCalendarCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Loader,
} from "lucide-react";
import { useAppState } from "@/store/appState";
import useGenerateSnapshots from "@/hooks/use-generate-snapshots";
import { useMemo } from "react";

/**
 * The Calendar page. We always call the same Hooks in the same order:
 * 1) read global state
 * 2) call useGenerateSnapshots
 * 3) define any useMemo / etc
 * 4) then decide what to render
 */
export default function Calendar() {
  // --- (1) always read from global state at the top
  const {
    state: { address },
  } = useAppState();

  // --- (2) always call the snapshot generation hook
  const {
    currentDate,
    startDate,
    endDate,
    isGenerating,
    goToNextMonth,
    goToPreviousMonth,
    snapshots,
  } = useGenerateSnapshots();

  // --- (3) define any useMemo or other hooks, always unconditionally
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth()
    );
  }, [currentDate]);

  // Put all snapshots in a map keyed by date string
  const snapshotMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const snap of snapshots) {
      const dateKey = new Date(snap.timestamp).toISOString().split("T")[0];
      map.set(dateKey, snap);
    }
    return map;
  }, [snapshots]);

  // Helper: number of days in month
  function getDaysInMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }
  const daysInMonth = getDaysInMonth(currentDate);

  // Build an array of Date objects (descending from last day -> first day)
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      daysInMonth - i
    );
  });

  // Format: "March 2025"
  const monthYear = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  console.log(
    "[Calendar] Render => address:",
    address,
    "| currentDate:",
    currentDate,
    "| startDate:",
    startDate,
    "| endDate:",
    endDate,
    "| isGenerating:",
    isGenerating,
    "| snapshots.length:",
    snapshots.length
  );

  // --- (4) now decide what to return.
  // We do NOT skip the Hooks. We just choose a different UI if !address
  if (!address) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <WalletConnect />
      </div>
    );
  }

  // If we have an address, we show the normal calendar UI
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
            disabled={isGenerating}
            onClick={() => {
              console.log("[Calendar] goToPreviousMonth");
              goToPreviousMonth();
            }}
            className="hover:bg-gray-700"
          >
            {isGenerating ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <h2 className="text-xl font-semibold text-white">{monthYear}</h2>
          <Button
            variant="outline"
            disabled={isGenerating || isCurrentMonth}
            onClick={() => {
              console.log("[Calendar] goToNextMonth");
              goToNextMonth();
            }}
            className="hover:bg-gray-700"
          >
            {isGenerating ? (
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
            {monthDates.map((date, idx) => {
              const dateKey = date.toISOString().split("T")[0];
              const snapshot = snapshotMap.get(dateKey);

              // find next day (older) if we want the "previousDayValue"
              const nextDay =
                idx < monthDates.length - 1 ? monthDates[idx + 1] : null;
              const nextKey = nextDay
                ? nextDay.toISOString().split("T")[0]
                : null;
              const nextSnap = nextKey ? snapshotMap.get(nextKey) : undefined;

              if (!snapshot) {
                // show loading card
                return <LoadingCalendarCard key={dateKey} date={date} />;
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
