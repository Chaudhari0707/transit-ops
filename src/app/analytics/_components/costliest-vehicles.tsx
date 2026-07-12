import type { CostliestVehicleUi } from "@/app/analytics/_types/analytics-ui";
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

const BAR_COLORS = [
  "bg-rose-400",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
] as const;

type CostliestVehiclesProps = {
  items: CostliestVehicleUi[];
};

export function CostliestVehicles({ items }: CostliestVehiclesProps) {
  const maxCost = items.reduce((max, row) => Math.max(max, Number(row.operationalCostInr) || 0), 0);

  return (
    <Card className="w-full self-start">
      <CardHeader>
        <CardTitle>Top Costliest Vehicles</CardTitle>
        <CardDescription>Operational cost = fuel + maintenance per vehicle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fuel or maintenance costs logged yet.</p>
        ) : (
          items.map((item, index) => {
            const cost = Number(item.operationalCostInr) || 0;
            const widthPct = maxCost > 0 ? Math.round((cost / maxCost) * 100) : 0;
            const color = BAR_COLORS[index % BAR_COLORS.length];

            return (
              <div key={item.vehicleId} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-muted-foreground" title={item.vehicleRegistration}>
                    {item.vehicleRegistration}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatInr(item.operationalCostInr)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
