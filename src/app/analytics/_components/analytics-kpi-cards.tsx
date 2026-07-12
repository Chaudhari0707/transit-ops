import type { AnalyticsSummaryUi } from "@/app/analytics/_types/analytics-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

type AnalyticsKpiCardsProps = {
  summary: AnalyticsSummaryUi;
};

export function AnalyticsKpiCards({ summary }: AnalyticsKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-l-4 border-l-sky-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs tracking-wide uppercase">
            Fuel efficiency
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {summary.fuelEfficiencyKmPerL ? `${summary.fuelEfficiencyKmPerL} km/L` : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Distance ÷ fuel liters (completed trips)
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs tracking-wide uppercase">
            Fleet utilization
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {summary.fleetUtilizationPercent}%
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          On trip ÷ active fleet (retired excluded)
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs tracking-wide uppercase">
            Operational cost
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {formatInr(summary.operationalCostInr)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Fuel {formatInr(summary.fuelTotalInr)} + maintenance{" "}
          {formatInr(summary.maintenanceTotalInr)}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-lime-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs tracking-wide uppercase">Vehicle ROI</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {summary.vehicleRoiPercent ? `${summary.vehicleRoiPercent}%` : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Demo revenue {formatInr(summary.monthlyRevenueInr)} (static)
        </CardContent>
      </Card>
    </div>
  );
}
