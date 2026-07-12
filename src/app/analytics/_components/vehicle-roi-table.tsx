import { formatInr } from "@/app/analytics/_lib/format-inr";
import type { VehicleRoiRowUi } from "@/app/analytics/_types/analytics-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type VehicleRoiTableProps = {
  rows: VehicleRoiRowUi[];
};

export function VehicleRoiTable({ rows }: VehicleRoiTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Deep vehicle ROI</CardTitle>
        <CardDescription>
          Per-vehicle revenue vs operational cost (fuel + maintenance). Sorted by ROI %.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No vehicle revenue or cost rows yet. Complete trips to populate ROI.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Op cost</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const net = Number(row.netInr) || 0;
                  return (
                    <TableRow key={row.vehicleId}>
                      <TableCell>
                        <div className="font-medium">{row.vehicleRegistration}</div>
                        <div className="text-xs text-muted-foreground">{row.vehicleNameModel}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(row.revenueInr)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(row.operationalCostInr)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          net >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {formatInr(row.netInr)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {row.roiPercent === null ? "—" : `${row.roiPercent}%`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
