"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { MonthlyRevenuePointUi } from "@/app/analytics/_types/analytics-ui";
import type { ChartConfig } from "@/components/_types/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
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
    <Card className="w-full self-start">
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
        <CardDescription>Static demo series (ADR-050) — not live bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-55 w-full">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(value: number) => `₹${Math.round(value / 1000)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number"
                      ? new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(value)
                      : String(value)
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
