// client/src/hooks/use-wallet-connect.tsx

import { apiRequest } from "@/lib/queryClient";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { useAppState } from "@/store/appState";

export default function useWalletConnect(dummyWalletAddress?: string) {
  const {
    state: { address },
    setState,
  } = useAppState();
  const { toast } = useToast();
  const { ready, authenticated, user, login, logout } = usePrivy();
  console.log("useWalletConnect -> user", user, authenticated, ready);
  const [isConnected, setIsConnected] = useState(false);

  const createOrUpdateWallet = useCallback(
    async (address: string, chain: string) => {
      try {
        await apiRequest("POST", "/api/wallets", { address, chain });
      } catch (error) {
        console.error("Error creating/updating wallet:", error);
        toast({
          title: "Wallet Error",
          description: "Failed to register wallet with server.",
          variant: "destructive",
        });
      }
    },
    []
  );

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
            address: dummyWalletAddress || linkedWallet.address,
            chain: walletChain,
          });
          createOrUpdateWallet(
            dummyWalletAddress || linkedWallet.address,
            walletChain
          );
        }
      }
    }
  }, [ready, authenticated, user, isConnected, setState]);

  const connect = useCallback(async () => {
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
  }, [ready, authenticated, address]);

  const disconnect = useCallback(async () => {
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
  }, []);

  return { isConnected, address, disconnect, connect };
}
