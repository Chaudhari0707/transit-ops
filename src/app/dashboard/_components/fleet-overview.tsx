"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FleetVehicle = {
  name: string;
  type: string;
  status: "available" | "on_trip" | "in_shop";
  odometerKm: number;
};

const fleetData: FleetVehicle[] = [
  { name: "Van-05", type: "Light Van", status: "on_trip", odometerKm: 48210 },
  { name: "Truck-12", type: "Heavy Truck", status: "available", odometerKm: 128400 },
  { name: "Reefer-02", type: "Refrigerated", status: "on_trip", odometerKm: 67320 },
  { name: "Van-03", type: "Light Van", status: "available", odometerKm: 31500 },
  { name: "Truck-08", type: "Heavy Truck", status: "in_shop", odometerKm: 201800 },
];

const statusStyle: Record<FleetVehicle["status"], string> = {
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  on_trip: "bg-primary/15 text-primary",
  in_shop: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const statusLabel: Record<FleetVehicle["status"], string> = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
};

export function FleetOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Snapshot</CardTitle>
        <CardDescription>Live vehicle status across all types</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fleetData.map((vehicle) => (
          <div
            key={vehicle.name}
            className="flex items-center justify-between rounded-lg border px-4 py-3"
          >
            <div>
              <p className="font-medium">{vehicle.name}</p>
              <p className="text-sm text-muted-foreground">{vehicle.type}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline">
                {vehicle.odometerKm.toLocaleString("en-IN")} km
              </span>
              <Badge className={statusStyle[vehicle.status]}>{statusLabel[vehicle.status]}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
