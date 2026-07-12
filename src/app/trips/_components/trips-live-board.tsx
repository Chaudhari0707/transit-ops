"use client";

import { PlusIcon } from "lucide-react";

import {
  formatRouteLabel,
  formatTripDisplayId,
  getTripBoardSubtitle,
} from "@/app/trips/_lib/trip-form-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TripRecord, TripStatus } from "@/modules/trips/_types/trip";

const statusVariant: Record<TripStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  dispatched: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const statusLabel: Record<TripStatus, string> = {
  draft: "Draft",
  dispatched: "Dispatched",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function TripsLiveBoard({
  trips,
  isLoading,
  onNewTrip,
  onSelectTrip,
}: {
  trips: TripRecord[];
  isLoading: boolean;
  onNewTrip: () => void;
  onSelectTrip: (trip: TripRecord) => void;
}) {
  return (
    <Card className="flex-1 border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border/60 pb-4">
        <CardTitle className="text-base font-semibold">Live board</CardTitle>
        <Button type="button" size="sm" onClick={onNewTrip}>
          <PlusIcon className="size-4" aria-hidden="true" />
          Add new trip
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading trips…</p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trips yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip, index) => {
              const subtitle = getTripBoardSubtitle(trip);

              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => onSelectTrip(trip)}
                  className="w-full rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {formatTripDisplayId(trip, index)}
                      </p>
                      <p className="text-sm text-foreground">
                        {formatRouteLabel(trip.sourceLocation.name, trip.destinationLocation.name)}
                      </p>
                    </div>
                    <Badge variant={statusVariant[trip.status]}>{statusLabel[trip.status]}</Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {trip.status === "dispatched" || trip.status === "completed" ? (
                      <p>
                        {trip.vehicle.registrationNumber} / {trip.driver.fullName}
                      </p>
                    ) : null}
                    {subtitle ? <p>{subtitle}</p> : null}
                    <p className="tabular-nums">
                      {trip.status === "dispatched" || trip.status === "completed"
                        ? `${trip.actualDistanceKm ?? trip.plannedDistanceKm} km`
                        : `${trip.plannedDistanceKm} km planned`}
                    </p>
                    {trip.status === "cancelled" && trip.cancelReason ? (
                      <p className="text-destructive">{trip.cancelReason}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
