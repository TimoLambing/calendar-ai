import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectWallet, type WalletConnection } from "@/lib/web3";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";

interface Props {
  onConnect: (wallet: WalletConnection) => void;
}

export function WalletConnect({ onConnect }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const wallet = await connectWallet();
      onConnect(wallet);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
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
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </CardContent>
    </Card>
  );
}