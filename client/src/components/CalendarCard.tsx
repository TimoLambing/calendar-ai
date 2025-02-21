import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Transaction, CoinBalance } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, TrendingDown, Rocket, Skull, Trophy, Plus } from "lucide-react";
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
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const valueChange = previousDayValue ? ((value - previousDayValue) / previousDayValue) * 100 : 0;

  // Define percentage ranges
  const isExtremeGain = valueChange > 50;
  const isHighGain = valueChange > 30 && valueChange <= 50;
  const isGoodGain = valueChange > 15 && valueChange <= 30;
  const isGain = valueChange > 0 && valueChange <= 15;
  const isSmallLoss = valueChange < 0 && valueChange >= -15;
  const isLoss = valueChange < -15 && valueChange >= -30;
  const isHighLoss = valueChange < -30 && valueChange >= -50;
  const isExtremeLoss = valueChange < -50;

  const handleAddComment = async () => {
    try {
      await apiRequest('POST', '/api/diary-entries', {
        date: date.toISOString(),
        comment
      });
      toast({
        title: "Comment Added",
        description: "Your trading note has been saved successfully."
      });
      setComment("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save comment",
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
              // Gains
              isExtremeGain && "border-green-800 bg-green-300",
              isHighGain && "border-green-600 bg-green-200",
              isGoodGain && "border-green-500 bg-green-100",
              isGain && "border-yellow-500 bg-yellow-100",
              // Losses
              isSmallLoss && "border-pink-400 bg-pink-100",
              isLoss && "border-red-400 bg-red-100",
              isHighLoss && "border-red-600 bg-red-200",
              isExtremeLoss && "border-red-800 bg-red-300",
            )}>
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">{date.toLocaleDateString()}</div>
                    {valueChange > 0 && (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    ${value.toLocaleString()}
                  </div>
                  {previousDayValue && (
                    <div className={cn(
                      "text-sm mt-1 font-semibold flex items-center gap-1",
                      valueChange > 0 ? "text-green-800" : "text-red-800"
                    )}>
                      {valueChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {valueChange > 0 ? "+" : ""}{valueChange.toFixed(2)}%
                    </div>
                  )}
                </div>
                {commentary && (
                  <div className="text-sm mt-4 font-medium flex items-start gap-2 bg-white/90 backdrop-blur-sm border p-3 rounded-lg shadow-sm">
                    {valueChange > 0 ? 
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
                  {coins.map((coin) => {
                    const prevDayCoin = transactions.find(t => t.symbol === coin.symbol);
                    const performance = prevDayCoin 
                      ? ((parseFloat(coin.valueUsd) - parseFloat(prevDayCoin.valueUsd)) / parseFloat(prevDayCoin.valueUsd)) * 100 
                      : 0;

                    return (
                      <div key={coin.id} className="flex justify-between text-sm">
                        <span>{coin.symbol}</span>
                        <div className="text-right">
                          <div>${parseFloat(coin.valueUsd.toString()).toLocaleString()}</div>
                          <div className={cn(
                            "text-xs",
                            performance > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {performance > 0 ? "+" : ""}{performance.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Trading Notes - {date.toLocaleDateString()}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Textarea
              placeholder="Add your trading notes for this day..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleAddComment} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}