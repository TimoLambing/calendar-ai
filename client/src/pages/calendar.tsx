import { CalendarCard } from "@/components/CalendarCard";
import { PortfolioStats } from "@/components/PortfolioStats";
import { WalletConnect } from "@/components/WalletConnect";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText } from "lucide-react";
import { generateMockData, type DayData } from "@/lib/mockData";
import { useState } from "react";

export default function Calendar() {
  const [walletConnected, setWalletConnected] = useState(false);
  // Generate mock data up to today, already in reverse chronological order
  const rawData: DayData[] = generateMockData(28);
  const mockData: DayData[] = rawData.filter((day: DayData, index: number): boolean => {
    if (!day.totalValue) return false;
    const prevDay = rawData[index + 1];
    if (!prevDay) return true;

    const percentChange: number = ((day.totalValue - prevDay.totalValue) / prevDay.totalValue) * 100;
    return Math.abs(percentChange) >= 1;
  });

  const handleWalletConnect = (address: string) => {
    setWalletConnected(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Portfolio Calendar</h1>
              <p className="text-gray-400 mt-1">Track your daily portfolio performance</p>
            </div>
            <div className="flex items-center gap-4">
              <WalletConnect onConnect={handleWalletConnect} minimal />
              <Link href="/journal">
                <Button variant="outline" className="flex items-center gap-2 hover:bg-gray-700">
                  <ScrollText className="h-4 w-4" />
                  Trading Journal
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2 hover:bg-gray-700">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {!walletConnected ? (
          <div className="max-w-md mx-auto mt-20">
            <WalletConnect onConnect={handleWalletConnect} />
          </div>
        ) : (
          <>
            <PortfolioStats data={mockData} />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mockData.map((day: DayData, index: number) => (
                <CalendarCard
                  key={day.date.toISOString()}
                  date={day.date}
                  value={day.totalValue}
                  previousDayValue={mockData[index + 1]?.totalValue}
                  coins={day.coins}
                  transactions={day.transactions}
                  notes={day.notes}
                  commentary={day.commentary}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}