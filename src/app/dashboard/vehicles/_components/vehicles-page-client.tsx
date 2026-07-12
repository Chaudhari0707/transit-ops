"use client";

import { startTransition, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { VehicleFormSheet } from "@/app/dashboard/vehicles/_components/vehicle-form-sheet";
import { VehiclesDataTable } from "@/app/dashboard/vehicles/_components/vehicles-data-table";
import {
  toCreateBody,
  toUpdateBody,
  VEHICLE_STATUS_OPTIONS,
  vehicleTypeSelectItems,
} from "@/app/dashboard/vehicles/_lib/vehicle-helpers";
import {
  createVehicle,
  fetchVehicles,
  retireVehicle,
  softDeleteVehicle,
  updateVehicle,
} from "@/app/dashboard/vehicles/_lib/vehicles-api";
import type {
  VehicleFormParsed,
  VehicleListItem,
  VehiclesPageClientProps,
  VehicleStatus,
} from "@/app/dashboard/vehicles/_types/vehicles-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VehiclesPageClient({ vehicleTypes, canWrite }: VehiclesPageClientProps) {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<VehicleListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const typeFilterItems = [
    { value: "all", label: "All types" },
    ...vehicleTypeSelectItems(vehicleTypes),
  ];
  const statusFilterItems = [
    { value: "all", label: "All statuses" },
    ...VEHICLE_STATUS_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const items = await fetchVehicles({
          vehicleTypeId: typeFilter,
          status: statusFilter,
        });

        if (!cancelled) {
          setVehicles(items);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load vehicles");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    startTransition(() => {
      void load();
    });

    return () => {
      cancelled = true;
    };
  }, [typeFilter, statusFilter]);

  async function reload() {
    setLoading(true);

    try {
      const items = await fetchVehicles({
        vehicleTypeId: typeFilter,
        status: statusFilter,
      });
      setVehicles(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setSheetMode("create");
    setSelected(null);
    setSheetOpen(true);
  }

  function openEdit(vehicle: VehicleListItem) {
    setSheetMode("edit");
    setSelected(vehicle);
    setSheetOpen(true);
  }

  async function handleSubmit(values: VehicleFormParsed) {
    setSubmitting(true);

    try {
      if (sheetMode === "create") {
        await createVehicle(toCreateBody(values));
        toast.success("Vehicle created");
      } else if (selected) {
        await updateVehicle(selected.id, toUpdateBody(values));
        toast.success("Vehicle updated");
      }

      setSheetOpen(false);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetire(vehicle: VehicleListItem) {
    try {
      await retireVehicle(vehicle.id);
      toast.success(`${vehicle.registrationNumber} retired`);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retire failed");
    }
  }

  async function handleDelete(vehicle: VehicleListItem) {
    try {
      await softDeleteVehicle(vehicle.id);
      toast.success(`${vehicle.registrationNumber} deleted`);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="space-y-2 px-4 lg:px-6">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Registration numbers must be unique. Vehicles with status <strong>Retired</strong> or{" "}
          <strong>In Shop</strong> are hidden from trip dispatch.
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="filter-type">Vehicle type</Label>
              <Select
                value={typeFilter}
                items={typeFilterItems}
                onValueChange={(value) => {
                  if (value) setTypeFilter(value);
                }}
              >
                <SelectTrigger id="filter-type" className="w-48">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {typeFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select
                value={statusFilter}
                items={statusFilterItems}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value as VehicleStatus | "all");
                }}
              >
                <SelectTrigger id="filter-status" className="w-44">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {canWrite ? (
            <Button type="button" onClick={openCreate}>
              <PlusIcon />
              Add Vehicle
            </Button>
          ) : null}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            Loading vehicles…
          </div>
        ) : (
          <VehiclesDataTable
            vehicles={vehicles}
            vehicleTypes={vehicleTypes}
            canWrite={canWrite}
            onEdit={openEdit}
            onRetire={handleRetire}
            onDelete={handleDelete}
          />
        )}
      </div>

      {canWrite ? (
        <VehicleFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          mode={sheetMode}
          vehicleTypes={vehicleTypes}
          vehicle={selected}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
