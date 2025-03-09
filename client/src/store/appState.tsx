// client/src/store/appState.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of a wallet's metadata
interface WalletMetadata {
  address: string;
  chainId: string; // e.g., "eip155:1"
  chainType: "ethereum" | "solana" | "base"; // Simplified chain type
  connectorType: string; // e.g., "injected"
  walletClientType: string; // e.g., "metamask"
}

// Define the shape of the state
interface AppState {
  isConnected: boolean;
  address: string | null; // Added to maintain compatibility
  currentWallet: WalletMetadata | null; // Current active wallet
  connectedWallets: Record<string, string[]>; // address -> array of chainIds
}

// Define the context type
interface AppStateContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

// Create Context
const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

// Create Provider component
export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    isConnected: false,
    address: null, // Initialize as null
    currentWallet: null,
    connectedWallets: {},
  });

  return (
    <AppStateContext.Provider value={{ state, setState }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom hook to use AppStateContext
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};
