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
  const { login, ready, authenticated, user, logout } = usePrivy();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already authenticated and has a wallet, call onConnect
    if (authenticated && user?.wallet?.address) {
      try {
        onConnect(user.wallet.address);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
        });
      } catch (error) {
        console.error('Error in wallet connection:', error);
        // If there's an error, log out the user to reset the state
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

  if (authenticated && !user?.wallet?.address) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Please connect a wallet to continue
          </div>
          <Button 
            onClick={() => logout()}
            variant="outline" 
            className="w-full mt-4"
          >
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

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