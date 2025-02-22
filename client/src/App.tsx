import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Calendar from "@/pages/calendar";
import Journal from "@/pages/journal";
import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from './lib/privy';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/journal" component={Journal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <PrivyProvider {...privyConfig}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default App;