"use client";

import { TripsLiveBoard } from "@/app/trips/_components/trips-live-board";
import type { TripRecord } from "@/modules/trips/_types/trip";

export function TripsWorkspace({
  trips,
  isLoading,
  canWrite,
  onNewTrip,
  onSelectTrip,
}: {
  trips: TripRecord[];
  isLoading: boolean;
  canWrite: boolean;
  onNewTrip: () => void;
  onSelectTrip: (trip: TripRecord) => void;
}) {
  return (
    <TripsLiveBoard
      trips={trips}
      isLoading={isLoading}
      canWrite={canWrite}
      onNewTrip={onNewTrip}
      onSelectTrip={onSelectTrip}
    />
  );
}
