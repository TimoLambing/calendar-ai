import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Calendar from "@/pages/calendar";
import Journal from "@/pages/journal";
import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from './lib/privy';
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/journal" component={Journal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PrivyErrorBoundary({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    // Log Privy configuration for debugging
    console.log('Current Privy configuration:', {
      appId: import.meta.env.VITE_PRIVY_APP_ID,
      domain: window.location.hostname,
      host: window.location.host
    });

    // Handle unhandled promise rejections (including fetch errors)
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Privy error details:', event.reason);

      if (event.reason?.message?.includes('Failed to fetch')) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to authentication service. Retrying connection...",
          variant: "destructive"
        });
      } else if (event.reason?.message?.includes('invalid Privy app ID')) {
        toast({
          title: "Configuration Error",
          description: "Invalid Privy configuration. Please check your App ID.",
          variant: "destructive"
        });
      }
    });
  }, [toast]);

  return <>{children}</>;
}

function App() {
  if (!import.meta.env.VITE_PRIVY_APP_ID) {
    console.error('VITE_PRIVY_APP_ID environment variable is not set');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
          <p className="mt-2 text-gray-600">
            Wallet connection is not properly configured.
            Please check the environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider {...privyConfig}>
      <QueryClientProvider client={queryClient}>
        <PrivyErrorBoundary>
          <Router />
          <Toaster />
        </PrivyErrorBoundary>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default App;