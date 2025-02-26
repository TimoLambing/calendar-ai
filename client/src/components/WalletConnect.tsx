// client/src/components/WalletConnect.tsx

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Props {
  onConnect: (walletAddress: string) => void;
  minimal?: boolean;
}

export function WalletConnect({ onConnect, minimal = false }: Props) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");

  const handleConnect = () => {
    const mockAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    setAddress(mockAddress);
    setIsConnected(true);
    onConnect(mockAddress);
    toast({
      title: "Test Mode",
      description: `Connected with test wallet: ${mockAddress.slice(
        0,
        6
      )}...${mockAddress.slice(-4)}`,
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress("");
    toast({
      title: "Wallet Disconnected",
      description: "Test wallet has been disconnected",
    });
  };

  if (minimal) {
    return isConnected ? (
      <Button
        variant="outline"
        onClick={handleDisconnect}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    ) : (
      <Button
        variant="outline"
        onClick={handleConnect}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Test Wallet
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
        <Button onClick={handleDisconnect} className="w-full">
          Disconnect Wallet
        </Button>
      ) : (
        <Button onClick={handleConnect} className="w-full">
          Connect Test Wallet
        </Button>
      )}
    </div>
  );
}
