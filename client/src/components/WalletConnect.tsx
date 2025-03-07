// client/src/components/WalletConnect.tsx

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import useWalletConnect from "@/hooks/use-wallet-connect";

export function WalletConnect({ minimal = false }) {
  // const dummyWalletAddress = "0x1e58fdeff054b68cdd33db44b9f724e7bd87dfe7";
  const { isConnected, address, connect, disconnect } = useWalletConnect();

  if (minimal) {
    return isConnected ? (
      <Button
        variant="outline"
        onClick={disconnect}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    ) : (
      <Button
        variant="outline"
        onClick={connect}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
      <p className="text-muted-foreground mb-6">
        Connect your wallet to start tracking your portfolio
      </p>
      {isConnected ? (
        <Button onClick={disconnect} className="w-full">
          Disconnect Wallet
        </Button>
      ) : (
        <Button onClick={connect} className="w-full">
          Connect Wallet
        </Button>
      )}
    </div>
  );
}
