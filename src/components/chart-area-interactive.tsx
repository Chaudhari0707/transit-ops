"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import type { ChartConfig } from "@/components/_types/chart";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";

const chartData = [
  { date: "2026-01-01", fuel: 32000, maintenance: 8500 },
  { date: "2026-01-08", fuel: 28500, maintenance: 12000 },
  { date: "2026-01-15", fuel: 35200, maintenance: 4200 },
  { date: "2026-01-22", fuel: 29800, maintenance: 9800 },
  { date: "2026-01-29", fuel: 33400, maintenance: 6100 },
  { date: "2026-02-05", fuel: 31200, maintenance: 15400 },
  { date: "2026-02-12", fuel: 36800, maintenance: 3800 },
  { date: "2026-02-19", fuel: 30100, maintenance: 11200 },
  { date: "2026-02-26", fuel: 34500, maintenance: 7200 },
  { date: "2026-03-05", fuel: 32900, maintenance: 8900 },
  { date: "2026-03-12", fuel: 35600, maintenance: 5400 },
  { date: "2026-03-19", fuel: 31800, maintenance: 13600 },
  { date: "2026-03-26", fuel: 37200, maintenance: 4800 },
  { date: "2026-04-02", fuel: 33800, maintenance: 10200 },
  { date: "2026-04-09", fuel: 36100, maintenance: 6700 },
];

const chartConfig = {
  costs: {
    label: "Operational Cost",
  },
  fuel: {
    label: "Fuel",
    color: "var(--chart-1)",
  },
  maintenance: {
    label: "Maintenance",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatInr(value: number) {
  return `₹${(value / 1000).toFixed(0)}k`;
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2026-04-09");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Operational Cost Trend</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Fuel and maintenance costs in INR</span>
          <span className="@[540px]/card:hidden">Fuel + maintenance</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d");
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value);
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillFuel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-fuel)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-fuel)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMaintenance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-maintenance)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-maintenance)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  formatter={(value, name) => (
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground capitalize">{name}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatInr(Number(value))}
                      </span>
                    </span>
                  )}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="maintenance"
              type="natural"
              fill="url(#fillMaintenance)"
              stroke="var(--color-maintenance)"
              stackId="a"
            />
            <Area
              dataKey="fuel"
              type="natural"
              fill="url(#fillFuel)"
              stroke="var(--color-fuel)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
