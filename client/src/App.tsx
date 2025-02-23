import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Calendar from "@/pages/calendar";
import Journal from "@/pages/journal";
import { WalletConnect } from "@/components/WalletConnect";

function Layout({ children }: { children: React.ReactNode }) {
  const handleWalletConnect = (address: string) => {
    console.log("Wallet connected:", address);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Crypto Portfolio</h1>
          <WalletConnect onConnect={handleWalletConnect} minimal />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Calendar} />
        <Route path="/journal" component={Journal} />
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