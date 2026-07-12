import "server-only";

import { and, count, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";

import { requireSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { drivers, licenseCategories, trips } from "@/lib/db/schema";
import {
  assertDriverReadRole,
  assertDriverWriteRole,
  assertManualStatusTransition,
  computeTripCompletionPct,
  isLicenseExpired,
  isLicenseExpiringSoon,
  validateDriverWriteBody,
} from "@/modules/drivers/_lib/rules";
import type {
  DriverListItem,
  DriverStatus,
  DriverWriteInput,
} from "@/modules/drivers/_types/drivers";

type ListQuery = {
  licenseCompliance?: "expired" | "expiring_soon" | "valid";
  search?: string;
  status?: DriverStatus;
};

function mapDriver(
  row: {
    contactNumber: string;
    fullName: string;
    id: string;
    licenseCategoryCode: string;
    licenseCategoryId: string;
    licenseCategoryName: string;
    licenseExpiryDate: string;
    licenseNumber: string;
    notes: string | null;
    safetyScore: number;
    status: DriverStatus;
  },
  stats: { assigned: number; completed: number },
): DriverListItem {
  return {
    id: row.id,
    fullName: row.fullName,
    licenseNumber: row.licenseNumber,
    licenseCategoryId: row.licenseCategoryId,
    licenseCategoryCode: row.licenseCategoryCode,
    licenseCategoryName: row.licenseCategoryName,
    licenseExpiryDate: row.licenseExpiryDate,
    contactNumber: row.contactNumber,
    safetyScore: row.safetyScore,
    status: row.status,
    notes: row.notes,
    isLicenseExpired: isLicenseExpired(row.licenseExpiryDate),
    isLicenseExpiringSoon: isLicenseExpiringSoon(row.licenseExpiryDate),
    assignedTripCount: stats.assigned,
    completedTripCount: stats.completed,
    tripCompletionPct: computeTripCompletionPct(stats.completed, stats.assigned),
  };
}

const driverSelect = {
  id: drivers.id,
  fullName: drivers.fullName,
  licenseNumber: drivers.licenseNumber,
  licenseCategoryId: drivers.licenseCategoryId,
  licenseCategoryCode: licenseCategories.code,
  licenseCategoryName: licenseCategories.name,
  licenseExpiryDate: drivers.licenseExpiryDate,
  contactNumber: drivers.contactNumber,
  safetyScore: drivers.safetyScore,
  status: drivers.status,
  notes: drivers.notes,
};

async function loadTripStats(driverIds: string[]) {
  const stats = new Map<string, { assigned: number; completed: number }>();

  if (driverIds.length === 0) {
    return stats;
  }

  const rows = await getDb()
    .select({
      driverId: trips.driverId,
      assigned: count(),
      completed: sql<number>`count(*) filter (where ${trips.status} = 'completed')`.mapWith(Number),
    })
    .from(trips)
    .where(and(isNull(trips.deletedAt), inArray(trips.driverId, driverIds)))
    .groupBy(trips.driverId);

  for (const row of rows) {
    stats.set(row.driverId, {
      assigned: Number(row.assigned) || 0,
      completed: Number(row.completed) || 0,
    });
  }

  return stats;
}

async function getDriverById(id: string): Promise<DriverListItem | null> {
  const [row] = await getDb()
    .select(driverSelect)
    .from(drivers)
    .innerJoin(licenseCategories, eq(drivers.licenseCategoryId, licenseCategories.id))
    .where(and(eq(drivers.id, id), isNull(drivers.deletedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  const statsMap = await loadTripStats([row.id]);
  const stats = statsMap.get(row.id) ?? { assigned: 0, completed: 0 };
  return mapDriver(row, stats);
}

export abstract class DriversService {
  static async list(headers: Headers, query: ListQuery) {
    const actor = await requireSessionUser(headers);
    assertDriverReadRole(actor.role);

    const filters = [isNull(drivers.deletedAt)];

    if (query.status) {
      filters.push(eq(drivers.status, query.status));
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      filters.push(
        or(
          ilike(drivers.fullName, term),
          ilike(drivers.licenseNumber, term),
          ilike(drivers.contactNumber, term),
        )!,
      );
    }

    const rows = await getDb()
      .select(driverSelect)
      .from(drivers)
      .innerJoin(licenseCategories, eq(drivers.licenseCategoryId, licenseCategories.id))
      .where(and(...filters))
      .orderBy(drivers.fullName);

    const statsMap = await loadTripStats(rows.map((row) => row.id));

    let items = rows.map((row) =>
      mapDriver(row, statsMap.get(row.id) ?? { assigned: 0, completed: 0 }),
    );

    if (query.licenseCompliance === "expired") {
      items = items.filter((item) => item.isLicenseExpired);
    } else if (query.licenseCompliance === "expiring_soon") {
      items = items.filter((item) => item.isLicenseExpiringSoon);
    } else if (query.licenseCompliance === "valid") {
      items = items.filter((item) => !item.isLicenseExpired);
    }

    return { items };
  }

  static async get(headers: Headers, id: string) {
    const actor = await requireSessionUser(headers);
    assertDriverReadRole(actor.role);

    const driver = await getDriverById(id);
    if (!driver) {
      throw new Error("Driver not found");
    }
    return { driver };
  }

  static async create(headers: Headers, body: DriverWriteInput) {
    const actor = await requireSessionUser(headers);
    assertDriverWriteRole(actor.role);

    const normalized = validateDriverWriteBody(body);
    const db = getDb();

    const [category] = await db
      .select({ id: licenseCategories.id })
      .from(licenseCategories)
      .where(
        and(
          eq(licenseCategories.id, normalized.licenseCategoryId),
          eq(licenseCategories.isActive, true),
          isNull(licenseCategories.deletedAt),
        ),
      )
      .limit(1);

    if (!category) {
      throw new Error("License category not found");
    }

    const [dup] = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(eq(drivers.licenseNumber, normalized.licenseNumber), isNull(drivers.deletedAt)))
      .limit(1);

    if (dup) {
      throw new Error("Conflict: license number already exists");
    }

    const [inserted] = await db
      .insert(drivers)
      .values({
        fullName: normalized.fullName,
        licenseNumber: normalized.licenseNumber,
        licenseCategoryId: category.id,
        licenseExpiryDate: normalized.licenseExpiryDate,
        contactNumber: normalized.contactNumber,
        safetyScore: normalized.safetyScore,
        status: normalized.status,
        notes: normalized.notes,
        createdByUserId: actor.id,
      })
      .returning({ id: drivers.id });

    if (!inserted) {
      throw new Error("Failed to create driver");
    }

    const driver = await getDriverById(inserted.id);
    if (!driver) {
      throw new Error("Driver not found");
    }
    return { driver };
  }

  static async update(headers: Headers, id: string, body: DriverWriteInput) {
    const actor = await requireSessionUser(headers);
    assertDriverWriteRole(actor.role);

    const normalized = validateDriverWriteBody(body);
    const db = getDb();

    const [existing] = await db
      .select({
        id: drivers.id,
        status: drivers.status,
      })
      .from(drivers)
      .where(and(eq(drivers.id, id), isNull(drivers.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new Error("Driver not found");
    }

    // on_trip is system-owned: preserve unless Safety/FM explicitly suspends.
    let nextStatus = normalized.status;
    if (existing.status === "on_trip") {
      nextStatus = normalized.status === "suspended" ? "suspended" : "on_trip";
    } else {
      assertManualStatusTransition(existing.status, normalized.status);
    }

    const [category] = await db
      .select({ id: licenseCategories.id })
      .from(licenseCategories)
      .where(
        and(
          eq(licenseCategories.id, normalized.licenseCategoryId),
          eq(licenseCategories.isActive, true),
          isNull(licenseCategories.deletedAt),
        ),
      )
      .limit(1);

    if (!category) {
      throw new Error("License category not found");
    }

    const [dup] = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(
        and(
          eq(drivers.licenseNumber, normalized.licenseNumber),
          isNull(drivers.deletedAt),
          sql`${drivers.id} <> ${id}`,
        ),
      )
      .limit(1);

    if (dup) {
      throw new Error("Conflict: license number already exists");
    }

    await db
      .update(drivers)
      .set({
        fullName: normalized.fullName,
        licenseNumber: normalized.licenseNumber,
        licenseCategoryId: category.id,
        licenseExpiryDate: normalized.licenseExpiryDate,
        contactNumber: normalized.contactNumber,
        safetyScore: normalized.safetyScore,
        status: nextStatus,
        notes: normalized.notes,
        updatedAt: sql`now()`,
      })
      .where(eq(drivers.id, id));

    const driver = await getDriverById(id);
    if (!driver) {
      throw new Error("Driver not found");
    }
    return { driver };
  }

  static async softDelete(headers: Headers, id: string) {
    const actor = await requireSessionUser(headers);
    assertDriverWriteRole(actor.role);

    const db = getDb();
    const [existing] = await db
      .select({ id: drivers.id, status: drivers.status })
      .from(drivers)
      .where(and(eq(drivers.id, id), isNull(drivers.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new Error("Driver not found");
    }

    if (existing.status === "on_trip") {
      throw new Error("Cannot delete a driver who is on_trip");
    }

    await db
      .update(drivers)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(drivers.id, id));

    return { id, deleted: true as const };
  }

  static async listLicenseCategories(headers: Headers) {
    const actor = await requireSessionUser(headers);
    assertDriverReadRole(actor.role);

    const items = await getDb()
      .select({
        id: licenseCategories.id,
        code: licenseCategories.code,
        name: licenseCategories.name,
      })
      .from(licenseCategories)
      .where(and(eq(licenseCategories.isActive, true), isNull(licenseCategories.deletedAt)))
      .orderBy(licenseCategories.code);

    return { items };
  }
}
