"use client";

import type { FuelLogUi } from "@/app/fuel-expenses/_types/fuel-expenses-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type FuelLogsTableProps = {
  logs: FuelLogUi[];
};

export function FuelLogsTable({ logs }: FuelLogsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel logs</CardTitle>
        <CardDescription>
          Vehicle fuel fills — feeds operational cost (fuel + maintenance).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Liters</TableHead>
              <TableHead className="text-right">Fuel cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No fuel logs yet.
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
                  <TableCell className="whitespace-nowrap">{log.loggedAt}</TableCell>
                  <TableCell className="text-right tabular-nums">{log.liters} L</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatInr(log.costInr)}
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
