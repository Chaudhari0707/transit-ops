import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { requireSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { documents, maintenanceLogs, vehicles } from "@/lib/db/schema";
import {
  assertDocumentEntityType,
  assertDocumentReadRole,
  assertDocumentWriteRole,
  assertFileSizeWithinLimit,
  assertMimeAllowed,
  buildStorageRelativePath,
  parseAllowedMimeList,
  parseUploadMaxBytes,
  sanitizeFileName,
} from "@/modules/documents/_lib/rules";
import type {
  DocumentEntityType,
  DocumentListItem,
  DocumentListQuery,
  MaintenanceLogOption,
  VehicleOption,
} from "@/modules/documents/_types/documents";

function joinPath(...parts: string[]): string {
  return parts
    .filter((part) => part.length > 0)
    .join("/")
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");
}

/**
 * Project root for relative UPLOAD_STORAGE_DIR.
 * Avoid process.cwd / import.meta.dir (lint / Turbopack). Prefer shell PWD.
 */
function projectRoot(): string {
  const fromEnv = (Bun.env.PWD || Bun.env.INIT_CWD || "").replace(/\\/g, "/").replace(/\/$/, "");
  if (fromEnv.length > 0) {
    return fromEnv;
  }

  const metaPath = (import.meta as { path?: string }).path?.replace(/\\/g, "/");
  if (metaPath) {
    const dir = metaPath.replace(/\/[^/]+$/, "");
    const marker = "/src/modules/documents";
    const index = dir.lastIndexOf(marker);
    if (index >= 0) {
      return dir.slice(0, index);
    }
  }

  return ".";
}

function storageRoot(): string {
  const configured = Bun.env.UPLOAD_STORAGE_DIR?.trim();

  if (configured && configured.length > 0) {
    if (configured.startsWith("/")) {
      return configured;
    }

    return joinPath(projectRoot(), configured);
  }

  return joinPath(projectRoot(), "uploads");
}

function resolveAbsolutePath(relativePath: string): string {
  const root = storageRoot();
  const cleaned = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const absolute = joinPath(root, cleaned);

  if (!absolute.startsWith(root)) {
    throw new Error("Invalid storage path");
  }

  return absolute;
}

function uploadLimits() {
  return {
    allowedMime: parseAllowedMimeList(Bun.env.UPLOAD_ALLOWED_MIME),
    maxBytes: parseUploadMaxBytes(Bun.env.UPLOAD_MAX_BYTES),
  };
}

function mapDocumentRow(row: {
  createdAt: Date;
  entityId: string;
  entityLabel?: string | null;
  entityType: DocumentEntityType;
  fileName: string;
  id: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedByUserId: string;
}): DocumentListItem {
  return {
    createdAt: row.createdAt.toISOString(),
    entityId: row.entityId,
    entityLabel: row.entityLabel ?? null,
    entityType: row.entityType,
    fileName: row.fileName,
    id: row.id,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    storagePath: row.storagePath,
    uploadedByUserId: row.uploadedByUserId,
  };
}

async function assertEntityExists(entityType: DocumentEntityType, entityId: string): Promise<void> {
  const db = getDb();

  if (entityType === "vehicle") {
    const [row] = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.id, entityId), isNull(vehicles.deletedAt)))
      .limit(1);

    if (!row) {
      throw new Error("Vehicle not found");
    }

    return;
  }

  const maintenanceId = Number(entityId);

  if (!Number.isFinite(maintenanceId) || maintenanceId <= 0) {
    throw new Error("Maintenance log not found");
  }

  const [row] = await db
    .select({ id: maintenanceLogs.id })
    .from(maintenanceLogs)
    .where(eq(maintenanceLogs.id, maintenanceId))
    .limit(1);

  if (!row) {
    throw new Error("Maintenance log not found");
  }
}

async function resolveEntityLabel(
  entityType: DocumentEntityType,
  entityId: string,
): Promise<string | null> {
  const db = getDb();

  if (entityType === "vehicle") {
    const [row] = await db
      .select({
        nameModel: vehicles.nameModel,
        registrationNumber: vehicles.registrationNumber,
      })
      .from(vehicles)
      .where(eq(vehicles.id, entityId))
      .limit(1);

    return row ? `${row.registrationNumber} · ${row.nameModel}` : null;
  }

  const maintenanceId = Number(entityId);
  if (!Number.isFinite(maintenanceId)) {
    return null;
  }

  const [row] = await db
    .select({
      description: maintenanceLogs.description,
      id: maintenanceLogs.id,
      registrationNumber: vehicles.registrationNumber,
    })
    .from(maintenanceLogs)
    .innerJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
    .where(eq(maintenanceLogs.id, maintenanceId))
    .limit(1);

  if (!row) {
    return null;
  }

  const description = row.description?.trim() ? row.description.trim() : "Maintenance";
  return `#${row.id} · ${row.registrationNumber} · ${description}`;
}

export abstract class DocumentsService {
  static async list(headers: Headers, query: DocumentListQuery) {
    const actor = await requireSessionUser(headers);
    assertDocumentReadRole(actor.role);

    const db = getDb();
    const filters = [isNull(documents.deletedAt)];

    if (query.entityType) {
      filters.push(eq(documents.entityType, query.entityType));
    }

    if (query.entityId?.trim()) {
      filters.push(eq(documents.entityId, query.entityId.trim()));
    }

    const rows = await db
      .select({
        createdAt: documents.createdAt,
        entityId: documents.entityId,
        entityType: documents.entityType,
        fileName: documents.fileName,
        id: documents.id,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        storagePath: documents.storagePath,
        uploadedByUserId: documents.uploadedByUserId,
      })
      .from(documents)
      .where(and(...filters))
      .orderBy(desc(documents.createdAt));

    const items: DocumentListItem[] = [];

    for (const row of rows) {
      const entityLabel = await resolveEntityLabel(row.entityType, row.entityId);
      items.push(mapDocumentRow({ ...row, entityLabel }));
    }

    return { items };
  }

  static async upload(
    headers: Headers,
    input: {
      entityId: string;
      entityType: string;
      file: File;
    },
  ) {
    const actor = await requireSessionUser(headers);
    assertDocumentWriteRole(actor.role);

    const entityType = assertDocumentEntityType(input.entityType);
    const entityId = input.entityId.trim();

    if (!entityId) {
      throw new Error("entityId is required");
    }

    const fileName = sanitizeFileName(input.file.name || "upload.bin");
    const mimeType = (input.file.type || "application/octet-stream").trim();
    const sizeBytes = input.file.size;
    const { allowedMime, maxBytes } = uploadLimits();

    assertFileSizeWithinLimit(sizeBytes, maxBytes);
    assertMimeAllowed(mimeType, allowedMime);
    await assertEntityExists(entityType, entityId);

    const documentId = crypto.randomUUID();
    const relativePath = buildStorageRelativePath(entityType, entityId, documentId, fileName);
    const absolutePath = resolveAbsolutePath(relativePath);
    const buffer = Buffer.from(await input.file.arrayBuffer());

    await Bun.write(absolutePath, buffer);

    const db = getDb();
    const [inserted] = await db
      .insert(documents)
      .values({
        entityId,
        entityType,
        fileName,
        id: documentId,
        mimeType,
        sizeBytes,
        storagePath: relativePath,
        uploadedByUserId: actor.id,
      })
      .returning({
        createdAt: documents.createdAt,
        entityId: documents.entityId,
        entityType: documents.entityType,
        fileName: documents.fileName,
        id: documents.id,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        storagePath: documents.storagePath,
        uploadedByUserId: documents.uploadedByUserId,
      });

    if (!inserted) {
      throw new Error("Failed to create document");
    }

    const entityLabel = await resolveEntityLabel(entityType, entityId);
    return { document: mapDocumentRow({ ...inserted, entityLabel }) };
  }

  static async softDelete(headers: Headers, documentId: string) {
    const actor = await requireSessionUser(headers);
    assertDocumentWriteRole(actor.role);

    const db = getDb();
    const [existing] = await db
      .select({ deletedAt: documents.deletedAt, id: documents.id })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!existing || existing.deletedAt) {
      throw new Error("Document not found");
    }

    await db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, documentId));

    return { id: documentId, softDeleted: true as const };
  }

  static async getFile(headers: Headers, documentId: string) {
    const actor = await requireSessionUser(headers);
    assertDocumentReadRole(actor.role);

    const db = getDb();
    const [row] = await db
      .select({
        deletedAt: documents.deletedAt,
        fileName: documents.fileName,
        mimeType: documents.mimeType,
        storagePath: documents.storagePath,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!row || row.deletedAt) {
      throw new Error("Document not found");
    }

    const absolutePath = resolveAbsolutePath(row.storagePath);
    const file = Bun.file(absolutePath);

    if (!(await file.exists())) {
      throw new Error("Document file not found");
    }

    return {
      file,
      fileName: row.fileName,
      mimeType: row.mimeType,
    };
  }

  static async listVehicles(headers: Headers): Promise<{ items: VehicleOption[] }> {
    const actor = await requireSessionUser(headers);
    assertDocumentReadRole(actor.role);

    const items = await getDb()
      .select({
        id: vehicles.id,
        nameModel: vehicles.nameModel,
        registrationNumber: vehicles.registrationNumber,
        status: vehicles.status,
      })
      .from(vehicles)
      .where(isNull(vehicles.deletedAt))
      .orderBy(vehicles.registrationNumber);

    return { items };
  }

  static async listMaintenanceLogs(headers: Headers): Promise<{ items: MaintenanceLogOption[] }> {
    const actor = await requireSessionUser(headers);
    assertDocumentReadRole(actor.role);

    const rows = await getDb()
      .select({
        description: maintenanceLogs.description,
        id: maintenanceLogs.id,
        registrationNumber: vehicles.registrationNumber,
        status: maintenanceLogs.status,
      })
      .from(maintenanceLogs)
      .innerJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
      .orderBy(desc(maintenanceLogs.startedAt))
      .limit(100);

    return {
      items: rows.map((row) => ({
        id: String(row.id),
        label: `#${row.id} · ${row.registrationNumber} · ${row.status}${
          row.description?.trim() ? ` · ${row.description.trim()}` : ""
        }`,
        vehicleRegistration: row.registrationNumber,
      })),
    };
  }
}
