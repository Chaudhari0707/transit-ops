import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { getDb } from "@/lib/db/client";
import { drivers, locations, trips, vehicles } from "@/lib/db/schema";

const destinationLocations = alias(locations, "destination_locations");

type DbClient = ReturnType<typeof getDb>;

export async function fetchTripBundle(db: DbClient, tripId: string) {
  const [row] = await db
    .select({
      trip: trips,
      sourceLocation: {
        id: locations.id,
        code: locations.code,
        name: locations.name,
      },
      destinationLocation: {
        id: destinationLocations.id,
        code: destinationLocations.code,
        name: destinationLocations.name,
      },
      vehicle: {
        id: vehicles.id,
        maxLoadCapacityKg: vehicles.maxLoadCapacityKg,
        registrationNumber: vehicles.registrationNumber,
        nameModel: vehicles.nameModel,
      },
      driver: {
        id: drivers.id,
        fullName: drivers.fullName,
      },
    })
    .from(trips)
    .innerJoin(locations, eq(trips.sourceLocationId, locations.id))
    .innerJoin(destinationLocations, eq(trips.destinationLocationId, destinationLocations.id))
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(and(eq(trips.id, tripId), sql`${trips.deletedAt} is null`))
    .limit(1);

  if (!row) {
    throw new Error("Trip not found");
  }

  return row;
}

export async function fetchTripList(db: DbClient, status?: (typeof trips.$inferSelect)["status"]) {
  const conditions = [sql`${trips.deletedAt} is null`];

  if (status) {
    conditions.push(eq(trips.status, status));
  }

  return db
    .select({
      trip: trips,
      sourceLocation: {
        id: locations.id,
        code: locations.code,
        name: locations.name,
      },
      destinationLocation: {
        id: destinationLocations.id,
        code: destinationLocations.code,
        name: destinationLocations.name,
      },
      vehicle: {
        id: vehicles.id,
        maxLoadCapacityKg: vehicles.maxLoadCapacityKg,
        registrationNumber: vehicles.registrationNumber,
        nameModel: vehicles.nameModel,
      },
      driver: {
        id: drivers.id,
        fullName: drivers.fullName,
      },
    })
    .from(trips)
    .innerJoin(locations, eq(trips.sourceLocationId, locations.id))
    .innerJoin(destinationLocations, eq(trips.destinationLocationId, destinationLocations.id))
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(and(...conditions))
    .orderBy(sql`${trips.createdAt} desc`);
}
