import type { AnalyticsSummaryUi } from "@/app/analytics/_types/analytics-ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatInr(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type KpiItem = {
  description: string;
  key: string;
  label: string;
  value: string;
};

type AnalyticsKpiCardsProps = {
  summary: AnalyticsSummaryUi;
};

export function AnalyticsKpiCards({ summary }: AnalyticsKpiCardsProps) {
  const items: KpiItem[] = [
    {
      key: "fuelEfficiency",
      label: "Fuel Efficiency",
      value: summary.fuelEfficiencyKmPerL ? `${summary.fuelEfficiencyKmPerL} km/L` : "—",
      description: "Distance ÷ fuel liters (completed trips)",
    },
    {
      key: "fleetUtilization",
      label: "Fleet Utilization",
      value: `${summary.fleetUtilizationPercent}%`,
      description: "On trip ÷ active fleet (retired excluded)",
    },
    {
      key: "operationalCost",
      label: "Operational Cost",
      value: formatInr(summary.operationalCostInr),
      description: `Fuel ${formatInr(summary.fuelTotalInr)} + maintenance ${formatInr(summary.maintenanceTotalInr)}`,
    },
    {
      key: "vehicleRoi",
      label: "Vehicle ROI",
      value: summary.vehicleRoiPercent ? `${summary.vehicleRoiPercent}%` : "—",
      description: `Demo revenue ${formatInr(summary.monthlyRevenueInr)} (static)`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {items.map((item) => (
        <Card key={item.key} className="@container/card shadow-xs">
          <CardHeader className="gap-2">
            <CardDescription className="text-xs leading-snug">{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">
              {item.value}
            </CardTitle>
            <p className="text-xs leading-snug text-muted-foreground">{item.description}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
