import { CalendarCard } from "@/components/CalendarCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { generateMockData } from "@/lib/mockData";
import { WalletConnect } from "@/components/WalletConnect";
import { useState } from "react";
import type { WalletConnection } from "@/lib/web3";
import { useQuery } from "@tanstack/react-query";

export default function Calendar() {
  const [wallet, setWallet] = useState<WalletConnection>();

  const { data: walletData } = useQuery({
    queryKey: [`/api/wallets/${wallet?.address}`],
    enabled: !!wallet
  });

  // Generate 30 days of mock data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 15); // Start 15 days ago
  const mockData = generateMockData(startDate, 30);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {!wallet ? (
          <WalletConnect onConnect={setWallet} />
        ) : (
          <>
            <header className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Portfolio Calendar</h1>
                  <p className="text-muted-foreground mt-1">Track your daily portfolio performance</p>
                </div>
                <Link href="/">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mockData.map((day, index) => (
                <CalendarCard
                  key={index}
                  date={day.date}
                  value={day.totalValue}
                  coins={day.coins}
                  transactions={day.transactions}
                  notes={day.notes}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}