"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import {
  emptyVehicleFormDefaults,
  vehicleToFormDefaults,
  vehicleTypeSelectItems,
} from "@/app/dashboard/vehicles/_lib/vehicle-helpers";
import { vehicleFormSchema } from "@/app/dashboard/vehicles/_lib/vehicle-schema";
import type {
  VehicleFormParsed,
  VehicleFormValues,
  VehicleListItem,
  VehicleTypeOption,
} from "@/app/dashboard/vehicles/_types/vehicles-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type VehicleFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  vehicleTypes: VehicleTypeOption[];
  vehicle: VehicleListItem | null;
  submitting: boolean;
  onSubmit: (values: VehicleFormParsed) => Promise<void>;
};

export function VehicleFormSheet({
  open,
  onOpenChange,
  mode,
  vehicleTypes,
  vehicle,
  submitting,
  onSubmit,
}: VehicleFormSheetProps) {
  const defaultTypeId = vehicleTypes[0]?.id ?? "";
  const typeItems = vehicleTypeSelectItems(vehicleTypes);
  const form = useForm<VehicleFormValues, unknown, VehicleFormParsed>({
    resolver: zodResolver(vehicleFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: emptyVehicleFormDefaults(defaultTypeId),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!open) return;

    reset(vehicle ? vehicleToFormDefaults(vehicle) : emptyVehicleFormDefaults(defaultTypeId));
  }, [open, vehicle, defaultTypeId, reset]);

  const saveDisabled = submitting || isSubmitting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add vehicle" : "Edit vehicle"}</SheetTitle>
          <SheetDescription>
            Registration must be unique. Retired and in-shop vehicles are hidden from dispatch.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="registrationNumber">Registration number</Label>
            <Input
              id="registrationNumber"
              aria-invalid={Boolean(errors.registrationNumber)}
              {...register("registrationNumber")}
            />
            {errors.registrationNumber ? (
              <p className="text-sm text-destructive">{errors.registrationNumber.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nameModel">Name / model</Label>
            <Input
              id="nameModel"
              aria-invalid={Boolean(errors.nameModel)}
              {...register("nameModel")}
            />
            {errors.nameModel ? (
              <p className="text-sm text-destructive">{errors.nameModel.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vehicleTypeId">Vehicle type</Label>
            <Controller
              control={control}
              name="vehicleTypeId"
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  items={typeItems}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id="vehicleTypeId"
                    className="w-full"
                    aria-invalid={Boolean(errors.vehicleTypeId)}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeItems.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vehicleTypeId ? (
              <p className="text-sm text-destructive">{errors.vehicleTypeId.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxLoadCapacityKg">Max load (kg)</Label>
            <Input
              id="maxLoadCapacityKg"
              type="number"
              step="0.01"
              aria-invalid={Boolean(errors.maxLoadCapacityKg)}
              {...register("maxLoadCapacityKg")}
            />
            {errors.maxLoadCapacityKg ? (
              <p className="text-sm text-destructive">{errors.maxLoadCapacityKg.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="odometerKm">Odometer (km)</Label>
            <Input
              id="odometerKm"
              type="number"
              step="0.1"
              aria-invalid={Boolean(errors.odometerKm)}
              {...register("odometerKm")}
            />
            {errors.odometerKm ? (
              <p className="text-sm text-destructive">{errors.odometerKm.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="acquisitionCostInr">Acquisition cost (INR)</Label>
            <Input
              id="acquisitionCostInr"
              type="number"
              step="0.01"
              aria-invalid={Boolean(errors.acquisitionCostInr)}
              {...register("acquisitionCostInr")}
            />
            {errors.acquisitionCostInr ? (
              <p className="text-sm text-destructive">{errors.acquisitionCostInr.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" aria-invalid={Boolean(errors.notes)} {...register("notes")} />
            {errors.notes ? (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            ) : null}
          </div>

          <SheetFooter className="sticky bottom-0 border-t bg-popover px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveDisabled}>
              {submitting || isSubmitting
                ? "Saving…"
                : mode === "create"
                  ? "Create vehicle"
                  : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
