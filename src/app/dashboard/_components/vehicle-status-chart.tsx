"use client";

import type { DashboardKpisView } from "@/app/dashboard/_types/dashboard-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StatusKey = keyof DashboardKpisView["vehicleStatus"];

const STATUS_ROWS: {
  barClass: string;
  key: StatusKey;
  label: string;
}[] = [
  { key: "available", label: "Available", barClass: "bg-emerald-500" },
  { key: "on_trip", label: "On Trip", barClass: "bg-amber-500" },
  { key: "in_shop", label: "In Shop", barClass: "bg-sky-500" },
  { key: "retired", label: "Retired", barClass: "bg-rose-400" },
];

export function VehicleStatusChart({
  vehicleStatus,
}: {
  vehicleStatus: DashboardKpisView["vehicleStatus"];
}) {
  const total =
    vehicleStatus.available + vehicleStatus.on_trip + vehicleStatus.in_shop + vehicleStatus.retired;
  const max = Math.max(
    vehicleStatus.available,
    vehicleStatus.on_trip,
    vehicleStatus.in_shop,
    vehicleStatus.retired,
    1,
  );

  return (
    <Card className="w-full self-start">
      <CardHeader>
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>
          {total === 0 ? "No vehicles registered yet" : `${total} vehicles in fleet`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {STATUS_ROWS.map((row) => {
          const count = vehicleStatus[row.key];
          const widthPct = Math.round((count / max) * 100);

          return (
            <div key={row.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${row.barClass}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
