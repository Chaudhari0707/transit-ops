"use client";

import type { TripStatusFilter, VehicleTypeOption } from "@/app/dashboard/_types/dashboard-ui";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DashboardFiltersProps = {
  status: TripStatusFilter;
  vehicleTypeId: string;
  vehicleTypes: VehicleTypeOption[];
  onStatusChange: (value: TripStatusFilter) => void;
  onVehicleTypeChange: (value: string) => void;
};

const TRIP_STATUS_OPTIONS: { label: string; value: TripStatusFilter }[] = [
  { value: "all", label: "All statuses" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "dispatched", label: "Dispatched" },
  { value: "draft", label: "Draft" },
];

export function DashboardFilters({
  vehicleTypeId,
  status,
  vehicleTypes,
  onVehicleTypeChange,
  onStatusChange,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="grid gap-2">
        <Label htmlFor="trip-vehicle-type-filter">Vehicle type</Label>
        <Select
          value={vehicleTypeId}
          onValueChange={(value) => {
            if (value != null) {
              onVehicleTypeChange(value);
            }
          }}
        >
          <SelectTrigger id="trip-vehicle-type-filter" className="w-45">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {vehicleTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="trip-status-filter">Status</Label>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value != null) {
              onStatusChange(value as TripStatusFilter);
            }
          }}
        >
          <SelectTrigger id="trip-status-filter" className="w-45">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {TRIP_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
