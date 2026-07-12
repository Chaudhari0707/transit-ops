"use client";

import type { MaintenanceLogUi } from "@/app/maintenance/_types/maintenance-ui";
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
import { TableLoadingRows } from "@/lib/boneyard/table-row-shimmer";

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

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type MaintenanceLogsTableProps = {
  canWrite: boolean;
  closingId: number | null;
  loading?: boolean;
  logs: MaintenanceLogUi[];
  onClose: (id: number) => void;
};

export function MaintenanceLogsTable({
  canWrite,
  closingId,
  loading = false,
  logs,
  onClose,
}: MaintenanceLogsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service log</CardTitle>
        <CardDescription>
          Open jobs show vehicle status In Shop (hidden from dispatch). Closed jobs restore
          Available when not retired. Costs live here — not in expenses (op cost = fuel +
          maintenance).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service type</TableHead>
              <TableHead>Vendor / notes</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingRows columnCount={7} rowCount={5} />
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No maintenance logs yet. Log a service above.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{log.vehicleNameModel}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {log.vehicleRegistration}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.maintenanceTypeCode.toUpperCase() === "OTHER" && log.description
                      ? log.description.split(" — ")[0]
                      : log.maintenanceTypeName}
                    {log.maintenanceTypeCode.toUpperCase() === "OTHER" ? (
                      <div className="text-xs text-muted-foreground">Other (custom)</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-48 truncate">
                    {log.vendorName ||
                      (log.maintenanceTypeCode.toUpperCase() === "OTHER"
                        ? log.description?.includes(" — ")
                          ? log.description.split(" — ").slice(1).join(" — ")
                          : "—"
                        : log.description) ||
                      "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatInr(log.costInr)}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(log.startedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === "open" ? "default" : "secondary"}>
                      {log.status === "open" ? "In Shop" : "Completed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {log.status === "open" && canWrite ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={closingId === log.id}
                        onClick={() => onClose(log.id)}
                      >
                        {closingId === log.id ? "Closing…" : "Close"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
