// client/src/pages/dashboard.tsx

import { WalletConnect } from "@/components/WalletConnect";
import { PortfolioValue } from "@/components/PortfolioValue";
import { CoinPerformance } from "@/components/CoinPerformance";
import { NewsFeeds } from "@/components/NewsFeeds";
import { JournalEntries } from "@/components/JournalEntries";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, ScrollText } from "lucide-react";
import { useState } from "react";
import type { WalletConnection } from "@/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { getMockJournalEntries } from "@/lib/web3";

export default function Dashboard() {
  const [wallet, setWallet] = useState<WalletConnection>();

  const { data: walletData } = useQuery({
    queryKey: [`/api/wallets/${wallet?.address}`],
    enabled: !!wallet,
  });

  // Fetch journal entries
  const { data: journalEntries } = useQuery({
    queryKey: ["journal-entries", wallet?.address],
    queryFn: () => getMockJournalEntries(wallet?.address || ""),
    enabled: !!wallet?.address,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {!wallet ? (
          <WalletConnect onConnect={setWallet} />
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
              <div className="flex gap-4">
                <Link href="/journal">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    Trading Journal
                  </Button>
                </Link>
                <Link href="/calendar">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendar View
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <PortfolioValue walletId={walletData?.id} />
              <CoinPerformance
                balances={walletData?.latestSnapshot?.balances || []}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Recent Trading Journal</h2>
              <JournalEntries />
            </div>

            <NewsFeeds symbol="BTC" date={new Date()} />
          </div>
        )}
      </div>
    </div>
  );
}
