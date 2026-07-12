"use client";

import { useMemo } from "react";

import type {
  MaintenanceFormState,
  MaintenanceTypeOption,
  MaintenanceVehicleOption,
} from "@/app/maintenance/_types/maintenance-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Base UI Select falls back to raw value (UUID) until the option label is resolved. */
function selectValue(id: string, resolvedLabel: string | null | undefined): string | null {
  if (!id || !resolvedLabel) {
    return null;
  }
  return id;
}

function vehicleLabel(vehicle: MaintenanceVehicleOption): string {
  return `${vehicle.nameModel} · ${vehicle.registrationNumber}`;
}

type MaintenanceLogFormProps = {
  disabled: boolean;
  form: MaintenanceFormState;
  onChange: (next: MaintenanceFormState) => void;
  onSubmit: () => void;
  submitting: boolean;
  types: MaintenanceTypeOption[];
  vehicles: MaintenanceVehicleOption[];
};

export function MaintenanceLogForm({
  disabled,
  form,
  onChange,
  onSubmit,
  submitting,
  types,
  vehicles,
}: MaintenanceLogFormProps) {
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId);
  const selectedType = types.find((type) => type.id === form.maintenanceTypeId);
  const vehicleText = selectedVehicle ? vehicleLabel(selectedVehicle) : undefined;
  const typeText = selectedType?.name;
  const isOtherType = selectedType?.code.toUpperCase() === "OTHER";

  const vehicleItems = useMemo(
    () => vehicles.map((vehicle) => ({ label: vehicleLabel(vehicle), value: vehicle.id })),
    [vehicles],
  );
  const typeItems = useMemo(
    () => types.map((type) => ({ label: type.name, value: type.id })),
    [types],
  );

  const canSubmit =
    !disabled &&
    !submitting &&
    form.vehicleId.length > 0 &&
    form.maintenanceTypeId.length > 0 &&
    vehicles.length > 0 &&
    (!isOtherType || form.customServiceType.trim().length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log service</CardTitle>
        <CardDescription>
          Opening maintenance sets the vehicle to In Shop and removes it from the dispatch pool
          (BR-10). Choose <strong>Other</strong> to type a custom service type.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="maint-vehicle">Vehicle</Label>
          <Select
            items={vehicleItems}
            value={selectValue(form.vehicleId, vehicleText)}
            onValueChange={(value) => {
              if (value) onChange({ ...form, vehicleId: value });
            }}
            disabled={disabled || vehicles.length === 0}
          >
            <SelectTrigger id="maint-vehicle" className="w-full">
              <SelectValue
                placeholder={
                  vehicles.length === 0
                    ? "No available vehicles"
                    : disabled
                      ? "Loading…"
                      : "Select vehicle"
                }
              >
                {vehicleText}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => {
                const label = vehicleLabel(vehicle);
                return (
                  <SelectItem key={vehicle.id} value={vehicle.id} label={label}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maint-type">Service type</Label>
          <Select
            items={typeItems}
            value={selectValue(form.maintenanceTypeId, typeText)}
            onValueChange={(value) => {
              if (!value) return;
              onChange({
                ...form,
                maintenanceTypeId: value,
                // Clear custom label when leaving Other
                customServiceType:
                  types.find((type) => type.id === value)?.code.toUpperCase() === "OTHER"
                    ? form.customServiceType
                    : "",
              });
            }}
            disabled={disabled || types.length === 0}
          >
            <SelectTrigger id="maint-type" className="w-full">
              <SelectValue placeholder={types.length === 0 ? "Loading…" : "Select type"}>
                {typeText}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id} label={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isOtherType ? (
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="maint-custom-type">Custom service type</Label>
            <Input
              id="maint-custom-type"
              disabled={disabled}
              value={form.customServiceType}
              onChange={(event) => onChange({ ...form, customServiceType: event.target.value })}
              placeholder="e.g. AC compressor repair, battery replacement…"
              maxLength={120}
              required
              aria-required
            />
            <p className="text-xs text-muted-foreground">
              Required when service type is Other. This label is saved on the maintenance log.
            </p>
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="maint-cost">Cost (INR)</Label>
          <Input
            id="maint-cost"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            disabled={disabled}
            value={form.costInr}
            onChange={(event) => onChange({ ...form, costInr: event.target.value })}
            placeholder="0"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="maint-vendor">Vendor</Label>
          <Input
            id="maint-vendor"
            disabled={disabled}
            value={form.vendorName}
            onChange={(event) => onChange({ ...form, vendorName: event.target.value })}
            placeholder="Workshop name"
            maxLength={160}
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="maint-notes">Notes</Label>
          <Input
            id="maint-notes"
            disabled={disabled}
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            placeholder="Optional extra details"
          />
        </div>

        <div className="md:col-span-2">
          <Button type="button" disabled={!canSubmit} onClick={onSubmit}>
            {submitting ? "Logging…" : "Log service"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
