import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import type { SessionUser } from "@/lib/api/_types/session";
import { requireAnyRole } from "@/lib/api/session";
import { getDb } from "@/lib/db/client";
import { drivers, expenses, fuelLogs, locations, trips, vehicles } from "@/lib/db/schema";
import {
  fetchAssignableDrivers,
  fetchAssignableVehicles,
} from "@/modules/trips/_lib/assignable-queries";
import {
  assertCargoWithinCapacity,
  assertDriverAssignable,
  assertEndOdometerValid,
  assertPositiveFuel,
  assertTripExpensesPresent,
  assertVehicleDispatchable,
} from "@/modules/trips/_lib/dispatch-rules";
import { assertDifferentLocations } from "@/modules/trips/_lib/trip-locations";
import { toTripRecord } from "@/modules/trips/_lib/trip-mapper";
import { fetchTripBundle, fetchTripList } from "@/modules/trips/_lib/trip-queries";
import {
  canCancelTrip,
  canCompleteTrip,
  canDispatchTrip,
  canEditTrip,
} from "@/modules/trips/_lib/trip-status";
import type { TripStatus } from "@/modules/trips/_types/trip";

const TRIP_READ_ROLES = ["dispatcher", "safety_officer", "fleet_manager"] as const;
const TRIP_WRITE_ROLES = ["dispatcher"] as const;

type TripInput = {
  sourceLocationId: string;
  destinationLocationId: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapTripBundle(bundle: Awaited<ReturnType<typeof fetchTripBundle>>) {
  return toTripRecord(bundle.trip, bundle.sourceLocation, bundle.destinationLocation);
}

async function requireActiveLocations(sourceLocationId: string, destinationLocationId: string) {
  assertDifferentLocations(sourceLocationId, destinationLocationId);

  const rows = await getDb()
    .select({
      id: locations.id,
      code: locations.code,
      name: locations.name,
    })
    .from(locations)
    .where(
      and(
        eq(locations.isActive, true),
        sql`${locations.deletedAt} is null`,
        inArray(locations.id, [sourceLocationId, destinationLocationId]),
      ),
    );

  const sourceLocation = rows.find((row) => row.id === sourceLocationId);
  const destinationLocation = rows.find((row) => row.id === destinationLocationId);

  if (!sourceLocation || !destinationLocation) {
    throw new Error("Source or destination location not found");
  }

  return { sourceLocation, destinationLocation };
}

export abstract class TripsService {
  static async listAssignableVehicles(actor: SessionUser) {
    requireAnyRole(actor, TRIP_WRITE_ROLES);

    const rows = await fetchAssignableVehicles(getDb());

    return {
      vehicles: rows.map((row) => ({
        id: row.id,
        registrationNumber: row.registrationNumber,
        nameModel: row.nameModel,
        maxLoadCapacityKg: row.maxLoadCapacityKg,
        odometerKm: row.odometerKm,
        status: row.status as "available",
      })),
    };
  }

  static async listAssignableDrivers(actor: SessionUser) {
    requireAnyRole(actor, TRIP_WRITE_ROLES);

    const rows = await fetchAssignableDrivers(getDb(), todayIsoDate());

    return {
      drivers: rows.map((row) => ({
        id: row.id,
        fullName: row.fullName,
        licenseNumber: row.licenseNumber,
        licenseExpiryDate: row.licenseExpiryDate,
        contactNumber: row.contactNumber,
        safetyScore: row.safetyScore,
        status: row.status as "available",
      })),
    };
  }

  static async list(actor: SessionUser, status?: TripStatus) {
    requireAnyRole(actor, TRIP_READ_ROLES);

    const rows = await fetchTripList(getDb(), status);

    return {
      trips: rows.map((row) => toTripRecord(row.trip, row.sourceLocation, row.destinationLocation)),
    };
  }

  static async getById(actor: SessionUser, tripId: string) {
    requireAnyRole(actor, TRIP_READ_ROLES);
    const bundle = await fetchTripBundle(getDb(), tripId);
    return { trip: mapTripBundle(bundle) };
  }

  static async create(actor: SessionUser, input: TripInput) {
    requireAnyRole(actor, TRIP_WRITE_ROLES);
    const { sourceLocation, destinationLocation } = await requireActiveLocations(
      input.sourceLocationId,
      input.destinationLocationId,
    );

    const [created] = await getDb()
      .insert(trips)
      .values({
        status: "draft",
        sourceLocationId: input.sourceLocationId,
        destinationLocationId: input.destinationLocationId,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        cargoWeightKg: input.cargoWeightKg.toFixed(2),
        plannedDistanceKm: input.plannedDistanceKm.toFixed(2),
        createdByUserId: actor.id,
      })
      .returning();

    if (!created) {
      throw new Error("Unable to create trip");
    }

    return {
      trip: toTripRecord(created, sourceLocation, destinationLocation),
    };
  }

  static async update(actor: SessionUser, tripId: string, input: TripInput) {
    requireAnyRole(actor, TRIP_WRITE_ROLES);

    const bundle = await fetchTripBundle(getDb(), tripId);

    if (!canEditTrip(bundle.trip.status)) {
      throw new Error("Only draft trips can be edited");
    }

    const { sourceLocation, destinationLocation } = await requireActiveLocations(
      input.sourceLocationId,
      input.destinationLocationId,
    );

    const [updated] = await getDb()
      .update(trips)
      .set({
        sourceLocationId: input.sourceLocationId,
        destinationLocationId: input.destinationLocationId,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        cargoWeightKg: input.cargoWeightKg.toFixed(2),
        plannedDistanceKm: input.plannedDistanceKm.toFixed(2),
        updatedAt: sql`now()`,
      })
      .where(eq(trips.id, tripId))
      .returning();

    if (!updated) {
      throw new Error("Trip not found");
    }

    return {
      trip: toTripRecord(updated, sourceLocation, destinationLocation),
    };
  }

  static async dispatch(actor: SessionUser, tripId: string) {
    requireAnyRole(actor, TRIP_WRITE_ROLES);

    await getDb().transaction(async (tx) => {
      const [tripRow] = await tx
        .select()
        .from(trips)
        .where(and(eq(trips.id, tripId), sql`${trips.deletedAt} is null`))
        .limit(1);

      if (!tripRow) {
        throw new Error("Trip not found");
      }

      if (!canDispatchTrip(tripRow.status)) {
        throw new Error("Only draft trips can be dispatched");
      }

      const [vehicleRow] = await tx
        .select()
        .from(vehicles)
        .where(and(eq(vehicles.id, tripRow.vehicleId), sql`${vehicles.deletedAt} is null`))
        .limit(1);

      if (!vehicleRow) {
        throw new Error("Vehicle not found");
      }

      const [driverRow] = await tx
        .select()
        .from(drivers)
        .where(and(eq(drivers.id, tripRow.driverId), sql`${drivers.deletedAt} is null`))
        .limit(1);

      if (!driverRow) {
        throw new Error("Driver not found");
      }

      assertVehicleDispatchable({
        status: vehicleRow.status,
        maxLoadCapacityKg: Number(vehicleRow.maxLoadCapacityKg),
      });

      assertDriverAssignable(
        {
          status: driverRow.status,
          licenseExpiryDate: driverRow.licenseExpiryDate,
        },
        todayIsoDate(),
      );

      assertCargoWithinCapacity(
        Number(tripRow.cargoWeightKg),
        Number(vehicleRow.maxLoadCapacityKg),
      );

      await tx
        .update(trips)
        .set({
          status: "dispatched",
          startOdometerKm: vehicleRow.odometerKm,
          dispatchedAt: new Date(),
          updatedAt: sql`now()`,
        })
        .where(eq(trips.id, tripId));

      await tx
        .update(vehicles)
        .set({ status: "on_trip", updatedAt: sql`now()` })
        .where(eq(vehicles.id, vehicleRow.id));

      await tx
        .update(drivers)
        .set({ status: "on_trip", updatedAt: sql`now()` })
        .where(eq(drivers.id, driverRow.id));
    });

    const bundle = await fetchTripBundle(getDb(), tripId);
    return { trip: mapTripBundle(bundle) };
  }

  static async cancel(actor: SessionUser, tripId: string, cancelReason?: string) {
    requireAnyRole(actor, TRIP_WRITE_ROLES);

    await getDb().transaction(async (tx) => {
      const [tripRow] = await tx
        .select()
        .from(trips)
        .where(and(eq(trips.id, tripId), sql`${trips.deletedAt} is null`))
        .limit(1);

      if (!tripRow) {
        throw new Error("Trip not found");
      }

      if (!canCancelTrip(tripRow.status)) {
        throw new Error("Trip cannot be cancelled");
      }

      await tx
        .update(trips)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: cancelReason?.trim() || null,
          updatedAt: sql`now()`,
        })
        .where(eq(trips.id, tripId));

      if (tripRow.status === "dispatched") {
        await tx
          .update(vehicles)
          .set({ status: "available", updatedAt: sql`now()` })
          .where(eq(vehicles.id, tripRow.vehicleId));

        await tx
          .update(drivers)
          .set({ status: "available", updatedAt: sql`now()` })
          .where(eq(drivers.id, tripRow.driverId));
      }
    });

    const bundle = await fetchTripBundle(getDb(), tripId);
    return { trip: mapTripBundle(bundle) };
  }

  static async complete(
    actor: SessionUser,
    tripId: string,
    input: {
      endOdometerKm: number;
      fuelLiters: number;
      fuelCostInr: number;
      expenses: Array<{
        expenseCategoryId: string;
        amountInr: number;
        incurredOn: string;
        description?: string;
      }>;
    },
  ) {
    requireAnyRole(actor, TRIP_WRITE_ROLES);
    assertPositiveFuel(input.fuelLiters, input.fuelCostInr);
    assertTripExpensesPresent(input.expenses.length);

    await getDb().transaction(async (tx) => {
      const [tripRow] = await tx
        .select()
        .from(trips)
        .where(and(eq(trips.id, tripId), sql`${trips.deletedAt} is null`))
        .limit(1);

      if (!tripRow) {
        throw new Error("Trip not found");
      }

      if (!canCompleteTrip(tripRow.status)) {
        throw new Error("Only dispatched trips can be completed");
      }

      const [vehicleRow] = await tx
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, tripRow.vehicleId))
        .limit(1);

      if (!vehicleRow || tripRow.startOdometerKm === null) {
        throw new Error("Trip dispatch data is incomplete");
      }

      assertEndOdometerValid(
        input.endOdometerKm,
        Number(tripRow.startOdometerKm),
        Number(vehicleRow.odometerKm),
      );

      const actualDistanceKm = input.endOdometerKm - Number(tripRow.startOdometerKm);

      await tx.insert(fuelLogs).values({
        vehicleId: tripRow.vehicleId,
        tripId: tripRow.id,
        liters: input.fuelLiters.toFixed(3),
        costInr: input.fuelCostInr.toFixed(2),
        loggedAt: todayIsoDate(),
        createdByUserId: actor.id,
      });

      for (const expense of input.expenses) {
        await tx.insert(expenses).values({
          vehicleId: tripRow.vehicleId,
          tripId: tripRow.id,
          expenseCategoryId: expense.expenseCategoryId,
          amountInr: expense.amountInr.toFixed(2),
          incurredOn: expense.incurredOn,
          description: expense.description?.trim() || null,
          createdByUserId: actor.id,
        });
      }

      await tx
        .update(trips)
        .set({
          status: "completed",
          endOdometerKm: input.endOdometerKm.toFixed(1),
          actualDistanceKm: actualDistanceKm.toFixed(2),
          fuelConsumedLiters: input.fuelLiters.toFixed(3),
          fuelCostInr: input.fuelCostInr.toFixed(2),
          completedAt: new Date(),
          updatedAt: sql`now()`,
        })
        .where(eq(trips.id, tripId));

      await tx
        .update(vehicles)
        .set({
          status: "available",
          odometerKm: input.endOdometerKm.toFixed(1),
          updatedAt: sql`now()`,
        })
        .where(eq(vehicles.id, tripRow.vehicleId));

      await tx
        .update(drivers)
        .set({ status: "available", updatedAt: sql`now()` })
        .where(eq(drivers.id, tripRow.driverId));
    });

    const bundle = await fetchTripBundle(getDb(), tripId);
    return { trip: mapTripBundle(bundle) };
  }
}
