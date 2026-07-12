"use client";

import type { TripRow } from "@/app/dashboard/_types/trip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant: Record<
  TripRow["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  dispatched: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const statusLabel: Record<TripRow["status"], string> = {
  draft: "Draft",
  dispatched: "On Trip",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function RecentTripsTable({ trips }: { trips: TripRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trips</CardTitle>
        <CardDescription>Latest dispatch activity across your fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Cargo</TableHead>
              <TableHead className="text-right">Distance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-mono text-sm">{trip.id}</TableCell>
                <TableCell className="max-w-50 truncate">{trip.route}</TableCell>
                <TableCell>{trip.vehicle}</TableCell>
                <TableCell>{trip.driver}</TableCell>
                <TableCell className="text-right tabular-nums">{trip.cargoKg} kg</TableCell>
                <TableCell className="text-right tabular-nums">{trip.distanceKm} km</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[trip.status]}>{statusLabel[trip.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
