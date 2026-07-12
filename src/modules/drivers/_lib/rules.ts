import type { UserRole } from "@/lib/auth/_types/user-role";
import type { DriverStatus, DriverWriteInput } from "@/modules/drivers/_types/drivers";

/** FM + Safety full write; FA/Dispatcher cannot admin drivers. */
export function assertDriverReadRole(role: UserRole): void {
  if (role !== "fleet_manager" && role !== "safety_officer") {
    throw new Error("Forbidden");
  }
}

export function assertDriverWriteRole(role: UserRole): void {
  if (role !== "fleet_manager" && role !== "safety_officer") {
    throw new Error("Forbidden");
  }
}

export function normalizeFullName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("fullName is required");
  }
  if (trimmed.length > 160) {
    throw new Error("fullName must be at most 160 characters");
  }
  return trimmed;
}

export function normalizeLicenseNumber(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length === 0) {
    throw new Error("licenseNumber is required");
  }
  if (trimmed.length > 64) {
    throw new Error("licenseNumber must be at most 64 characters");
  }
  return trimmed;
}

export function normalizeContactNumber(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("contactNumber is required");
  }
  if (trimmed.length > 32) {
    throw new Error("contactNumber must be at most 32 characters");
  }
  return trimmed;
}

export function normalizeLicenseExpiryDate(value: string): string {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("licenseExpiryDate must be YYYY-MM-DD");
  }
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("licenseExpiryDate is not a valid date");
  }
  return trimmed;
}

export function normalizeSafetyScore(value: number | string | undefined): number {
  if (value === undefined || value === null || value === "") {
    return 100;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error("safetyScore must be an integer");
  }
  if (parsed < 0 || parsed > 100) {
    throw new Error("safetyScore must be between 0 and 100");
  }
  return parsed;
}

/** BR-03 helper: expired if expiry < today (UTC date). */
export function isLicenseExpired(licenseExpiryDate: string, todayIso = todayUtcDate()): boolean {
  return licenseExpiryDate < todayIso;
}

/** Soon-to-expire within `days` (inclusive of today, exclusive of already expired). */
export function isLicenseExpiringSoon(
  licenseExpiryDate: string,
  days = 30,
  todayIso = todayUtcDate(),
): boolean {
  if (isLicenseExpired(licenseExpiryDate, todayIso)) {
    return false;
  }
  const today = new Date(`${todayIso}T00:00:00.000Z`);
  const limit = new Date(today);
  limit.setUTCDate(limit.getUTCDate() + days);
  const limitIso = limit.toISOString().slice(0, 10);
  return licenseExpiryDate <= limitIso;
}

export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Manual status edits: cannot set on_trip (system via dispatch).
 * From on_trip: only trip complete/cancel should free — block admin force to other statuses
 * except suspend (compliance) is allowed for safety.
 */
export function assertManualStatusTransition(current: DriverStatus, next: DriverStatus): void {
  if (next === "on_trip") {
    throw new Error("Cannot set status to on_trip manually (set by trip dispatch)");
  }

  if (current === "on_trip" && next !== "suspended") {
    throw new Error(
      "Driver is on_trip; status is updated when the trip completes or is cancelled (suspend allowed)",
    );
  }
}

/** Assignable to trip: available + valid license (BR-03/04). */
export function isAssignableToTrip(driver: {
  deletedAt: Date | null;
  licenseExpiryDate: string;
  status: DriverStatus;
}): boolean {
  if (driver.deletedAt !== null) {
    return false;
  }
  if (driver.status !== "available") {
    return false;
  }
  if (isLicenseExpired(driver.licenseExpiryDate)) {
    return false;
  }
  return true;
}

/** ADR-049: compute on the fly; never store. */
export function computeTripCompletionPct(
  completedCount: number,
  assignedCount: number,
): number | null {
  if (assignedCount <= 0) {
    return null;
  }
  const completed = Math.max(0, completedCount);
  const assigned = Math.max(0, assignedCount);
  return Math.round((completed / assigned) * 1000) / 10;
}

export function validateDriverWriteBody(input: DriverWriteInput): {
  contactNumber: string;
  fullName: string;
  licenseCategoryId: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  notes: string | null;
  safetyScore: number;
  status: DriverStatus;
} {
  if (!input.licenseCategoryId?.trim()) {
    throw new Error("licenseCategoryId is required");
  }

  const status = (input.status ?? "available") as DriverStatus;
  const allowed: DriverStatus[] = ["available", "on_trip", "off_duty", "suspended"];
  if (!allowed.includes(status)) {
    throw new Error("status is invalid");
  }

  if (status === "on_trip" && input.allowOnTripCreate !== true) {
    // Create/update path never accepts on_trip unless seed/system flag
    throw new Error("Cannot set status to on_trip manually (set by trip dispatch)");
  }

  const notes = input.notes?.trim() ? input.notes.trim() : null;

  return {
    fullName: normalizeFullName(input.fullName),
    licenseNumber: normalizeLicenseNumber(input.licenseNumber),
    licenseCategoryId: input.licenseCategoryId.trim(),
    licenseExpiryDate: normalizeLicenseExpiryDate(input.licenseExpiryDate),
    contactNumber: normalizeContactNumber(input.contactNumber),
    safetyScore: normalizeSafetyScore(input.safetyScore),
    status: status === "on_trip" ? "available" : status,
    notes,
  };
}
