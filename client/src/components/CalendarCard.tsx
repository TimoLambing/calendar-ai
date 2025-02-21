import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Transaction, CoinBalance } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, TrendingDown, Rocket, Skull, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [diaryComment, setDiaryComment] = useState("");
  const { toast } = useToast();

  const valueChange = previousDayValue ? ((value - previousDayValue) / previousDayValue) * 100 : 0;
  const isPositive = valueChange > 0;
  const isNegative = valueChange < 0;
  const isHighVolatility = Math.abs(valueChange) >= 30;

  const handleAddDiaryEntry = async (transactionId: number) => {
    try {
      await apiRequest('POST', '/api/diary-entries', {
        transactionId,
        comment: diaryComment
      });
      toast({
        title: "Diary Entry Added",
        description: "Your trading note has been saved successfully."
      });
      setDiaryComment("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save diary entry",
        variant: "destructive"
      });
    }
  };

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
              isPositive && isHighVolatility && "border-green-600 bg-green-200",
              isPositive && !isHighVolatility && "border-green-500 bg-green-100",
              isNegative && isHighVolatility && "border-red-600 bg-red-200",
              isNegative && !isHighVolatility && "border-red-500 bg-red-100",
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
                      isPositive && "text-green-800",
                      isNegative && "text-red-800"
                    )}>
                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {valueChange > 0 ? "+" : ""}{valueChange.toFixed(2)}%
                    </div>
                  )}
                </div>
                {commentary && (
                  <div className="text-sm mt-4 font-medium flex items-start gap-2 bg-white/90 backdrop-blur-sm border p-3 rounded-lg shadow-sm">
                    {isPositive ? 
                      <Rocket className="h-5 w-5 shrink-0 text-green-600" /> : 
                      <Skull className="h-5 w-5 shrink-0 text-red-600" />
                    }
                    <span className="italic leading-snug">{commentary}</span>
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
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Transactions</h4>
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Trading Diary
              </Button>
            </div>
            {transactions.map((tx) => (
              <div key={tx.id} className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
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
                  <div className="text-right">
                    <div>${parseFloat(tx.valueUsd.toString()).toLocaleString()}</div>
                    {tx.currentValue && (
                      <div className={cn(
                        "text-sm",
                        parseFloat(tx.currentValue.toString()) > parseFloat(tx.valueUsd.toString())
                          ? "text-green-600"
                          : "text-red-600"
                      )}>
                        Current: ${parseFloat(tx.currentValue.toString()).toLocaleString()}
                        ({(((parseFloat(tx.currentValue.toString()) / parseFloat(tx.valueUsd.toString())) - 1) * 100).toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note about this trade..."
                    value={diaryComment}
                    onChange={(e) => setDiaryComment(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={() => handleAddDiaryEntry(tx.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}