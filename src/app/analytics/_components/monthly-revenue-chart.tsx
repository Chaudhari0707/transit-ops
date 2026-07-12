"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatInr } from "@/app/analytics/_lib/format-inr";
import type { MonthlyRevenuePointUi } from "@/app/analytics/_types/analytics-ui";
import type { ChartConfig } from "@/components/_types/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  revenue: {
    color: "var(--chart-1)",
    label: "Revenue",
  },
} satisfies ChartConfig;

type MonthlyRevenueChartProps = {
  points: MonthlyRevenuePointUi[];
};

export function MonthlyRevenueChart({ points }: MonthlyRevenueChartProps) {
  const data = points.map((point) => ({
    label: point.label,
    revenue: Number(point.revenueInr) || 0,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly revenue</CardTitle>
        <CardDescription>From completed trips (`revenue_logs` · ADR-056)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} className="aspect-auto h-55 w-full">
          <BarChart data={data} margin={{ bottom: 0, left: 8, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
            <YAxis
              axisLine={false}
              tickFormatter={(value: number) => `₹${Math.round(value / 1000)}k`}
              tickLine={false}
              width={48}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number" ? formatInr(value) : String(value)
                  }
                />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
