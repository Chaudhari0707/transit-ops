import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { getDb } from "@/lib/db/client";
import { drivers, locations, trips, vehicles } from "@/lib/db/schema";
import type { FuelExpenseTripOption } from "@/modules/fuel-expenses/_types/fuel-expenses";

type DbClient = ReturnType<typeof getDb>;

const destinationLocations = alias(locations, "destination_locations");

export async function resolveTripLink(
  db: DbClient,
  tripId: string | null,
  vehicleId: string,
): Promise<string | null> {
  if (!tripId) {
    return null;
  }

  const [trip] = await db
    .select({
      id: trips.id,
      vehicleId: trips.vehicleId,
      status: trips.status,
      deletedAt: trips.deletedAt,
    })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);

  if (!trip || trip.deletedAt) {
    throw new Error("Trip not found");
  }

  if (trip.status !== "dispatched" && trip.status !== "completed") {
    throw new Error("Trip must be dispatched or completed to link fuel or expenses");
  }

  if (trip.vehicleId !== vehicleId) {
    throw new Error("Selected trip does not belong to this vehicle");
  }

  return trip.id;
}

/**
 * Trip picker rows for fuel/expense forms.
 * Labels: vehicle · date · destination · driver (never raw trip UUIDs).
 */
export async function fetchFuelExpenseTripOptions(db: DbClient): Promise<FuelExpenseTripOption[]> {
  const rows = await db
    .select({
      id: trips.id,
      vehicleId: trips.vehicleId,
      status: trips.status,
      createdAt: trips.createdAt,
      dispatchedAt: trips.dispatchedAt,
      completedAt: trips.completedAt,
      vehicleRegistration: vehicles.registrationNumber,
      vehicleNameModel: vehicles.nameModel,
      destinationName: destinationLocations.name,
      driverName: drivers.fullName,
    })
    .from(trips)
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .innerJoin(destinationLocations, eq(trips.destinationLocationId, destinationLocations.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(and(isNull(trips.deletedAt), inArray(trips.status, ["dispatched", "completed"])))
    .orderBy(desc(trips.createdAt))
    .limit(100);

  return rows.map((row) => {
    const tripDate = (row.completedAt ?? row.dispatchedAt ?? row.createdAt)
      .toISOString()
      .slice(0, 10);
    const status = row.status as "dispatched" | "completed";
    const label = `${row.vehicleRegistration} · ${tripDate} · ${row.destinationName} · ${row.driverName}`;

    return {
      id: row.id,
      vehicleId: row.vehicleId,
      vehicleRegistration: row.vehicleRegistration,
      vehicleNameModel: row.vehicleNameModel,
      destinationName: row.destinationName,
      driverName: row.driverName,
      tripDate,
      status,
      label,
    };
  });
}
