// client/src/App.tsx

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Calendar from "@/pages/calendar";
import Journal from "@/pages/journal";
import Leaderboard from "@/pages/leaderboard";
import Following from "@/pages/following";
import WalletDetail from "@/pages/wallet";
import { WalletConnect } from "@/components/WalletConnect";
import { Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Dashboard from "./pages/dashboard";

function Layout({ children }: { children: React.ReactNode; }) {
  const handleWalletConnect = (address: string) => {
    console.log("Wallet connected:", address);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">Crypto Portfolio</h1>
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost">Calendar</Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
              </Link>
              <Link href="/following">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Following
                </Button>
              </Link>
            </nav>
          </div>
          <WalletConnect onConnect={handleWalletConnect} minimal />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/journal" component={Journal} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/following" component={Following} />
        <Route path="/wallet/:address" component={WalletDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
