"use client";

import { Cell, Pie, PieChart } from "recharts";

import { formatInr } from "@/app/analytics/_lib/format-inr";
import type { CostBreakdownUi } from "@/app/analytics/_types/analytics-ui";
import type { ChartConfig } from "@/components/_types/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  expenses: { color: "var(--chart-3)", label: "Other expenses" },
  fuel: { color: "var(--chart-1)", label: "Fuel" },
  maintenance: { color: "var(--chart-2)", label: "Maintenance" },
} satisfies ChartConfig;

const COLORS = ["var(--color-fuel)", "var(--color-maintenance)", "var(--color-expenses)"] as const;

type CostBreakdownChartProps = {
  breakdown: CostBreakdownUi;
};

export function CostBreakdownChart({ breakdown }: CostBreakdownChartProps) {
  const data = [
    { key: "fuel", name: "Fuel", value: Number(breakdown.fuelTotalInr) || 0 },
    { key: "maintenance", name: "Maintenance", value: Number(breakdown.maintenanceTotalInr) || 0 },
    { key: "expenses", name: "Other expenses", value: Number(breakdown.expensesTotalInr) || 0 },
  ].filter((row) => row.value > 0);

  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cost composition</CardTitle>
        <CardDescription>
          Op cost {formatInr(breakdown.operationalCostInr)} (fuel + maint). Tolls shown separately.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        {total <= 0 ? (
          <p className="text-sm text-muted-foreground">No cost data yet.</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-48 w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        typeof value === "number" ? formatInr(value) : String(value)
                      }
                      nameKey="name"
                    />
                  }
                />
                <Pie
                  cx="50%"
                  cy="50%"
                  data={data}
                  dataKey="value"
                  innerRadius={48}
                  nameKey="name"
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
              {data.map((row, index) => (
                <div key={row.key} className="rounded-md border p-2">
                  <div className="flex items-center justify-center gap-1.5 font-medium">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    {row.name}
                  </div>
                  <div className="mt-1 text-muted-foreground tabular-nums">
                    {formatInr(row.value)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
