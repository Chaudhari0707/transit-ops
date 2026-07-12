"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { TripCompleteSheet } from "@/app/trips/_components/trip-complete-sheet";
import { TripFormDialog } from "@/app/trips/_components/trip-form-dialog";
import { TripsPageHeader } from "@/app/trips/_components/trips-page-header";
import { TripsWorkspace } from "@/app/trips/_components/trips-workspace";
import { cancelTrip, listTrips } from "@/app/trips/_lib/trips-api";
import type { ExpenseCategoryOption, TripFormSession } from "@/app/trips/_types/trip-form";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api/fetch-api";
import {
  isUnauthorizedErrorMessage,
  SESSION_EXPIRED_TOAST,
  toUserFacingApiError,
} from "@/lib/api/http-errors";
import type { TripRecord } from "@/modules/trips/_types/trip";

const OPEN_NEW_TRIP_EVENT = "transitops:open-new-trip";

function toastTripError(error: unknown, fallback: string): void {
  const raw = error instanceof ApiError ? error.message : fallback;
  if (error instanceof ApiError && error.status === 401) {
    toast.error(SESSION_EXPIRED_TOAST);
    window.location.assign("/sign-in");
    return;
  }
  if (isUnauthorizedErrorMessage(raw)) {
    toast.error(SESSION_EXPIRED_TOAST);
    window.location.assign("/sign-in");
    return;
  }
  toast.error(toUserFacingApiError(raw));
}

export function TripsPageClient({
  canWrite,
  expenseCategories,
}: {
  canWrite: boolean;
  expenseCategories: ExpenseCategoryOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tripDialog, setTripDialog] = React.useState<{
    open: boolean;
    session: TripFormSession | null;
  }>({ open: false, session: null });
  const [trips, setTrips] = React.useState<TripRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [completeTripTarget, setCompleteTripTarget] = React.useState<TripRecord | null>(null);
  const [completeSheetOpen, setCompleteSheetOpen] = React.useState(false);

  const filteredTrips = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return trips;
    }

    return trips.filter((trip) => {
      const haystack = [
        trip.id,
        trip.sourceLocation.name,
        trip.destinationLocation.name,
        trip.vehicle.registrationNumber,
        trip.driver.fullName,
        trip.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery, trips]);

  const openNewTrip = React.useCallback(() => {
    if (!canWrite) {
      toast.error(toUserFacingApiError("Forbidden"));
      return;
    }
    setTripDialog({ open: true, session: { kind: "new" } });
  }, [canWrite]);

  const openTrip = React.useCallback((trip: TripRecord) => {
    setTripDialog({ open: true, session: { kind: "trip", tripId: trip.id } });
  }, []);

  const closeTripDialog = React.useCallback(() => {
    setTripDialog({ open: false, session: null });
  }, []);

  const loadWorkspace = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const tripResponse = await listTrips();
      setTrips(tripResponse.trips);
    } catch (error) {
      toastTripError(error, "Unable to load trips");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  React.useEffect(() => {
    if (searchParams.get("new") !== "1") {
      return;
    }

    if (canWrite) {
      openNewTrip();
    }
    router.replace("/trips");
  }, [canWrite, openNewTrip, router, searchParams]);

  React.useEffect(() => {
    if (!canWrite) {
      return;
    }

    function handleOpenNewTrip() {
      openNewTrip();
    }

    window.addEventListener(OPEN_NEW_TRIP_EVENT, handleOpenNewTrip);
    return () => window.removeEventListener(OPEN_NEW_TRIP_EVENT, handleOpenNewTrip);
  }, [canWrite, openNewTrip]);

  async function runTripAction(action: () => Promise<unknown>, successMessage: string) {
    if (!canWrite) {
      toast.error(toUserFacingApiError("Forbidden"));
      return;
    }

    try {
      await action();
      toast.success(successMessage);
      closeTripDialog();
      await loadWorkspace();
    } catch (error) {
      toastTripError(error, "Trip action failed");
    }
  }

  return (
    <>
      <TripsPageHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex min-h-[calc(100vh-var(--header-height))] flex-1 flex-col p-4 md:p-6">
        <TripsWorkspace
          trips={filteredTrips}
          isLoading={isLoading}
          canWrite={canWrite}
          onNewTrip={openNewTrip}
          onSelectTrip={openTrip}
        />
      </div>

      <TripFormDialog
        open={tripDialog.open}
        session={tripDialog.session}
        canWrite={canWrite}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeTripDialog();
          }
        }}
        trips={trips}
        onRefresh={() => void loadWorkspace()}
        onRequestComplete={(trip) => {
          if (!canWrite) {
            toast.error(toUserFacingApiError("Forbidden"));
            return;
          }
          closeTripDialog();
          setCompleteTripTarget(trip);
          setCompleteSheetOpen(true);
        }}
        onRequestCancel={(tripId) => void runTripAction(() => cancelTrip(tripId), "Trip cancelled")}
        onError={(message) => toast.error(toUserFacingApiError(message))}
      />

      <TripCompleteSheet
        trip={completeTripTarget}
        expenseCategories={expenseCategories}
        open={completeSheetOpen}
        onOpenChange={setCompleteSheetOpen}
        onCompleted={() => {
          toast.success("Trip completed");
          void loadWorkspace();
        }}
        onError={(message) => toast.error(toUserFacingApiError(message))}
      />
      <Toaster richColors closeButton />
    </>
  );
}
