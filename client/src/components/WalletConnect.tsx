// client/src/components/WalletConnect.tsx

/**
 * This updated WalletConnect component now uses the Privy login flow,
 * instead of connecting to a mock address. It relies on the Privy
 * Auth Context (usePrivy) to handle authentication. Once logged in,
 * it retrieves the user's linked wallet address for display
 * (and calls onConnect).
 *
 * Usage:
 *   <WalletConnect onConnect={(addr) => console.log("Got address:", addr)} />
 *
 * See https://docs.privy.io/guides/react for details on hooking up
 * the Privy provider in your root application.
 */

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onConnect: (walletAddress: string) => void;
  minimal?: boolean;
}

export function WalletConnect({ onConnect, minimal = false }: Props) {
  // Toast notifications
  const { toast } = useToast();

  // Privy hooks
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Track connection state
  const [isConnected, setIsConnected] = useState(false);

  // Currently displayed wallet address
  const [address, setAddress] = useState("");

  // Whenever the user / privy state changes, check if they're authenticated and have a wallet
  useEffect(() => {
    if (ready && authenticated && user) {
      // Find a linked wallet in the user's accounts
      const linkedWallet = user.linkedAccounts?.find(
        (acct) => acct.type === "wallet" && acct.address
      );
      if (linkedWallet) {
        setIsConnected(true);
        // We cannot assert that all wallets have addresses, but we'll assume so.
        //@ts-ignore
        setAddress(linkedWallet.address);
        //@ts-ignore
        onConnect(linkedWallet.address);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, user]);

  // Handler for connecting the wallet
  const handleConnect = async () => {
    try {
      if (!ready) {
        toast({
          title: "Privy Not Ready",
          description: "Please wait a moment and try again.",
          variant: "default",
        });
        return;
      }

      if (!authenticated) {
        // Not yet authenticated -> show login flow
        await login();
      } else {
        // Already authenticated. If we don't see a wallet, prompt user to link one
        if (!address) {
          toast({
            title: "No Wallet Found",
            description:
              "You are logged in, but no wallet is linked to your Privy account.",
            variant: "default",
          });
        } else {
          toast({
            title: "Already Connected",
            description: `Your wallet is connected: ${address.slice(
              0,
              6
            )}...${address.slice(-4)}`,
            variant: "default",
          });
        }
      }
    } catch (err) {
      console.error("Error in handleConnect =>", err);
      toast({
        title: "Connection Error",
        description: "Could not complete the Privy login flow.",
        variant: "destructive",
      });
    }
  };

  // Handler for disconnecting
  const handleDisconnect = async () => {
    try {
      await logout();
      setIsConnected(false);
      setAddress("");
      toast({
        title: "Wallet Disconnected",
        description: "You have been logged out of Privy.",
        variant: "default",
      });
    } catch (err) {
      console.error("Error in handleDisconnect =>", err);
      toast({
        title: "Disconnect Error",
        description: "Could not disconnect wallet",
        variant: "destructive",
      });
    }
  };

  // If minimal is true, render a single outline button
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
        Connect Wallet
      </Button>
    );
  }

  // Otherwise, show a larger UI with heading and text
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
          Connect Wallet
        </Button>
      )}
    </div>
  );
}
