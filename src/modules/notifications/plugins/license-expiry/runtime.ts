import type {
  DriverLicenseCandidate,
  LicenseExpiryPayload,
  MailMode,
  NotificationJobConfig,
} from "@/modules/notifications/plugins/license-expiry/_types/notifications";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Parse `30,14,7` into unique descending day thresholds. */
export function parseReminderDays(raw: string | undefined, fallback = [30, 14, 7]): number[] {
  if (!raw || raw.trim().length === 0) {
    return [...fallback];
  }

  const parsed = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0);

  if (parsed.length === 0) {
    throw new Error("NOTIFICATIONS_REMINDER_DAYS must include at least one non-negative integer");
  }

  return [...new Set(parsed)].toSorted((a, b) => b - a);
}

export function parseScheduleTime(raw: string | undefined, fallback = "09:00"): string {
  const value = (raw ?? fallback).trim();
  if (!TIME_PATTERN.test(value)) {
    throw new Error("NOTIFICATIONS_SCHEDULE_TIME must be HH:MM in 24h format (UTC)");
  }
  return value;
}

export function parseMailMode(raw: string | undefined): MailMode {
  const value = (raw ?? "log").trim().toLowerCase();
  if (value === "log" || value === "resend") {
    return value;
  }
  throw new Error("NOTIFICATIONS_MAIL_MODE must be log or resend");
}

export function parseEnabled(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim().length === 0) {
    return true;
  }
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function daysUntilExpiry(licenseExpiryDate: string, todayIso: string): number {
  const today = Date.parse(`${todayIso}T00:00:00.000Z`);
  const expiry = Date.parse(`${licenseExpiryDate}T00:00:00.000Z`);
  if (Number.isNaN(today) || Number.isNaN(expiry)) {
    throw new Error("Invalid date for daysUntilExpiry");
  }
  return Math.round((expiry - today) / 86_400_000);
}

/** Exact threshold match — one email per reminder day on the daily cron. */
export function matchingReminderDay(
  licenseExpiryDate: string,
  reminderDays: number[],
  todayIso: string,
): number | null {
  const remaining = daysUntilExpiry(licenseExpiryDate, todayIso);
  if (remaining < 0) {
    return null;
  }
  return reminderDays.includes(remaining) ? remaining : null;
}

export function resolveRecipientEmail(
  linkedUserEmail: string | null | undefined,
  fallbackEmail: string,
): string | null {
  const linked = linkedUserEmail?.trim().toLowerCase() ?? "";
  if (linked.includes("@")) {
    return linked;
  }
  const fallback = fallbackEmail.trim().toLowerCase();
  if (fallback.includes("@")) {
    return fallback;
  }
  return null;
}

export function buildLicenseExpiryPayload(
  candidate: DriverLicenseCandidate,
  reminderDays: number,
  daysUntil: number,
): LicenseExpiryPayload {
  return {
    driverId: candidate.driverId,
    driverName: candidate.fullName,
    licenseNumber: candidate.licenseNumber,
    licenseExpiryDate: candidate.licenseExpiryDate,
    reminderDays,
    daysUntilExpiry: daysUntil,
  };
}

/** True when current UTC HH:MM equals configured schedule time. */
export function isScheduledTimeNow(
  scheduleTime: string,
  now = new Date(),
): boolean {
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}` === scheduleTime;
}

export function assertJobConfig(config: NotificationJobConfig): void {
  if (config.reminderDays.length === 0) {
    throw new Error("reminderDays cannot be empty");
  }
  parseScheduleTime(config.scheduleTime);
  if (config.mailMode === "resend" && !config.resendApiKey) {
    throw new Error("RESEND_API_KEY is required when NOTIFICATIONS_MAIL_MODE=resend");
  }
  if (!resolveRecipientEmail(null, config.fallbackEmail)) {
    throw new Error("NOTIFICATIONS_FALLBACK_EMAIL must be a valid email");
  }
}
