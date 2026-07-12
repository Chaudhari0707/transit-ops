import {
  FuelIcon,
  GaugeIcon,
  IndianRupeeIcon,
  TrendingUpIcon,
  TruckIcon,
  WrenchIcon,
} from "lucide-react";

import { formatInr } from "@/app/analytics/_lib/format-inr";
import type { AnalyticsSummaryUi } from "@/app/analytics/_types/analytics-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsKpiCardsProps = {
  summary: AnalyticsSummaryUi;
};

export function AnalyticsKpiCards({ summary }: AnalyticsKpiCardsProps) {
  const cards = [
    {
      accent: "border-l-sky-500",
      icon: <FuelIcon className="size-4 text-sky-600" />,
      label: "Fuel efficiency",
      sub: `${summary.totalDistanceKm} km · ${summary.fuelTotalLiters} L`,
      value: summary.fuelEfficiencyKmPerL ? `${summary.fuelEfficiencyKmPerL} km/L` : "—",
    },
    {
      accent: "border-l-emerald-500",
      icon: <TruckIcon className="size-4 text-emerald-600" />,
      label: "Fleet utilization",
      sub: `${summary.vehicleCounts.onTrip} on trip · ${summary.vehicleCounts.available} available`,
      value: `${summary.fleetUtilizationPercent}%`,
    },
    {
      accent: "border-l-amber-500",
      icon: <WrenchIcon className="size-4 text-amber-600" />,
      label: "Operational cost",
      sub: `Fuel ${formatInr(summary.fuelTotalInr)} + Maint ${formatInr(summary.maintenanceTotalInr)}`,
      value: formatInr(summary.operationalCostInr),
    },
    {
      accent: "border-l-lime-500",
      icon: <TrendingUpIcon className="size-4 text-lime-600" />,
      label: "Fleet ROI",
      sub: `Revenue ${formatInr(summary.monthlyRevenueInr)}`,
      value: summary.vehicleRoiPercent ? `${summary.vehicleRoiPercent}%` : "—",
    },
    {
      accent: "border-l-violet-500",
      icon: <IndianRupeeIcon className="size-4 text-violet-600" />,
      label: "Net margin",
      sub: "Revenue − operational cost",
      value: formatInr(summary.netMarginInr),
    },
    {
      accent: "border-l-orange-500",
      icon: <GaugeIcon className="size-4 text-orange-600" />,
      label: "Other expenses",
      sub: "Toll / fine / misc (excluded from op cost)",
      value: formatInr(summary.expensesTotalInr),
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className={`border-l-4 ${card.accent}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription className="text-xs tracking-wide uppercase">
                {card.label}
              </CardDescription>
              {card.icon}
            </div>
            <CardTitle className="text-3xl font-semibold tabular-nums">{card.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{card.sub}</CardContent>
        </Card>
      ))}
    </div>
  );
}
