import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Rocket,
  Skull,
  Trophy,
  ScrollText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { JournalEntries } from "@/components/JournalEntries";
import { CoinBalance, Transaction } from "@/schemas";
import { useAppState } from "@/store/appState";

interface Props {
  date: Date;
  value: number;
  previousDayValue?: number;
  coins: CoinBalance[];
  transactions: Transaction[];
  notes?: string;
  commentary?: string;
  isOtherUser?: boolean; // New prop to differentiate between own and other users' wallets
}

export function CalendarCard({
  date,
  value,
  previousDayValue,
  coins,
  transactions,
  notes,
  commentary,
  isOtherUser = false,
}: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const {
    state: { address },
  } = useAppState();
  const currentUserAddress = address;

  async function handleAddComment() {
    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    try {
      const walletResponse = await apiRequest(
        "GET",
        `/api/wallets/${currentUserAddress}`
      );
      const walletData = await walletResponse.json();

      await apiRequest("POST", "/api/diary-entries", {
        comment,
        timestamp: date.toISOString(),
        portfolioValue: value,
        valueChange: valueChange,
        authorAddress: currentUserAddress,
        wallet: walletData,
      });

      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      queryClient.invalidateQueries({
        queryKey: ["diary-entries", date.toISOString()],
      });

      toast({
        title: "Comment Added",
        description: "Your trading note has been saved successfully.",
      });
      setComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to save comment",
        variant: "destructive",
      });
    }
  }

  const { data: diaryEntries } = useQuery<TradingDiaryEntry[]>({
    queryKey: ["diary-entries", date.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/diary-entries/date/${date.toISOString()}`);
      if (!res.ok) throw new Error("Failed to fetch diary entries");
      return res.json();
    },
  });

  // Calculate value change, handling zero or undefined previousDayValue
  const valueChange =
    previousDayValue && previousDayValue !== 0
      ? ((value - previousDayValue) / previousDayValue) * 100
      : value > 0
        ? 100
        : 0; // Default to 100% if no previous value but current value exists, or 0% if no value

  const isExtremeGain = valueChange > 50;
  const isHighGain = valueChange > 30 && valueChange <= 50;
  const isGoodGain = valueChange > 15 && valueChange <= 30;
  const isGain = valueChange > 0 && valueChange <= 15;
  const isSmallLoss = valueChange < 0 && valueChange >= -15;
  const isLoss = valueChange < -15 && valueChange >= -30;
  const isHighLoss = valueChange < -30 && valueChange >= -50;
  const isExtremeLoss = valueChange < -50;

  const getColorClasses = () => {
    if (isOtherUser) {
      return {
        extremeGain: "border-purple-800 bg-purple-300",
        highGain: "border-purple-600 bg-purple-200",
        goodGain: "border-purple-500 bg-purple-100",
        gain: "border-blue-500 bg-blue-100",
        smallLoss: "border-orange-400 bg-orange-100",
        loss: "border-orange-600 bg-orange-200",
        highLoss: "border-orange-700 bg-orange-300",
        extremeLoss: "border-orange-800 bg-orange-400",
      };
    }
    return {
      extremeGain: "border-green-800 bg-green-300",
      highGain: "border-green-600 bg-green-200",
      goodGain: "border-green-500 bg-green-100",
      gain: "border-yellow-500 bg-yellow-100",
      smallLoss: "border-pink-400 bg-pink-100",
      loss: "border-red-400 bg-red-100",
      highLoss: "border-red-600 bg-red-200",
      extremeLoss: "border-red-800 bg-red-300",
    };
  };

  const colorClasses = getColorClasses();

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
            <Card
              className={cn(
                "absolute w-full h-full backface-hidden border-2",
                isExtremeGain && colorClasses.extremeGain,
                isHighGain && colorClasses.highGain,
                isGoodGain && colorClasses.goodGain,
                isGain && colorClasses.gain,
                isSmallLoss && colorClasses.smallLoss,
                isLoss && colorClasses.loss,
                isHighLoss && colorClasses.highLoss,
                isExtremeLoss && colorClasses.extremeLoss
              )}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {transactions.length > 0 && (
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                      )}
                      {valueChange > 0 && (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    ${value.toLocaleString()}
                  </div>
                  {previousDayValue !== undefined && (
                    <div
                      className={cn(
                        "text-sm mt-1 font-semibold flex items-center gap-1",
                        valueChange > 0 ? "text-green-800" : "text-red-800"
                      )}
                    >
                      {valueChange > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {valueChange > 0 ? "+" : ""}
                      {valueChange.toFixed(2)}%
                    </div>
                  )}
                </div>
                {commentary && (
                  <div className="text-sm mt-4 font-medium flex items-start gap-2 bg-white/90 backdrop-blur-sm border p-3 rounded-lg shadow-sm">
                    {valueChange > 0 ? (
                      <Rocket className="h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                      <Skull className="h-5 w-5 shrink-0 text-red-600" />
                    )}
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
                    const prevDayCoin = transactions.find(
                      (t) => t.symbol === coin.symbol
                    );
                    const performance =
                      prevDayCoin && prevDayCoin.valueUsd !== 0
                        ? ((parseFloat(coin.valueUsd.toString()) -
                          parseFloat(prevDayCoin.valueUsd)) /
                          parseFloat(prevDayCoin.valueUsd)) *
                        100
                        : 0;

                    return (
                      <div
                        key={coin.id}
                        className="flex justify-between text-sm"
                      >
                        <span>{coin.symbol}</span>
                        <div className="text-right">
                          <div>
                            $
                            {parseFloat(
                              coin.valueUsd.toString()
                            ).toLocaleString()}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              performance > 0
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {performance > 0 ? "+" : ""}
                            {performance.toFixed(2)}%
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
            Trading Details - {date.toLocaleDateString()}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transactions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="journal">Trading Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const performance =
                    tx.currentValue && tx.valueUsd !== 0
                      ? ((parseFloat(tx.currentValue) -
                        parseFloat(tx.valueUsd)) /
                        parseFloat(tx.valueUsd)) *
                      100
                      : 0;

                  return (
                    <Card key={tx.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{tx.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              {tx.type} -{" "}
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div>
                              $
                              {parseFloat(
                                tx.valueUsd.toString()
                              ).toLocaleString()}
                            </div>
                            {tx.currentValue && (
                              <div
                                className={cn(
                                  "text-sm font-medium",
                                  performance > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                {performance > 0 ? "+" : ""}
                                {performance.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No transactions on this day
              </div>
            )}
          </TabsContent>

          <TabsContent value="journal" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Portfolio Value
                  </div>
                  <div className="text-lg font-semibold">
                    ${value.toLocaleString()}
                  </div>
                </div>
                {previousDayValue !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Daily Change
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold flex items-center gap-1",
                        valueChange > 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {valueChange > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {valueChange > 0 ? "+" : ""}
                      {valueChange.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>

              <Textarea
                placeholder="Add your trading notes for this day..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleAddComment} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Note
              </Button>

              <JournalEntries
                entries={diaryEntries || []}
                date={
                  new Date(date.getFullYear(), date.getMonth(), date.getDate())
                }
                value={value}
                valueChange={valueChange}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
export interface TradingDiaryComment {
  id: string;
  comment: string;
  createdAt: string | null;
  authorAddress: string;
}
export interface TradingDiaryEntry {
  id: string;
  comment: string;
  timestamp: string;
  comments: TradingDiaryComment[];
  createdAt: string | null;
  portfolioValue: number;
  valueChange: number;
  walletId: string;
  authorAddress: string;
}
