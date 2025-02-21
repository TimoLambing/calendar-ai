import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Transaction, CoinBalance } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, TrendingDown, Rocket, Skull } from "lucide-react";

interface Props {
  date: Date;
  value: number;
  previousDayValue?: number;
  coins: CoinBalance[];
  transactions: Transaction[];
  notes?: string;
  commentary?: string;
}

export function CalendarCard({ date, value, previousDayValue, coins, transactions, notes, commentary }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  const valueChange = previousDayValue ? ((value - previousDayValue) / previousDayValue) * 100 : 0;
  const isPositive = valueChange > 0;
  const isNegative = valueChange < 0;
  const isSignificant = Math.abs(valueChange) > 20;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          className="relative w-full h-[200px] cursor-pointer perspective-1000"
          onHoverStart={() => setIsFlipped(true)}
          onHoverEnd={() => setIsFlipped(false)}
        >
          <motion.div
            className="w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card */}
            <Card className={cn(
              "absolute w-full h-full backface-hidden border-2",
              isPositive && isSignificant && "border-green-500 bg-green-100",
              isPositive && !isSignificant && "border-green-400 bg-green-50",
              isNegative && isSignificant && "border-red-500 bg-red-100",
              isNegative && !isSignificant && "border-red-400 bg-red-50",
              !previousDayValue && "border-gray-200"
            )}>
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="text-sm font-medium">{date.toLocaleDateString()}</div>
                  <div className="text-2xl font-bold mt-2">
                    ${value.toLocaleString()}
                  </div>
                  {previousDayValue && (
                    <div className={cn(
                      "text-sm mt-1 font-semibold flex items-center gap-1",
                      isPositive && "text-green-700",
                      isNegative && "text-red-700"
                    )}>
                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {valueChange > 0 ? "+" : ""}{valueChange.toFixed(2)}%
                    </div>
                  )}
                </div>
                {isSignificant && commentary && (
                  <div className="text-sm font-medium mt-2 flex items-start gap-2">
                    {isPositive ? 
                      <Rocket className="h-4 w-4 shrink-0 text-green-600" /> : 
                      <Skull className="h-4 w-4 shrink-0 text-red-600" />
                    }
                    <span className="italic">{commentary}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Back of card */}
            <Card className="absolute w-full h-full backface-hidden [transform:rotateY(180deg)]">
              <CardContent className="p-4 h-full overflow-auto">
                <div className="space-y-4">
                  {coins.map((coin) => (
                    <div key={coin.id} className="flex justify-between text-sm">
                      <span>{coin.symbol}</span>
                      <span>${parseFloat(coin.valueUsd.toString()).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Portfolio Details - {date.toLocaleDateString()}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="font-medium">Transactions</h4>
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                <div>
                  <span className={cn(
                    "font-medium",
                    tx.type === "BUY" ? "text-green-600" : "text-red-600"
                  )}>{tx.type}</span>
                  <span className="mx-2">{tx.symbol}</span>
                  <span className="text-sm text-muted-foreground">
                    ({parseFloat(tx.amount.toString()).toLocaleString()} coins)
                  </span>
                </div>
                <span>${parseFloat(tx.valueUsd.toString()).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
