import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Props {
  onConnect: (walletAddress: string) => void;
}

export function WalletConnect({ onConnect }: Props) {
  const { login, ready, authenticated, user } = usePrivy();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already authenticated, call onConnect with their wallet address
    if (authenticated && user?.wallet?.address) {
      onConnect(user.wallet.address);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
      });
    }
  }, [authenticated, user?.wallet?.address, onConnect]);

  const handleConnect = async () => {
    try {
      await login();
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Your Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleConnect} 
          disabled={!ready}
          className="w-full"
        >
          {!ready ? "Loading..." : "Connect Wallet"}
        </Button>
      </CardContent>
    </Card>
  );
}