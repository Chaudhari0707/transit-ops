import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { maintenanceLogs, maintenanceTypes, vehicles } from "@/lib/db/schema";
import { requireSessionUser } from "@/modules/auth/_lib/session";
import {
  assertMaintenanceReadRole,
  assertMaintenanceWriteRole,
  closeMaintenanceBlockedReason,
  normalizeCostInr,
  normalizeOptionalKm,
  openMaintenanceBlockedReason,
  resolveDescriptionForOpen,
  validateOpenBody,
  vehicleStatusAfterClose,
} from "@/modules/maintenance/_lib/rules";
import type {
  CloseMaintenanceInput,
  MaintenanceLogListItem,
  OpenMaintenanceInput,
} from "@/modules/maintenance/_types/maintenance";

function toIso(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString();
}

function mapLogRow(row: {
  completedAt: Date | null;
  costInr: string;
  description: string | null;
  id: number;
  maintenanceTypeCode: string;
  maintenanceTypeId: string;
  maintenanceTypeName: string;
  nextDueOdometerKm: string | null;
  odometerAtServiceKm: string | null;
  startedAt: Date;
  status: "closed" | "open";
  vehicleId: string;
  vehicleNameModel: string;
  vehicleRegistration: string;
  vehicleStatus: "available" | "in_shop" | "on_trip" | "retired";
  vendorName: string | null;
}): MaintenanceLogListItem {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    vehicleRegistration: row.vehicleRegistration,
    vehicleNameModel: row.vehicleNameModel,
    vehicleStatus: row.vehicleStatus,
    maintenanceTypeId: row.maintenanceTypeId,
    maintenanceTypeCode: row.maintenanceTypeCode,
    maintenanceTypeName: row.maintenanceTypeName,
    status: row.status,
    description: row.description,
    vendorName: row.vendorName,
    costInr: row.costInr,
    odometerAtServiceKm: row.odometerAtServiceKm,
    nextDueOdometerKm: row.nextDueOdometerKm,
    startedAt: row.startedAt.toISOString(),
    completedAt: toIso(row.completedAt),
  };
}

const logSelect = {
  id: maintenanceLogs.id,
  vehicleId: maintenanceLogs.vehicleId,
  vehicleRegistration: vehicles.registrationNumber,
  vehicleNameModel: vehicles.nameModel,
  vehicleStatus: vehicles.status,
  maintenanceTypeId: maintenanceLogs.maintenanceTypeId,
  maintenanceTypeCode: maintenanceTypes.code,
  maintenanceTypeName: maintenanceTypes.name,
  status: maintenanceLogs.status,
  description: maintenanceLogs.description,
  vendorName: maintenanceLogs.vendorName,
  costInr: maintenanceLogs.costInr,
  odometerAtServiceKm: maintenanceLogs.odometerAtServiceKm,
  nextDueOdometerKm: maintenanceLogs.nextDueOdometerKm,
  startedAt: maintenanceLogs.startedAt,
  completedAt: maintenanceLogs.completedAt,
};

async function getLogById(id: number): Promise<MaintenanceLogListItem | null> {
  const [row] = await getDb()
    .select(logSelect)
    .from(maintenanceLogs)
    .innerJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
    .innerJoin(maintenanceTypes, eq(maintenanceLogs.maintenanceTypeId, maintenanceTypes.id))
    .where(eq(maintenanceLogs.id, id))
    .limit(1);

  return row ? mapLogRow(row) : null;
}

export abstract class MaintenanceService {
  static async list(headers: Headers, query: { status?: "closed" | "open"; vehicleId?: string }) {
    const actor = await requireSessionUser(headers);
    assertMaintenanceReadRole(actor.role);

    const filters = [];

    if (query.vehicleId) {
      filters.push(eq(maintenanceLogs.vehicleId, query.vehicleId));
    }

    if (query.status) {
      filters.push(eq(maintenanceLogs.status, query.status));
    }

    const rows = await getDb()
      .select(logSelect)
      .from(maintenanceLogs)
      .innerJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
      .innerJoin(maintenanceTypes, eq(maintenanceLogs.maintenanceTypeId, maintenanceTypes.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(maintenanceLogs.startedAt));

    return { items: rows.map(mapLogRow) };
  }

  static async listTypes(headers: Headers) {
    const actor = await requireSessionUser(headers);
    assertMaintenanceReadRole(actor.role);

    const items = await getDb()
      .select({
        id: maintenanceTypes.id,
        code: maintenanceTypes.code,
        name: maintenanceTypes.name,
      })
      .from(maintenanceTypes)
      .where(and(eq(maintenanceTypes.isActive, true), isNull(maintenanceTypes.deletedAt)))
      .orderBy(maintenanceTypes.code);

    return { items };
  }

  static async listVehicles(headers: Headers, forOpen: boolean) {
    const actor = await requireSessionUser(headers);
    assertMaintenanceReadRole(actor.role);

    const filters = [isNull(vehicles.deletedAt)];

    if (forOpen) {
      filters.push(eq(vehicles.status, "available"));
    }

    const items = await getDb()
      .select({
        id: vehicles.id,
        registrationNumber: vehicles.registrationNumber,
        nameModel: vehicles.nameModel,
        status: vehicles.status,
        odometerKm: vehicles.odometerKm,
      })
      .from(vehicles)
      .where(and(...filters))
      .orderBy(vehicles.registrationNumber);

    return { items };
  }

  static async open(headers: Headers, body: OpenMaintenanceInput) {
    const actor = await requireSessionUser(headers);
    assertMaintenanceWriteRole(actor.role);

    const normalized = validateOpenBody(body);
    const db = getDb();

    const logId = await db.transaction(async (tx) => {
      const [vehicle] = await tx
        .select({
          id: vehicles.id,
          status: vehicles.status,
          deletedAt: vehicles.deletedAt,
          odometerKm: vehicles.odometerKm,
        })
        .from(vehicles)
        .where(eq(vehicles.id, body.vehicleId))
        .limit(1);

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      const openBlock = openMaintenanceBlockedReason(vehicle);

      if (openBlock) {
        throw new Error(openBlock);
      }

      const [typeRow] = await tx
        .select({ id: maintenanceTypes.id, code: maintenanceTypes.code })
        .from(maintenanceTypes)
        .where(
          and(
            eq(maintenanceTypes.id, body.maintenanceTypeId),
            eq(maintenanceTypes.isActive, true),
            isNull(maintenanceTypes.deletedAt),
          ),
        )
        .limit(1);

      if (!typeRow) {
        throw new Error("Maintenance type not found");
      }

      const description = resolveDescriptionForOpen({
        customServiceType: body.customServiceType,
        description: body.description,
        maintenanceTypeCode: typeRow.code,
      });

      const [existingOpen] = await tx
        .select({ id: maintenanceLogs.id })
        .from(maintenanceLogs)
        .where(and(eq(maintenanceLogs.vehicleId, vehicle.id), eq(maintenanceLogs.status, "open")))
        .limit(1);

      if (existingOpen) {
        throw new Error("Conflict: vehicle already has an open maintenance");
      }

      const odometerAtServiceKm =
        normalized.odometerAtServiceKm ?? (vehicle.odometerKm ? String(vehicle.odometerKm) : null);

      const [inserted] = await tx
        .insert(maintenanceLogs)
        .values({
          vehicleId: vehicle.id,
          maintenanceTypeId: typeRow.id,
          status: "open",
          description,
          vendorName: normalized.vendorName,
          costInr: normalized.costInr,
          odometerAtServiceKm,
          nextDueOdometerKm: normalized.nextDueOdometerKm,
          createdByUserId: actor.id,
        })
        .returning({ id: maintenanceLogs.id });

      if (!inserted) {
        throw new Error("Failed to create maintenance log");
      }

      await tx
        .update(vehicles)
        .set({ status: "in_shop", updatedAt: sql`now()` })
        .where(eq(vehicles.id, vehicle.id));

      return inserted.id;
    });

    const log = await getLogById(logId);

    if (!log) {
      throw new Error("Maintenance log not found");
    }

    return { log };
  }

  static async close(headers: Headers, idRaw: string, body: CloseMaintenanceInput = {}) {
    const actor = await requireSessionUser(headers);
    assertMaintenanceWriteRole(actor.role);

    const id = Number(idRaw);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Maintenance log not found");
    }

    const costInr = body.costInr === undefined ? undefined : normalizeCostInr(body.costInr);
    const odometerAtServiceKm =
      body.odometerAtServiceKm === undefined
        ? undefined
        : normalizeOptionalKm(body.odometerAtServiceKm, "odometerAtServiceKm");
    const nextDueOdometerKm =
      body.nextDueOdometerKm === undefined
        ? undefined
        : normalizeOptionalKm(body.nextDueOdometerKm, "nextDueOdometerKm");
    const vendorName =
      body.vendorName === undefined
        ? undefined
        : body.vendorName?.trim()
          ? body.vendorName.trim().slice(0, 160)
          : null;
    const description =
      body.description === undefined
        ? undefined
        : body.description?.trim()
          ? body.description.trim()
          : null;

    await getDb().transaction(async (tx) => {
      const [log] = await tx
        .select({
          id: maintenanceLogs.id,
          status: maintenanceLogs.status,
          vehicleId: maintenanceLogs.vehicleId,
        })
        .from(maintenanceLogs)
        .where(eq(maintenanceLogs.id, id))
        .limit(1);

      if (!log) {
        throw new Error("Maintenance log not found");
      }

      const closeBlock = closeMaintenanceBlockedReason(log);

      if (closeBlock) {
        throw new Error(closeBlock);
      }

      const [vehicle] = await tx
        .select({
          id: vehicles.id,
          status: vehicles.status,
          deletedAt: vehicles.deletedAt,
        })
        .from(vehicles)
        .where(eq(vehicles.id, log.vehicleId))
        .limit(1);

      if (!vehicle || vehicle.deletedAt) {
        throw new Error("Vehicle not found");
      }

      await tx
        .update(maintenanceLogs)
        .set({
          status: "closed",
          completedAt: sql`now()`,
          updatedAt: sql`now()`,
          ...(costInr !== undefined ? { costInr } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(vendorName !== undefined ? { vendorName } : {}),
          ...(odometerAtServiceKm !== undefined ? { odometerAtServiceKm } : {}),
          ...(nextDueOdometerKm !== undefined ? { nextDueOdometerKm } : {}),
        })
        .where(eq(maintenanceLogs.id, log.id));

      const nextStatus = vehicleStatusAfterClose(vehicle.status);

      await tx
        .update(vehicles)
        .set({ status: nextStatus, updatedAt: sql`now()` })
        .where(eq(vehicles.id, vehicle.id));
    });

    const closed = await getLogById(id);

    if (!closed) {
      throw new Error("Maintenance log not found");
    }

    return { log: closed };
  }
}
