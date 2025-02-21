import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { TradingDiaryEntry } from "@shared/schema";

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
              <div>
                <div className="font-medium">
                  {new Date(entry.createdAt!).toLocaleDateString()}
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