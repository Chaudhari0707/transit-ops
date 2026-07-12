"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardFilters() {
  return (
    <div className="flex flex-wrap items-end gap-4 px-4 lg:px-6">
      <div className="grid gap-2">
        <Label htmlFor="vehicle-type-filter">Vehicle type</Label>
        <Select defaultValue="all">
          <SelectTrigger id="vehicle-type-filter" className="w-45">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="van">Light Van</SelectItem>
            <SelectItem value="truck">Heavy Truck</SelectItem>
            <SelectItem value="reefer">Refrigerated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="vehicle-status-filter">Status</Label>
        <Select defaultValue="all">
          <SelectTrigger id="vehicle-status-filter" className="w-45">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on_trip">On Trip</SelectItem>
            <SelectItem value="in_shop">In Shop</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
