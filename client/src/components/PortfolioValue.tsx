// client/src/components/PortfolioValue.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  walletId: string;
}

type Snapshot = {
  timestamp: string;
  totalValue: string;
};
export function PortfolioValue({ walletId }: Props) {
  const { data: snapshots } = useQuery<Snapshot[]>({
    queryKey: [`/api/wallets/${walletId}/snapshots`],
  });

  if (!snapshots) return null;

  const chartData = snapshots?.map((snapshot: Snapshot) => ({
    date: new Date(snapshot.timestamp).toLocaleDateString(),
    value: parseFloat(snapshot.totalValue),
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Portfolio Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
