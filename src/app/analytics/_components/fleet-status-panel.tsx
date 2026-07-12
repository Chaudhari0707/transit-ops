import type { AnalyticsSummaryUi, TripCountsUi } from "@/app/analytics/_types/analytics-ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FleetStatusPanelProps = {
  summary: AnalyticsSummaryUi;
  tripCounts: TripCountsUi;
};

export function FleetStatusPanel({ summary, tripCounts }: FleetStatusPanelProps) {
  const fleetRows = [
    { label: "Available", tone: "bg-emerald-500", value: summary.vehicleCounts.available },
    { label: "On trip", tone: "bg-sky-500", value: summary.vehicleCounts.onTrip },
    { label: "In shop", tone: "bg-amber-500", value: summary.vehicleCounts.inShop },
    { label: "Retired", tone: "bg-zinc-400", value: summary.vehicleCounts.retired },
  ] as const;

  const tripRows = [
    { label: "Draft", value: tripCounts.draft },
    { label: "Dispatched", value: tripCounts.dispatched },
    { label: "Completed", value: tripCounts.completed },
    { label: "Cancelled", value: tripCounts.cancelled },
  ] as const;

  const fleetTotal = fleetRows.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Fleet & trip pulse</CardTitle>
        <CardDescription>
          Utilization {summary.fleetUtilizationPercent}% · {tripCounts.total} trips tracked
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="space-y-3">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Vehicle status mix
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {fleetRows.map((row) => {
              const width = fleetTotal > 0 ? (row.value / fleetTotal) * 100 : 0;
              if (width <= 0) {
                return null;
              }

              return (
                <div
                  key={row.label}
                  className={`h-full ${row.tone}`}
                  style={{ width: `${width}%` }}
                  title={`${row.label}: ${row.value}`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {fleetRows.map((row) => (
              <div key={row.label} className="rounded-md border p-2 text-sm">
                <div className="text-muted-foreground">{row.label}</div>
                <div className="text-lg font-semibold tabular-nums">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Trip lifecycle
          </div>
          <div className="flex flex-wrap gap-2">
            {tripRows.map((row) => (
              <Badge key={row.label} variant="outline" className="gap-1.5 px-2.5 py-1 text-sm">
                {row.label}
                <span className="font-semibold tabular-nums">{row.value}</span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
