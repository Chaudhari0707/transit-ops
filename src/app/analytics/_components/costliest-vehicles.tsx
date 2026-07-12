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
  "bg-amber-600",
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
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top costliest vehicles</CardTitle>
        <CardDescription>Operational cost = fuel + maintenance per vehicle</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fuel or maintenance costs logged yet.</p>
        ) : (
          items.map((item, index) => {
            const cost = Number(item.operationalCostInr) || 0;
            const widthPct = maxCost > 0 ? Math.max(6, (cost / maxCost) * 100) : 0;
            const color = BAR_COLORS[index % BAR_COLORS.length];

            return (
              <div
                key={item.vehicleId}
                className="grid grid-cols-[7rem_1fr_auto] items-center gap-3"
              >
                <div className="truncate text-sm font-medium" title={item.vehicleRegistration}>
                  {item.vehicleRegistration}
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="text-sm text-muted-foreground tabular-nums">
                  {formatInr(item.operationalCostInr)}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
