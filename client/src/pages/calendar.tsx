import { CalendarCard } from "@/components/CalendarCard";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { generateMockData } from "@/lib/mockData";

export default function Calendar() {
  // Generate 30 days of mock data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 15); // Start 15 days ago
  const mockData = generateMockData(startDate, 30);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Portfolio Calendar</h1>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {mockData.map((day, index) => (
            <CalendarCard
              key={index}
              date={day.date}
              value={day.totalValue}
              coins={day.coins}
              transactions={day.transactions}
              notes={day.notes}
            />
          ))}
        </div>
      </div>
    </div>
  );
}