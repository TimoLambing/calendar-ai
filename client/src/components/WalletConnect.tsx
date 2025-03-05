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
import { useAppState } from "@/store/appState";

interface Props {
  minimal?: boolean;
}

export function WalletConnect({ minimal = false }: Props) {
  const {
    state: { address },
    setState,
  } = useAppState();
  const { toast } = useToast();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isConnected, setIsConnected] = useState(false);
  // const dummyWalletAddress = "0x1e58fdeff054b68cdd33db44b9f724e7bd87dfe7";

  useEffect(() => {
    if (ready && authenticated && user) {
      const linkedWallet = user.linkedAccounts?.find(
        (acct) => acct.type === "wallet" && "address" in acct
      );
      if (linkedWallet && "address" in linkedWallet) {
        const walletChain = linkedWallet.chainId?.includes("solana")
          ? "solana"
          : linkedWallet.chainId?.includes("8453")
            ? "base"
            : "ethereum"; // Base chain ID is 8453
        if (!isConnected) {
          setIsConnected(true);
          setState({
            address,
            chain: walletChain,

          });
        }
      }
    }
  }, [
    ready,
    authenticated,
    user,
    isConnected,
    setState,
  ]);

  const handleConnect = async () => {
    try {
      if (!ready)
        return toast({
          title: "Privy Not Ready",
          description: "Please wait a moment and try again.",
          variant: "default",
        });
      if (!authenticated) await login();
      else if (!address)
        toast({
          title: "No Wallet Found",
          description: "Logged in but no wallet linked.",
          variant: "default",
        });
      else
        toast({
          title: "Already Connected",
          description: `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`,
          variant: "default",
        });
    } catch (err) {
      console.error("Error in handleConnect =>", err);
      toast({
        title: "Connection Error",
        description: "Could not complete the Privy login flow.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setIsConnected(false);
      setState({ address: "" });
      toast({
        title: "Wallet Disconnected",
        description: "You have been logged out.",
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

  if (minimal) {
    return isConnected ? (
      <Button
        variant="outline"
        onClick={handleDisconnect}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {address?.slice(0, 6)}...{address?.slice(-4)}
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
