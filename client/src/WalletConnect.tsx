import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Props {
  onConnect: (walletAddress: any) => void;
  minimal?: boolean;
}

export function WalletConnect({ onConnect, minimal = false }: Props) {
  const { toast } = useToast();

  // For testing purposes, use a mock wallet address
  const handleTestConnect = () => {
    const mockAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    onConnect({ address: mockAddress });
    toast({
      title: "Test Mode",
      description: `Connected with test wallet: ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`
    });
  };

  if (minimal) {
    return (
      <Button 
        variant="outline"
        onClick={handleTestConnect}
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
      <Button 
        onClick={handleTestConnect}
        className="w-full"
      >
        Connect Test Wallet
      </Button>
    </div>
  );
}
