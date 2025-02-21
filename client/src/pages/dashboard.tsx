import { WalletConnect } from "@/components/WalletConnect";
import { PortfolioValue } from "@/components/PortfolioValue";
import { CoinPerformance } from "@/components/CoinPerformance";
import { NewsFeeds } from "@/components/NewsFeeds";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState } from "react";
import type { WalletConnection } from "@/lib/web3";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [wallet, setWallet] = useState<WalletConnection>();
  
  const { data: walletData } = useQuery({
    queryKey: [`/api/wallets/${wallet?.address}`],
    enabled: !!wallet
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {!wallet ? (
          <WalletConnect onConnect={setWallet} />
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">
                Portfolio Dashboard
              </h1>
              <Link href="/calendar">
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </Button>
              </Link>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              <PortfolioValue walletId={walletData?.id} />
              <CoinPerformance 
                balances={walletData?.latestSnapshot?.balances || []} 
              />
            </div>

            <NewsFeeds 
              symbol="BTC" 
              date={new Date()} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
