import type { UserRole } from "@/lib/auth/_types/user-role";
import type { DocumentEntityType } from "@/modules/documents/_types/documents";

export const DEFAULT_UPLOAD_MAX_BYTES = 5_242_880; // 5 MiB (ADR-040)

/** Fleet Manager owns documents (RBAC matrix). */
export function assertDocumentReadRole(role: UserRole): void {
  if (role !== "fleet_manager") {
    throw new Error("Forbidden");
  }
}

export function assertDocumentWriteRole(role: UserRole): void {
  if (role !== "fleet_manager") {
    throw new Error("Forbidden");
  }
}

export function parseUploadMaxBytes(raw: string | undefined): number {
  if (raw === undefined || raw.trim().length === 0) {
    return DEFAULT_UPLOAD_MAX_BYTES;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("UPLOAD_MAX_BYTES must be a positive number");
  }

  return Math.floor(parsed);
}

/**
 * Parse UPLOAD_ALLOWED_MIME.
 * `*` or empty → allow all types.
 * Otherwise comma-separated MIME list (case-insensitive).
 */
export function parseAllowedMimeList(raw: string | undefined): ReadonlySet<string> | null {
  if (raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0 || trimmed === "*") {
    return null;
  }

  const items = trimmed
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);

  if (items.length === 0 || items.includes("*")) {
    return null;
  }

  return new Set(items);
}

export function assertMimeAllowed(mimeType: string, allowed: ReadonlySet<string> | null): void {
  if (allowed === null) {
    return;
  }

  const normalized = mimeType.trim().toLowerCase();

  if (!allowed.has(normalized)) {
    throw new Error(`MIME type not allowed: ${mimeType}`);
  }
}

export function assertFileSizeWithinLimit(sizeBytes: number, maxBytes: number): void {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    throw new Error("File size is invalid");
  }

  if (sizeBytes === 0) {
    throw new Error("File is empty");
  }

  if (sizeBytes > maxBytes) {
    throw new Error(`File exceeds max size of ${maxBytes} bytes`);
  }
}

export function assertDocumentEntityType(value: string): DocumentEntityType {
  if (value === "vehicle" || value === "maintenance_log") {
    return value;
  }

  throw new Error("entityType must be vehicle or maintenance_log");
}

/** Strip path separators and collapse unsafe characters for stored file names. */
export function sanitizeFileName(fileName: string): string {
  const base = fileName.trim().replace(/\\/g, "/").split("/").pop()?.trim() ?? "";

  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, "_").replace(/^\.+/, "");

  if (cleaned.length === 0) {
    throw new Error("fileName is required");
  }

  return cleaned.slice(0, 255);
}

export function buildStorageRelativePath(
  entityType: DocumentEntityType,
  entityId: string,
  documentId: string,
  safeFileName: string,
): string {
  return `documents/${entityType}/${entityId}/${documentId}-${safeFileName}`;
}
