"use client";

import type { DriverUi } from "@/app/drivers/_types/drivers-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DriverUi["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  available: "secondary",
  on_trip: "default",
  off_duty: "outline",
  suspended: "destructive",
};

const statusLabel: Record<DriverUi["status"], string> = {
  available: "Available",
  on_trip: "On Trip",
  off_duty: "Off Duty",
  suspended: "Suspended",
};

type DriversTableProps = {
  canWrite: boolean;
  deletingId: string | null;
  drivers: DriverUi[];
  onDelete: (id: string) => void;
  onEdit: (driver: DriverUi) => void;
};

export function DriversTable({
  canWrite,
  deletingId,
  drivers,
  onDelete,
  onEdit,
}: DriversTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drivers</CardTitle>
        <CardDescription>
          License compliance indicators: red = expired, amber = expiring within 30 days. Trip
          completion % is computed from trips (not stored).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Safety</TableHead>
              <TableHead className="text-right">Trip %</TableHead>
              <TableHead>Status</TableHead>
              {canWrite ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 9 : 8} className="text-center text-muted-foreground">
                  No drivers found.
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.fullName}</TableCell>
                  <TableCell className="font-mono text-sm">{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.licenseCategoryCode}</TableCell>
                  <TableCell>
                    <span
                      className={
                        driver.isLicenseExpired
                          ? "font-medium text-destructive"
                          : driver.isLicenseExpiringSoon
                            ? "font-medium text-amber-600 dark:text-amber-400"
                            : undefined
                      }
                    >
                      {driver.licenseExpiryDate}
                    </span>
                    {driver.isLicenseExpired ? (
                      <div className="text-xs text-destructive">Expired</div>
                    ) : driver.isLicenseExpiringSoon ? (
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        Expiring soon
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{driver.contactNumber}</TableCell>
                  <TableCell className="text-right tabular-nums">{driver.safetyScore}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {driver.tripCompletionPct === null ? "—" : `${driver.tripCompletionPct}%`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[driver.status]}>
                      {statusLabel[driver.status]}
                    </Badge>
                  </TableCell>
                  {canWrite ? (
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => onEdit(driver)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={driver.status === "on_trip" || deletingId === driver.id}
                        onClick={() => onDelete(driver.id)}
                      >
                        {deletingId === driver.id ? "…" : "Delete"}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
