// client/src/components/CoinPerformance.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  balances: any[];
}

export function CoinPerformance({ balances }: Props) {

  const filterNonNumeric = (value: string) => {
    return value.replace(/[^0-9.-]+/g, "");
  };

  const getValue = (value: string) => {
    return parseFloat(filterNonNumeric(value.toString())).toFixed(4);
  };

  console.log(balances);
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
                <span>{getValue(balance.amount)}</span>
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
