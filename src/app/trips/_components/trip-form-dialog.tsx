"use client";

import { TripCreateForm } from "@/app/trips/_components/trip-create-form";
import { TripLifecycleSteps } from "@/app/trips/_components/trip-lifecycle-steps";
import { emptyCreateTripForm, tripToFormValues } from "@/app/trips/_lib/trip-form-helpers";
import { mergeDriverOptions, mergeVehicleOptions } from "@/app/trips/_lib/trip-form-options";
import type { TripFormSession } from "@/app/trips/_types/trip-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LocationRecord } from "@/modules/locations/_types/location";
import type {
  AssignableDriverRecord,
  AssignableVehicleRecord,
} from "@/modules/trips/_types/assignable";
import type { TripRecord } from "@/modules/trips/_types/trip";

export function TripFormDialog({
  open,
  session,
  trips,
  locations,
  vehicles,
  drivers,
  onOpenChange,
  onRefresh,
  onRequestComplete,
  onRequestCancel,
  onError,
}: {
  open: boolean;
  session: TripFormSession | null;
  trips: TripRecord[];
  locations: LocationRecord[];
  vehicles: AssignableVehicleRecord[];
  drivers: AssignableDriverRecord[];
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onRequestComplete?: (trip: TripRecord) => void;
  onRequestCancel?: (tripId: string) => void;
  onError: (message: string) => void;
}) {
  const activeTrip =
    session?.kind === "trip" ? (trips.find((trip) => trip.id === session.tripId) ?? null) : null;

  const vehicleOptions = mergeVehicleOptions(vehicles, activeTrip);
  const driverOptions = mergeDriverOptions(drivers, activeTrip);
  const initialValues =
    session?.kind === "trip" && activeTrip ? tripToFormValues(activeTrip) : emptyCreateTripForm();
  const lifecycleStatus = activeTrip?.status ?? "new";
  const isNewTrip = lifecycleStatus === "new";
  const title = isNewTrip ? "Create trip" : "Trip details";
  const description = isNewTrip
    ? "Assign route, vehicle, driver, and cargo."
    : activeTrip?.status === "draft"
      ? "Edit draft fields or dispatch when ready."
      : activeTrip?.status === "dispatched"
        ? "Review trip details and complete or cancel."
        : "Trip record (read-only).";

  if (!open || !session) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <TripLifecycleSteps activeStatus={lifecycleStatus} />

        <TripCreateForm
          key={session.kind === "trip" ? session.tripId : "new"}
          tripId={activeTrip?.id ?? null}
          initialValues={initialValues}
          lifecycleStatus={lifecycleStatus}
          readOnly={activeTrip ? activeTrip.status !== "draft" : false}
          locations={locations}
          vehicles={vehicleOptions}
          drivers={driverOptions}
          onClose={() => onOpenChange(false)}
          onCreated={onRefresh}
          onDispatched={onRefresh}
          onUpdated={onRefresh}
          onRequestComplete={
            activeTrip && onRequestComplete ? () => onRequestComplete(activeTrip) : undefined
          }
          onRequestCancel={
            activeTrip &&
            (activeTrip.status === "draft" || activeTrip.status === "dispatched") &&
            onRequestCancel
              ? () => onRequestCancel(activeTrip.id)
              : undefined
          }
          onError={onError}
        />
      </DialogContent>
    </Dialog>
  );
}
