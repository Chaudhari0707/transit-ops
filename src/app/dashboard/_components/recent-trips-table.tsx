"use client";

import type { RecentTripView } from "@/app/dashboard/_types/dashboard-ui";
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
import { TableLoadingRows } from "@/lib/boneyard/table-row-shimmer";

const statusVariant: Record<
  RecentTripView["status"],
  "default" | "destructive" | "outline" | "secondary"
> = {
  cancelled: "destructive",
  completed: "secondary",
  dispatched: "default",
  draft: "outline",
};

const statusLabel: Record<RecentTripView["status"], string> = {
  cancelled: "Cancelled",
  completed: "Completed",
  dispatched: "On Trip",
  draft: "Draft",
};

const statusClass: Partial<Record<RecentTripView["status"], string>> = {
  completed: "bg-emerald-500/10 text-emerald-700 border-transparent dark:text-emerald-400",
  dispatched: "bg-emerald-500/15 text-emerald-700 border-transparent dark:text-emerald-400",
};

type RecentTripsTableProps = {
  loading?: boolean;
  trips: RecentTripView[];
};

export function RecentTripsTable({ trips, loading }: RecentTripsTableProps) {
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
              <TableHead>Trip</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingRows columnCount={5} rowCount={5} />
            ) : trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No trips match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-mono text-sm">{trip.tripCode}</TableCell>
                  <TableCell>{trip.vehicleName}</TableCell>
                  <TableCell>{trip.driverName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[trip.status]}
                      className={statusClass[trip.status]}
                    >
                      {statusLabel[trip.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {trip.etaLabel}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
