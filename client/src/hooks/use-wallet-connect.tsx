// client/src/hooks/use-wallet-connect.tsx

import { apiRequest } from "@/lib/queryClient";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect } from "react";
import { useToast } from "./use-toast";
import { useAppState } from "@/store/appState";

export default function useWalletConnect(dummyWalletAddress?: string) {
  const {
    state: { isConnected, currentWallet, connectedWallets },
    setState,
  } = useAppState();
  const { toast } = useToast();
  const { ready, authenticated, user, login, logout } = usePrivy();

  const createOrUpdateWallet = useCallback(
    async (wallet: { address: string; chainId: string; chainType: string }) => {
      try {
        const response = await apiRequest("POST", "/api/wallets", {
          address: wallet.address,
          chainId: wallet.chainId,
          chain: wallet.chainType,
        });
        console.log("createOrUpdateWallet -> response", response);
        const data = await response.json();
        console.log("createOrUpdateWallet -> data", data);
        return data.wallet; // Return the wallet object from the backend
      } catch (error) {
        console.error("Error creating/updating wallet:", error);
        toast({
          title: "Wallet Error",
          description: "Failed to register wallet with server.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  useEffect(() => {
    console.log("useWalletConnect -> user", user, authenticated, ready);
  }, [user, authenticated, ready]); // Only logs when these change

  useEffect(() => {
    if (ready && authenticated && user) {
      const linkedWallet = user.linkedAccounts?.find(
        (acct) => acct.type === "wallet" && "address" in acct
      );
      if (linkedWallet && "address" in linkedWallet) {
        const walletChainType = linkedWallet.chainId?.includes("solana")
          ? "solana"
          : linkedWallet.chainId?.includes("8453")
          ? "base"
          : "ethereum";
        const walletData = {
          address: dummyWalletAddress || linkedWallet.address,
          chainId: linkedWallet.chainId || "eip155:1",
          chainType: walletChainType as "ethereum" | "solana" | "base", // Type assertion to match WalletMetadata
          connectorType: linkedWallet.connectorType || "unknown",
          walletClientType: linkedWallet.walletClientType || "unknown",
        };

        setState((prev) => {
          const address = walletData.address;
          const currentChainId = walletData.chainId;
          const needsUpdate =
            !prev.isConnected ||
            prev.currentWallet?.address !== address ||
            prev.currentWallet?.chainId !== currentChainId;

          if (needsUpdate) {
            // Async update with backend response
            createOrUpdateWallet(walletData).then((walletFromServer) => {
              setState({
                isConnected: true,
                address: walletFromServer.address, // Set address explicitly
                currentWallet: {
                  ...walletData,
                  chainId: walletFromServer.currentChain, // Use server's currentChain
                },
                connectedWallets: {
                  ...prev.connectedWallets,
                  [address]: [
                    ...(prev.connectedWallets[address] || []),
                    walletFromServer.currentChain,
                  ].filter((v, i, a) => a.indexOf(v) === i), // Dedupe chains
                },
              });
            });
            return prev; // Return previous state while async update happens
          }
          return prev;
        });
      }
    }
  }, [
    ready,
    authenticated,
    user,
    setState,
    createOrUpdateWallet,
    dummyWalletAddress,
  ]);

  const connect = useCallback(async () => {
    try {
      if (!ready)
        return toast({
          title: "Privy Not Ready",
          description: "Please wait a moment and try again.",
          variant: "default",
        });
      if (!authenticated) await login();
      else if (!currentWallet?.address)
        toast({
          title: "No Wallet Found",
          description: "Logged in but no wallet linked.",
          variant: "default",
        });
      else
        toast({
          title: "Already Connected",
          description: `Wallet: ${currentWallet.address.slice(
            0,
            6
          )}...${currentWallet.address.slice(-4)}`,
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
  }, [ready, authenticated, currentWallet, login, toast]);

  const disconnect = useCallback(async () => {
    try {
      await logout();
      setState({
        isConnected: false,
        address: null, // Reset address
        currentWallet: null,
        connectedWallets: {},
      });
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
  }, [logout, setState, toast]);

  return {
    isConnected,
    address: currentWallet?.address || null,
    disconnect,
    connect,
  };
}
