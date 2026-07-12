"use client";

import * as React from "react";
import { Loader2Icon, XIcon } from "lucide-react";

import {
  emptyCreateTripForm,
  formatVehicleCapacityKg,
  formatVehicleOptionLabel,
  getCargoCapacityAlert,
  sortVehiclesByCapacity,
} from "@/app/trips/_lib/trip-form-helpers";
import { createTripSchema } from "@/app/trips/_lib/trip-form-schema";
import { createTrip, dispatchTrip, updateTrip } from "@/app/trips/_lib/trips-api";
import type { CreateTripFormValues } from "@/app/trips/_types/trip-form";
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
import { ApiError } from "@/lib/api/fetch-api";
import type { LocationRecord } from "@/modules/locations/_types/location";
import type {
  AssignableDriverRecord,
  AssignableVehicleRecord,
} from "@/modules/trips/_types/assignable";
import type { TripStatus } from "@/modules/trips/_types/trip";

type FieldErrors = Partial<Record<keyof CreateTripFormValues, string>>;

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase"
    >
      {children}
    </Label>
  );
}

function SelectLoadingItems({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 shrink-0 animate-spin" aria-hidden="true" />
      <span>Loading {label}…</span>
    </div>
  );
}

function SelectEmptyItems({ label }: { label: string }) {
  return <div className="px-2 py-3 text-sm text-muted-foreground">No {label} available</div>;
}

export function TripCreateForm({
  tripId,
  initialValues,
  lifecycleStatus,
  readOnly,
  optionsLoading,
  locations,
  vehicles,
  drivers,
  onClose,
  onCreated,
  onUpdated,
  onDispatched,
  onRequestCancel,
  onRequestComplete,
  onError,
}: {
  tripId: string | null;
  initialValues: CreateTripFormValues;
  lifecycleStatus: TripStatus | "new";
  readOnly: boolean;
  optionsLoading: boolean;
  locations: LocationRecord[];
  vehicles: AssignableVehicleRecord[];
  drivers: AssignableDriverRecord[];
  onClose: () => void;
  onCreated: () => void;
  onUpdated: () => void;
  onDispatched: () => void;
  onRequestCancel?: () => void;
  onRequestComplete?: () => void;
  onError: (message: string) => void;
}) {
  const [values, setValues] = React.useState<CreateTripFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const vehicleOptions = sortVehiclesByCapacity(vehicles);
  const selectedSource = locations.find((location) => location.id === values.sourceLocationId);
  const selectedDestination = locations.find(
    (location) => location.id === values.destinationLocationId,
  );
  const selectedVehicle = vehicleOptions.find((vehicle) => vehicle.id === values.vehicleId);
  const selectedDriver = drivers.find((driver) => driver.id === values.driverId);
  const locationItems = React.useMemo(
    () => locations.map((location) => ({ label: location.name, value: location.id })),
    [locations],
  );
  const vehicleItems = React.useMemo(
    () =>
      vehicleOptions.map((vehicle) => ({
        label: formatVehicleOptionLabel(vehicle),
        value: vehicle.id,
      })),
    [vehicleOptions],
  );
  const driverItems = React.useMemo(
    () => drivers.map((driver) => ({ label: driver.fullName, value: driver.id })),
    [drivers],
  );
  const capacityAlert = readOnly
    ? null
    : getCargoCapacityAlert(values.cargoWeightKg, selectedVehicle?.maxLoadCapacityKg);

  const parsed = createTripSchema.safeParse(values);
  const selectsDisabled = readOnly || optionsLoading;
  const canDispatch =
    !readOnly && !optionsLoading && parsed.success && !capacityAlert && !isSubmitting;
  const isNewTrip = lifecycleStatus === "new";
  const isDraftTrip = lifecycleStatus === "draft";
  const isDispatchedTrip = lifecycleStatus === "dispatched";

  function updateField<K extends keyof CreateTripFormValues>(
    key: K,
    value: CreateTripFormValues[K],
  ) {
    if (readOnly) {
      return;
    }

    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function persistDraft(): Promise<string | null> {
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key as keyof CreateTripFormValues]) {
          nextErrors[key as keyof CreateTripFormValues] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return null;
    }

    if (capacityAlert) {
      setFieldErrors({ cargoWeightKg: capacityAlert.message });
      return null;
    }

    if (tripId && isDraftTrip) {
      const updated = await updateTrip(tripId, parsed.data);
      onUpdated();
      return updated.trip.id;
    }

    const created = await createTrip(parsed.data);
    onCreated();
    return created.trip.id;
  }

  async function handleDispatch() {
    setIsSubmitting(true);

    try {
      const savedTripId = await persistDraft();
      if (!savedTripId) {
        return;
      }

      await dispatchTrip(savedTripId);
      setValues(emptyCreateTripForm());
      onDispatched();
      onClose();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to dispatch trip";
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    setIsSubmitting(true);

    try {
      const savedTripId = await persistDraft();
      if (!savedTripId) {
        return;
      }

      if (isNewTrip) {
        setValues(emptyCreateTripForm());
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to save trip";
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <div
          className="flex flex-col gap-2"
          data-invalid={fieldErrors.sourceLocationId ? true : undefined}
        >
          <FieldLabel htmlFor="trip-source">Source</FieldLabel>
          <Select
            items={locationItems}
            value={values.sourceLocationId || null}
            onValueChange={(value) => updateField("sourceLocationId", value ?? "")}
            disabled={selectsDisabled}
          >
            <SelectTrigger
              id="trip-source"
              className="w-full"
              aria-invalid={!!fieldErrors.sourceLocationId}
            >
              <SelectValue placeholder={optionsLoading ? "Loading locations…" : "Select source"}>
                {selectedSource?.name}
              </SelectValue>
              {optionsLoading ? (
                <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </SelectTrigger>
            <SelectContent>
              {optionsLoading ? (
                <SelectLoadingItems label="locations" />
              ) : locations.length === 0 ? (
                <SelectEmptyItems label="locations" />
              ) : (
                locations.map((location) => (
                  <SelectItem key={location.id} value={location.id} label={location.name}>
                    {location.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div
          className="flex flex-col gap-2"
          data-invalid={fieldErrors.destinationLocationId ? true : undefined}
        >
          <FieldLabel htmlFor="trip-destination">Destination</FieldLabel>
          <Select
            items={locationItems}
            value={values.destinationLocationId || null}
            onValueChange={(value) => updateField("destinationLocationId", value ?? "")}
            disabled={selectsDisabled}
          >
            <SelectTrigger
              id="trip-destination"
              className="w-full"
              aria-invalid={!!fieldErrors.destinationLocationId}
            >
              <SelectValue
                placeholder={optionsLoading ? "Loading locations…" : "Select destination"}
              >
                {selectedDestination?.name}
              </SelectValue>
              {optionsLoading ? (
                <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </SelectTrigger>
            <SelectContent>
              {optionsLoading ? (
                <SelectLoadingItems label="locations" />
              ) : locations.length === 0 ? (
                <SelectEmptyItems label="locations" />
              ) : (
                locations.map((location) => (
                  <SelectItem key={location.id} value={location.id} label={location.name}>
                    {location.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div
          className="flex flex-col gap-2"
          data-invalid={fieldErrors.vehicleId ? true : undefined}
        >
          <FieldLabel htmlFor="trip-vehicle">Vehicle (available only)</FieldLabel>
          <Select
            items={vehicleItems}
            value={values.vehicleId || null}
            onValueChange={(value) => updateField("vehicleId", value ?? "")}
            disabled={selectsDisabled}
          >
            <SelectTrigger
              id="trip-vehicle"
              className="w-full"
              aria-invalid={!!fieldErrors.vehicleId}
            >
              <SelectValue
                placeholder={optionsLoading ? "Loading vehicles…" : "Select vehicle by capacity"}
              >
                {selectedVehicle ? formatVehicleOptionLabel(selectedVehicle) : null}
              </SelectValue>
              {optionsLoading ? (
                <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </SelectTrigger>
            <SelectContent>
              {optionsLoading ? (
                <SelectLoadingItems label="vehicles" />
              ) : vehicleOptions.length === 0 ? (
                <SelectEmptyItems label="vehicles" />
              ) : (
                vehicleOptions.map((vehicle) => {
                  const label = formatVehicleOptionLabel(vehicle);
                  return (
                    <SelectItem key={vehicle.id} value={vehicle.id} label={label}>
                      {label}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
          <p className="min-h-4 text-xs text-muted-foreground">
            {selectedVehicle
              ? `Max load capacity: ${formatVehicleCapacityKg(selectedVehicle.maxLoadCapacityKg)}`
              : null}
          </p>
        </div>

        <div className="flex flex-col gap-2" data-invalid={fieldErrors.driverId ? true : undefined}>
          <FieldLabel htmlFor="trip-driver">Driver (available only)</FieldLabel>
          <Select
            items={driverItems}
            value={values.driverId || null}
            onValueChange={(value) => updateField("driverId", value ?? "")}
            disabled={selectsDisabled}
          >
            <SelectTrigger
              id="trip-driver"
              className="w-full"
              aria-invalid={!!fieldErrors.driverId}
            >
              <SelectValue placeholder={optionsLoading ? "Loading drivers…" : "Select driver"}>
                {selectedDriver?.fullName}
              </SelectValue>
              {optionsLoading ? (
                <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </SelectTrigger>
            <SelectContent>
              {optionsLoading ? (
                <SelectLoadingItems label="drivers" />
              ) : drivers.length === 0 ? (
                <SelectEmptyItems label="drivers" />
              ) : (
                drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id} label={driver.fullName}>
                    {driver.fullName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {/* Keeps driver column height in step with vehicle capacity helper */}
          <p className="min-h-4 text-xs" aria-hidden="true" />
        </div>

        <div
          className="flex flex-col gap-2"
          data-invalid={fieldErrors.cargoWeightKg ? true : undefined}
        >
          <FieldLabel htmlFor="trip-cargo">Cargo weight (kg)</FieldLabel>
          <Input
            id="trip-cargo"
            type="number"
            min="0.01"
            step="0.01"
            value={values.cargoWeightKg}
            onChange={(event) => updateField("cargoWeightKg", event.target.value)}
            aria-invalid={!!fieldErrors.cargoWeightKg || !!capacityAlert}
            disabled={readOnly}
          />
        </div>

        <div
          className="flex flex-col gap-2"
          data-invalid={fieldErrors.plannedDistanceKm ? true : undefined}
        >
          <FieldLabel htmlFor="trip-distance">Planned distance (km)</FieldLabel>
          <Input
            id="trip-distance"
            type="number"
            min="0.01"
            step="0.01"
            value={values.plannedDistanceKm}
            onChange={(event) => updateField("plannedDistanceKm", event.target.value)}
            aria-invalid={!!fieldErrors.plannedDistanceKm}
            disabled={readOnly}
          />
        </div>
      </div>

      {capacityAlert ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="font-medium">{capacityAlert.summary}</p>
          <p className="mt-1 flex items-center gap-1.5">
            <XIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {capacityAlert.message}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        {isNewTrip || isDraftTrip ? (
          <>
            <Button type="button" disabled={!canDispatch} onClick={() => void handleDispatch()}>
              {isSubmitting ? "Dispatching…" : "Dispatch"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!parsed.success || isSubmitting || readOnly || optionsLoading}
              onClick={() => void handleSaveDraft()}
            >
              Save draft
            </Button>
          </>
        ) : null}

        {isDispatchedTrip && onRequestComplete ? (
          <Button type="button" onClick={onRequestComplete}>
            Complete trip
          </Button>
        ) : null}

        {(isDraftTrip || isDispatchedTrip) && onRequestCancel ? (
          <Button type="button" variant="outline" onClick={onRequestCancel}>
            Cancel trip
          </Button>
        ) : null}

        <Button type="button" variant="ghost" className="ml-auto" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
