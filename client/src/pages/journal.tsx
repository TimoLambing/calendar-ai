import { JournalEntries } from "@/components/JournalEntries";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Journal() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Trading Journal</h1>
              <p className="text-muted-foreground mt-1">Your trading notes and insights</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Calendar
              </Button>
            </Link>
          </div>
        </header>

        <JournalEntries />
      </div>
    </div>
  );
}
