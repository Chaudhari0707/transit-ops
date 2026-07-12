import { and, asc, eq, gte, sql } from "drizzle-orm";

import type { getDb } from "@/lib/db/client";
import { drivers, vehicles } from "@/lib/db/schema";

type Db = ReturnType<typeof getDb>;

export async function fetchAssignableVehicles(db: Db) {
  return db
    .select({
      id: vehicles.id,
      registrationNumber: vehicles.registrationNumber,
      nameModel: vehicles.nameModel,
      maxLoadCapacityKg: vehicles.maxLoadCapacityKg,
      odometerKm: vehicles.odometerKm,
      status: vehicles.status,
    })
    .from(vehicles)
    .where(and(eq(vehicles.status, "available"), sql`${vehicles.deletedAt} is null`))
    .orderBy(asc(vehicles.registrationNumber));
}

export async function fetchAssignableDrivers(db: Db, todayIsoDate: string) {
  return db
    .select({
      id: drivers.id,
      fullName: drivers.fullName,
      licenseNumber: drivers.licenseNumber,
      licenseExpiryDate: drivers.licenseExpiryDate,
      contactNumber: drivers.contactNumber,
      safetyScore: drivers.safetyScore,
      status: drivers.status,
    })
    .from(drivers)
    .where(
      and(
        eq(drivers.status, "available"),
        gte(drivers.licenseExpiryDate, todayIsoDate),
        sql`${drivers.deletedAt} is null`,
      ),
    )
    .orderBy(asc(drivers.fullName));
}
