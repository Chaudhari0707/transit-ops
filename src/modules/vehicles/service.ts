import "server-only";

import { and, desc, eq, isNull, ne } from "drizzle-orm";

import { requireAuthActor } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { vehicles, vehicleTypes } from "@/lib/db/schema";
import { assertCanViewVehicles, assertCanWriteVehicles } from "@/modules/vehicles/_lib/rbac";
import { assertValidRegistration } from "@/modules/vehicles/_lib/registration";
import {
  assertCanSoftDelete,
  assertRegistryStatusChange,
} from "@/modules/vehicles/_lib/status-rules";
import {
  assertNonNegativeCost,
  assertNonNegativeOdometer,
  assertPositiveCapacity,
  parseNumericString,
  toNumericString,
} from "@/modules/vehicles/_lib/validators";
import type { VehicleRecord, VehicleStatus } from "@/modules/vehicles/_types/vehicles";
import type { VehiclesModel } from "@/modules/vehicles/_types/vehicles-model";

type VehicleRow = typeof vehicles.$inferSelect;

function mapVehicle(row: VehicleRow): VehicleRecord {
  return {
    id: row.id,
    registrationNumber: row.registrationNumber,
    nameModel: row.nameModel,
    vehicleTypeId: row.vehicleTypeId,
    maxLoadCapacityKg: parseNumericString(row.maxLoadCapacityKg),
    odometerKm: parseNumericString(row.odometerKm),
    acquisitionCostInr: parseNumericString(row.acquisitionCostInr),
    status: row.status as VehicleStatus,
    notes: row.notes,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";

  return code === "23505" || message.toLowerCase().includes("unique");
}

async function assertVehicleTypeExists(vehicleTypeId: string): Promise<void> {
  const [typeRow] = await getDb()
    .select({ id: vehicleTypes.id })
    .from(vehicleTypes)
    .where(
      and(
        eq(vehicleTypes.id, vehicleTypeId),
        eq(vehicleTypes.isActive, true),
        isNull(vehicleTypes.deletedAt),
      ),
    )
    .limit(1);

  if (!typeRow) {
    throw new Error("Vehicle type not found");
  }
}

async function loadActiveVehicle(id: string): Promise<VehicleRow> {
  const [row] = await getDb()
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)))
    .limit(1);

  if (!row) {
    throw new Error("Vehicle not found");
  }

  return row;
}

export abstract class VehiclesService {
  static async list(
    headers: Headers,
    query: VehiclesModel["listQuery"],
  ): Promise<{ items: VehicleRecord[] }> {
    const actor = await requireAuthActor(headers);
    assertCanViewVehicles(actor.role);

    const filters = [isNull(vehicles.deletedAt)];

    if (query.vehicleTypeId) {
      filters.push(eq(vehicles.vehicleTypeId, query.vehicleTypeId));
    }

    if (query.status) {
      filters.push(eq(vehicles.status, query.status));
    }

    const rows = await getDb()
      .select()
      .from(vehicles)
      .where(and(...filters))
      .orderBy(desc(vehicles.createdAt));

    return { items: rows.map(mapVehicle) };
  }

  static async getById(headers: Headers, id: string): Promise<VehicleRecord> {
    const actor = await requireAuthActor(headers);
    assertCanViewVehicles(actor.role);

    return mapVehicle(await loadActiveVehicle(id));
  }

  static async create(headers: Headers, body: VehiclesModel["createBody"]): Promise<VehicleRecord> {
    const actor = await requireAuthActor(headers);
    assertCanWriteVehicles(actor.role);

    const registrationNumber = assertValidRegistration(body.registrationNumber);
    const nameModel = body.nameModel.trim();

    if (nameModel.length === 0) {
      throw new Error("Name/model is required");
    }

    assertPositiveCapacity(body.maxLoadCapacityKg);
    assertNonNegativeCost(body.acquisitionCostInr);

    const odometerKm = body.odometerKm ?? 0;
    assertNonNegativeOdometer(odometerKm);
    await assertVehicleTypeExists(body.vehicleTypeId);

    try {
      const [inserted] = await getDb()
        .insert(vehicles)
        .values({
          registrationNumber,
          nameModel,
          vehicleTypeId: body.vehicleTypeId,
          maxLoadCapacityKg: toNumericString(body.maxLoadCapacityKg, 2),
          odometerKm: toNumericString(odometerKm, 1),
          acquisitionCostInr: toNumericString(body.acquisitionCostInr, 2),
          status: "available",
          notes: body.notes?.trim() ? body.notes.trim() : null,
          createdByUserId: actor.userId,
        })
        .returning();

      if (!inserted) {
        throw new Error("Unable to create vehicle");
      }

      return mapVehicle(inserted);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error("Conflict: registration number already exists");
      }

      throw error;
    }
  }

  static async update(
    headers: Headers,
    id: string,
    body: VehiclesModel["updateBody"],
  ): Promise<VehicleRecord> {
    const actor = await requireAuthActor(headers);
    assertCanWriteVehicles(actor.role);

    const existing = await loadActiveVehicle(id);
    const patch: Partial<typeof vehicles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.registrationNumber !== undefined) {
      patch.registrationNumber = assertValidRegistration(body.registrationNumber);

      const [duplicate] = await getDb()
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(
          and(
            eq(vehicles.registrationNumber, patch.registrationNumber),
            isNull(vehicles.deletedAt),
            ne(vehicles.id, id),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new Error("Conflict: registration number already exists");
      }
    }

    if (body.nameModel !== undefined) {
      const nameModel = body.nameModel.trim();

      if (nameModel.length === 0) {
        throw new Error("Name/model is required");
      }

      patch.nameModel = nameModel;
    }

    if (body.vehicleTypeId !== undefined) {
      await assertVehicleTypeExists(body.vehicleTypeId);
      patch.vehicleTypeId = body.vehicleTypeId;
    }

    if (body.maxLoadCapacityKg !== undefined) {
      assertPositiveCapacity(body.maxLoadCapacityKg);
      patch.maxLoadCapacityKg = toNumericString(body.maxLoadCapacityKg, 2);
    }

    if (body.odometerKm !== undefined) {
      assertNonNegativeOdometer(body.odometerKm);
      patch.odometerKm = toNumericString(body.odometerKm, 1);
    }

    if (body.acquisitionCostInr !== undefined) {
      assertNonNegativeCost(body.acquisitionCostInr);
      patch.acquisitionCostInr = toNumericString(body.acquisitionCostInr, 2);
    }

    if (body.notes !== undefined) {
      patch.notes = body.notes?.trim() ? body.notes.trim() : null;
    }

    if (body.status !== undefined) {
      assertRegistryStatusChange(existing.status as VehicleStatus, body.status);
      patch.status = body.status;
    }

    try {
      const [updated] = await getDb()
        .update(vehicles)
        .set(patch)
        .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)))
        .returning();

      if (!updated) {
        throw new Error("Vehicle not found");
      }

      return mapVehicle(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error("Conflict: registration number already exists");
      }

      throw error;
    }
  }

  static async softDelete(headers: Headers, id: string): Promise<{ id: string; deleted: true }> {
    const actor = await requireAuthActor(headers);
    assertCanWriteVehicles(actor.role);

    const existing = await loadActiveVehicle(id);
    assertCanSoftDelete(existing.status as VehicleStatus);

    const [deleted] = await getDb()
      .update(vehicles)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)))
      .returning({ id: vehicles.id });

    if (!deleted) {
      throw new Error("Vehicle not found");
    }

    return { id: deleted.id, deleted: true };
  }
}
