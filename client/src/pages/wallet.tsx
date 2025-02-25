import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserMinus, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { JournalEntries } from "@/components/JournalEntries";
import { CalendarCard } from "@/components/CalendarCard";
import { getWalletHistory } from "@/lib/web3";
import type { DayData } from "@/lib/mockData";

interface WalletDetails {
  address: string;
  isFollowed: boolean;
  performanceStats: {
    "24h": number;
    "7d": number;
    "30d": number;
    totalValue: number;
  };
}

export default function WalletDetail({ params }: { params: { address: string } }) {
  const { toast } = useToast();
  const { address } = params;
  const [currentView, setCurrentView] = useState<'stats' | 'calendar'>('stats');

  // Fetch wallet details
  const { data: walletDetails, isLoading: isLoadingDetails } = useQuery<WalletDetails>({
    queryKey: ['wallet-details', address],
    queryFn: async () => {
      const response = await fetch(`/api/wallets/${address}`);
      if (!response.ok) throw new Error('Failed to fetch wallet details');
      return response.json();
    }
  });

  // Fetch wallet history for calendar
  const { data: walletHistory, isLoading: isLoadingHistory } = useQuery<DayData[]>({
    queryKey: ['wallet-history', address],
    queryFn: () => getWalletHistory(address),
    enabled: currentView === 'calendar'
  });

  const handleFollowToggle = async () => {
    if (!walletDetails) return;

    try {
      if (walletDetails.isFollowed) {
        await apiRequest('DELETE', `/api/followed-wallets/${address}`);
      } else {
        await apiRequest('POST', '/api/followed-wallets', { address });
      }

      queryClient.invalidateQueries({ queryKey: ['wallet-details', address] });
      queryClient.invalidateQueries({ queryKey: ['followed-wallets'] });

      toast({
        title: walletDetails.isFollowed ? "Unfollowed" : "Following",
        description: walletDetails.isFollowed
          ? "Wallet removed from your following list"
          : "Wallet added to your following list"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update following status",
        variant: "destructive"
      });
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400 py-12">
            Loading wallet details...
          </div>
        </div>
      </div>
    );
  }

  if (!walletDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400 py-12">
            Wallet not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Wallet Details
              </h1>
              <p className="text-gray-400 mt-1">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentView(currentView === 'stats' ? 'calendar' : 'stats')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {currentView === 'stats' ? 'Show Calendar' : 'Show Stats'}
              </Button>
              <Button
                onClick={handleFollowToggle}
                variant="outline"
                className="flex items-center gap-2"
              >
                {walletDetails.isFollowed ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {currentView === 'stats' ? (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">24h Change</div>
                    <div className={`text-xl font-bold ${walletDetails.performanceStats["24h"] >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {walletDetails.performanceStats["24h"] >= 0 ? '+' : ''}{walletDetails.performanceStats["24h"].toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">7d Change</div>
                    <div className={`text-xl font-bold ${walletDetails.performanceStats["7d"] >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {walletDetails.performanceStats["7d"] >= 0 ? '+' : ''}{walletDetails.performanceStats["7d"].toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">30d Change</div>
                    <div className={`text-xl font-bold ${walletDetails.performanceStats["30d"] >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {walletDetails.performanceStats["30d"] >= 0 ? '+' : ''}{walletDetails.performanceStats["30d"].toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="journal">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="journal">Trading Journal</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio Stats</TabsTrigger>
              </TabsList>

              <TabsContent value="journal">
                <JournalEntries walletAddress={address} />
              </TabsContent>

              <TabsContent value="portfolio">
                <PortfolioStats walletAddress={address} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-8">
            {isLoadingHistory ? (
              <div className="text-center text-gray-400 py-12">
                Loading calendar data...
              </div>
            ) : walletHistory && walletHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {walletHistory.map((day: DayData, index: number) => (
                  <CalendarCard
                    key={day.date.toISOString()}
                    date={day.date}
                    value={day.totalValue}
                    previousDayValue={walletHistory[index + 1]?.totalValue}
                    coins={day.coins}
                    transactions={day.transactions}
                    notes={day.notes}
                    commentary={day.commentary}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                No calendar data available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}