"use client";

import type { DashboardKpisView } from "@/app/dashboard/_types/dashboard-ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValueShimmerBar } from "@/lib/boneyard/table-row-shimmer";

type KpiDef = {
  key: keyof Omit<DashboardKpisView, "vehicleStatus">;
  label: string;
  format?: (value: number) => string;
};

const KPI_DEFS: KpiDef[] = [
  { key: "activeVehicles", label: "Active Vehicles" },
  { key: "availableVehicles", label: "Available Vehicles" },
  { key: "vehiclesInMaintenance", label: "Vehicles in Maintenance" },
  { key: "activeTrips", label: "Active Trips" },
  { key: "pendingTrips", label: "Pending Trips" },
  { key: "driversOnDuty", label: "Drivers on Duty" },
  {
    format: (value) => `${value}%`,
    key: "fleetUtilizationPercent",
    label: "Fleet Utilization",
  },
];

/**
 * Card chrome + labels always visible. Only the numeric value shimmers while loading.
 */
export function KpiCards({
  kpis,
  loading = false,
}: {
  kpis: DashboardKpisView;
  loading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4 lg:px-6 xl:grid-cols-7">
      {KPI_DEFS.map((def) => {
        const raw = kpis[def.key];
        const display = def.format ? def.format(raw) : String(raw).padStart(2, "0");

        return (
          <Card key={def.key} className="@container/card shadow-xs">
            <CardHeader className="gap-2">
              <CardDescription className="text-xs leading-snug">{def.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">
                {loading ? <ValueShimmerBar className="h-8 w-12" /> : display}
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
