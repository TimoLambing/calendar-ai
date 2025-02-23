import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, UserMinus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FollowedWallet {
  address: string;
  performancePercent: number;
  totalValue: number;
}

export default function Following() {
  const { toast } = useToast();
  
  // Fetch followed wallets
  const { data: followedWallets, isLoading } = useQuery<FollowedWallet[]>({
    queryKey: ['followed-wallets'],
    queryFn: async () => {
      const response = await fetch('/api/followed-wallets');
      if (!response.ok) throw new Error('Failed to fetch followed wallets');
      return response.json();
    }
  });

  const handleUnfollow = async (address: string) => {
    try {
      await apiRequest('DELETE', `/api/followed-wallets/${address}`);
      queryClient.invalidateQueries({ queryKey: ['followed-wallets'] });
      toast({
        title: "Unfollowed",
        description: "Wallet removed from your following list"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unfollow wallet",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Following</h1>
          <p className="text-gray-400 mt-1">Wallets you're tracking</p>
        </header>

        {isLoading ? (
          <div className="text-center text-gray-400 py-12">
            Loading followed wallets...
          </div>
        ) : !followedWallets || followedWallets.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            You're not following any wallets yet.
            <div className="mt-4">
              <Link href="/leaderboard">
                <Button variant="outline">Browse Leaderboard</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {followedWallets.map((wallet) => (
              <Card key={wallet.address} className="hover:bg-gray-100/5 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </div>
                      <div className="text-sm text-gray-400">
                        ${wallet.totalValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-lg font-bold ${wallet.performancePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {wallet.performancePercent >= 0 ? '+' : ''}{wallet.performancePercent.toFixed(2)}%
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/wallet/${wallet.address}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleUnfollow(wallet.address)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
