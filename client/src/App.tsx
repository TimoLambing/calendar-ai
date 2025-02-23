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
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Failed to fetch')) {
        console.error('Privy connection error:', event.reason);
        toast({
          title: "Connection Error",
          description: "Failed to connect to authentication service. Please try again later.",
          variant: "destructive"
        });
      }
    });
  }, [toast]);

  return <>{children}</>;
}

function App() {
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