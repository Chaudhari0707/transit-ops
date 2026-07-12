"use client";

import { TripsLiveBoard } from "@/app/trips/_components/trips-live-board";
import type { TripRecord } from "@/modules/trips/_types/trip";

export function TripsWorkspace({
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
    <TripsLiveBoard
      trips={trips}
      isLoading={isLoading}
      onNewTrip={onNewTrip}
      onSelectTrip={onSelectTrip}
    />
  );
}
