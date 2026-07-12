"use client";

import type { OtherExpenseRowUi } from "@/app/fuel-expenses/_types/fuel-expenses-ui";
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

const statusLabel: Record<OtherExpenseRowUi["vehicleStatus"], string> = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
  retired: "Retired",
};

type OtherExpensesTableProps = {
  loading?: boolean;
  rows: OtherExpenseRowUi[];
};

export function OtherExpensesTable({ rows, loading = false }: OtherExpensesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Other expenses (toll / misc)</CardTitle>
        <CardDescription>
          Toll and misc from the expenses table. <strong>MAINT. (LINKED)</strong> is the sum of{" "}
          <em>completed</em> maintenance costs for that vehicle — read-only (not stored as expense
          rows).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Toll</TableHead>
              <TableHead className="text-right">Other</TableHead>
              <TableHead className="text-right">Maint. (linked)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingRows columnCount={6} rowCount={5} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No other expenses or closed maintenance costs yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const other = (Number(row.miscInr) || 0) + (Number(row.fineInr) || 0);
                return (
                  <TableRow key={row.vehicleId}>
                    <TableCell className="font-mono text-sm">{row.tripLabel ?? "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.vehicleNameModel}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.vehicleRegistration}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInr(row.tollInr)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInr(other.toFixed(2))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-amber-600 tabular-nums dark:text-amber-400">
                      {formatInr(row.maintLinkedInr)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.vehicleStatus === "available" ? "secondary" : "default"}>
                        {statusLabel[row.vehicleStatus]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
