import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Transaction } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface Props {
  date: Date;
  value: number;
  transactions: Transaction[];
  onSelect: (date: Date) => void;
}

export function CalendarCard({ date, value, transactions, onSelect }: Props) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card 
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelect(date)}
        >
          <CardContent className="p-4">
            <div className="text-sm font-medium">{date.toLocaleDateString()}</div>
            <div className="text-2xl font-bold">${value.toLocaleString()}</div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Transactions</h4>
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between text-sm">
              <span>{tx.type} {tx.symbol}</span>
              <span>${parseFloat(tx.valueUsd.toString()).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
