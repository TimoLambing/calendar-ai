// client/src/store/appState.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of the state
interface AppState {
  isConnected?: boolean;
  address?: string | null;
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
    address: null,
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
