import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Transaction, CoinBalance } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  date: Date;
  value: number;
  coins: CoinBalance[];
  transactions: Transaction[];
  notes?: string;
}

export function CalendarCard({ date, value, coins, transactions, notes }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

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
            <Card className="absolute w-full h-full backface-hidden">
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="text-sm font-medium">{date.toLocaleDateString()}</div>
                  <div className="text-2xl font-bold mt-2">
                    ${value.toLocaleString()}
                  </div>
                </div>
                {notes && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {notes}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Back of card */}
            <Card className="absolute w-full h-full backface-hidden [transform:rotateY(180deg)]">
              <CardContent className="p-4 h-full">
                <div className="text-sm font-medium mb-2">Portfolio</div>
                <div className="space-y-2">
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
                  <span className="font-medium">{tx.type}</span>
                  <span className="mx-2">{tx.symbol}</span>
                  <span className="text-sm text-muted-foreground">
                    ({parseFloat(tx.amount.toString())} coins)
                  </span>
                </div>
                <span>${parseFloat(tx.valueUsd.toString()).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {notes && (
            <div className="space-y-2">
              <h4 className="font-medium">Notes</h4>
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}