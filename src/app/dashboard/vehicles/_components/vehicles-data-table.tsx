"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import {
  formatInr,
  formatKm,
  typeLabel,
  VEHICLE_STATUS_CLASS,
  VEHICLE_STATUS_LABEL,
} from "@/app/dashboard/vehicles/_lib/vehicle-helpers";
import type {
  VehicleListItem,
  VehicleTypeOption,
} from "@/app/dashboard/vehicles/_types/vehicles-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type VehiclesDataTableProps = {
  vehicles: VehicleListItem[];
  vehicleTypes: VehicleTypeOption[];
  canWrite: boolean;
  onEdit: (vehicle: VehicleListItem) => void;
  onRetire: (vehicle: VehicleListItem) => void;
  onDelete: (vehicle: VehicleListItem) => void;
};

export function VehiclesDataTable({
  vehicles,
  vehicleTypes,
  canWrite,
  onEdit,
  onRetire,
  onDelete,
}: VehiclesDataTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No vehicles match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reg no</TableHead>
            <TableHead>Name / model</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Capacity</TableHead>
            <TableHead className="text-right">Odometer</TableHead>
            <TableHead className="text-right">Acq. cost</TableHead>
            <TableHead>Status</TableHead>
            {canWrite ? <TableHead className="text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.registrationNumber}</TableCell>
              <TableCell>{vehicle.nameModel}</TableCell>
              <TableCell>{typeLabel(vehicleTypes, vehicle.vehicleTypeId)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {vehicle.maxLoadCapacityKg.toLocaleString("en-IN")} kg
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatKm(vehicle.odometerKm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatInr(vehicle.acquisitionCostInr)}
              </TableCell>
              <TableCell>
                <Badge className={VEHICLE_STATUS_CLASS[vehicle.status]}>
                  {VEHICLE_STATUS_LABEL[vehicle.status]}
                </Badge>
              </TableCell>
              {canWrite ? (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${vehicle.registrationNumber}`}
                      onClick={() => onEdit(vehicle)}
                    >
                      <PencilIcon />
                    </Button>
                    {vehicle.status !== "retired" && vehicle.status !== "on_trip" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onRetire(vehicle)}
                      >
                        Retire
                      </Button>
                    ) : null}
                    {vehicle.status !== "on_trip" ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${vehicle.registrationNumber}`}
                        onClick={() => onDelete(vehicle)}
                      >
                        <Trash2Icon />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
