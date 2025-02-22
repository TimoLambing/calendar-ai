import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Props {
  onConnect: (walletAddress: string) => void;
  minimal?: boolean;
}

export function WalletConnect({ onConnect, minimal = false }: Props) {
  const { login, ready, authenticated, user, logout } = usePrivy();
  const { toast } = useToast();

  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      try {
        onConnect(user.wallet.address);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
        });
      } catch (error) {
        console.error('Error in wallet connection:', error);
        logout();
        toast({
          title: "Connection Error",
          description: "There was an error connecting your wallet. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [authenticated, user?.wallet?.address, onConnect, toast, logout]);

  const handleConnect = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (minimal) {
    if (authenticated && user?.wallet?.address) {
      return (
        <Button 
          variant="outline" 
          onClick={logout}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
        </Button>
      );
    }

    return (
      <Button 
        variant="outline"
        onClick={handleConnect}
        disabled={!ready}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {!ready ? "Loading..." : "Connect Wallet"}
      </Button>
    );
  }

  // Full card view for initial connection
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
      <p className="text-muted-foreground mb-6">
        Connect your wallet to start tracking your portfolio
      </p>
      <Button 
        onClick={handleConnect} 
        disabled={!ready}
        className="w-full"
      >
        {!ready ? "Loading..." : "Connect Wallet"}
      </Button>
    </div>
  );
}