import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, TrendingUp, TrendingDown } from "lucide-react";
import { TradingDiaryEntry } from "@shared/schema";
import { cn } from "@/lib/utils";

export function JournalEntries() {
  const { data: entries } = useQuery<TradingDiaryEntry[]>({
    queryKey: ['/api/diary-entries']
  });

  if (!entries?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No journal entries yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ScrollText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <div className="font-medium">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                  {entry.valueChange && (
                    <div className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      parseFloat(entry.valueChange.toString()) > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {parseFloat(entry.valueChange.toString()) > 0 ? 
                        <TrendingUp className="h-4 w-4" /> : 
                        <TrendingDown className="h-4 w-4" />
                      }
                      {parseFloat(entry.valueChange.toString()) > 0 ? "+" : ""}
                      {parseFloat(entry.valueChange.toString()).toFixed(2)}%
                      <span className="text-muted-foreground ml-2">
                        ${parseFloat(entry.portfolioValue?.toString() || "0").toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm whitespace-pre-wrap">{entry.comment}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}