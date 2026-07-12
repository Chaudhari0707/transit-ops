"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { TripCompleteSheet } from "@/app/trips/_components/trip-complete-sheet";
import { TripFormDialog } from "@/app/trips/_components/trip-form-dialog";
import { TripsPageHeader } from "@/app/trips/_components/trips-page-header";
import { TripsSignInCard } from "@/app/trips/_components/trips-sign-in-card";
import { TripsWorkspace } from "@/app/trips/_components/trips-workspace";
import {
  cancelTrip,
  listAssignableDrivers,
  listAssignableVehicles,
  listLocations,
  listTrips,
} from "@/app/trips/_lib/trips-api";
import type { ExpenseCategoryOption, TripFormSession } from "@/app/trips/_types/trip-form";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api/fetch-api";
import type { LocationRecord } from "@/modules/locations/_types/location";
import type {
  AssignableDriverRecord,
  AssignableVehicleRecord,
} from "@/modules/trips/_types/assignable";
import type { TripRecord } from "@/modules/trips/_types/trip";

const OPEN_NEW_TRIP_EVENT = "transitops:open-new-trip";

export function TripsPageClient({
  expenseCategories,
}: {
  expenseCategories: ExpenseCategoryOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [needsSignIn, setNeedsSignIn] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tripDialog, setTripDialog] = React.useState<{
    open: boolean;
    session: TripFormSession | null;
  }>({ open: false, session: null });
  const [locations, setLocations] = React.useState<LocationRecord[]>([]);
  const [vehicles, setVehicles] = React.useState<AssignableVehicleRecord[]>([]);
  const [drivers, setDrivers] = React.useState<AssignableDriverRecord[]>([]);
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
    setTripDialog({ open: true, session: { kind: "new" } });
  }, []);

  const openTrip = React.useCallback((trip: TripRecord) => {
    setTripDialog({ open: true, session: { kind: "trip", tripId: trip.id } });
  }, []);

  const closeTripDialog = React.useCallback(() => {
    setTripDialog({ open: false, session: null });
  }, []);

  const loadWorkspace = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const [locationResponse, vehicleResponse, driverResponse, tripResponse] = await Promise.all([
        listLocations(),
        listAssignableVehicles(),
        listAssignableDrivers(),
        listTrips(),
      ]);

      setNeedsSignIn(false);
      setLocations(locationResponse.locations);
      setVehicles(vehicleResponse.vehicles);
      setDrivers(driverResponse.drivers);
      setTrips(tripResponse.trips);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setNeedsSignIn(true);
        return;
      }

      const message = error instanceof ApiError ? error.message : "Unable to load trips";
      toast.error(message);
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

    openNewTrip();
    router.replace("/trips");
  }, [openNewTrip, router, searchParams]);

  React.useEffect(() => {
    function handleOpenNewTrip() {
      openNewTrip();
    }

    window.addEventListener(OPEN_NEW_TRIP_EVENT, handleOpenNewTrip);
    return () => window.removeEventListener(OPEN_NEW_TRIP_EVENT, handleOpenNewTrip);
  }, [openNewTrip]);

  async function runTripAction(
    tripId: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    try {
      await action();
      toast.success(successMessage);
      closeTripDialog();
      await loadWorkspace();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Trip action failed";
      toast.error(message);
    }
  }

  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <TripsPageHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="flex min-h-[calc(100vh-var(--header-height))] flex-1 flex-col p-4 md:p-6">
            {needsSignIn ? (
              <TripsSignInCard onSignedIn={() => void loadWorkspace()} />
            ) : (
              <TripsWorkspace
                trips={filteredTrips}
                isLoading={isLoading}
                onNewTrip={openNewTrip}
                onSelectTrip={openTrip}
              />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <TripFormDialog
        open={tripDialog.open}
        session={tripDialog.session}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeTripDialog();
          }
        }}
        trips={trips}
        locations={locations}
        vehicles={vehicles}
        drivers={drivers}
        onRefresh={() => void loadWorkspace()}
        onRequestComplete={(trip) => {
          closeTripDialog();
          setCompleteTripTarget(trip);
          setCompleteSheetOpen(true);
        }}
        onRequestCancel={(tripId) =>
          void runTripAction(tripId, () => cancelTrip(tripId), "Trip cancelled")
        }
        onError={(message) => toast.error(message)}
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
        onError={(message) => toast.error(message)}
      />
      <Toaster richColors closeButton />
    </>
  );
}
