import { CalendarCard } from "@/components/CalendarCard";
import { NewsFeeds } from "@/components/NewsFeeds";
import { CoinPerformance } from "@/components/CoinPerformance";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const { data: snapshots } = useQuery({
    queryKey: ['/api/snapshots'],
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions'],
  });

  if (!snapshots) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Calendar View</h1>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {snapshots.map((snapshot: any) => (
            <CalendarCard
              key={snapshot.id}
              date={new Date(snapshot.timestamp)}
              value={parseFloat(snapshot.totalValue)}
              transactions={transactions?.filter((tx: any) => 
                new Date(tx.timestamp).toDateString() === new Date(snapshot.timestamp).toDateString()
              ) || []}
              onSelect={setSelectedDate}
            />
          ))}
        </div>

        {selectedDate && (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <CoinPerformance 
              balances={snapshots.find((s: any) => 
                new Date(s.timestamp).toDateString() === selectedDate.toDateString()
              )?.balances || []}
            />
            <NewsFeeds 
              symbol="BTC"
              date={selectedDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
