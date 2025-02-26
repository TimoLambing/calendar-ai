// client/src/components/CoinPerformance.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinBalance } from "@shared/schema";

interface Props {
  balances: CoinBalance[];
}

export function CoinPerformance({ balances }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.map((balance) => (
            <div key={balance.id} className="flex justify-between items-center">
              <div className="font-medium">{balance.symbol}</div>
              <div className="space-x-4">
                <span>{parseFloat(balance.amount.toString()).toFixed(4)}</span>
                <span className="text-muted-foreground">
                  ${parseFloat(balance.valueUsd.toString()).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
