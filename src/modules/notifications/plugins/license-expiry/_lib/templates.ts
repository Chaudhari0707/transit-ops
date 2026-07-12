import type { LicenseExpiryPayload } from "@/modules/notifications/plugins/license-expiry/_types/notifications";

export function licenseExpirySubject(payload: LicenseExpiryPayload): string {
  return `License expiry reminder: ${payload.driverName} (${payload.daysUntilExpiry} days)`;
}

export function licenseExpiryTextBody(payload: LicenseExpiryPayload): string {
  return [
    `Driver license expiry reminder`,
    ``,
    `Driver: ${payload.driverName}`,
    `License: ${payload.licenseNumber}`,
    `Expires: ${payload.licenseExpiryDate}`,
    `Days remaining: ${payload.daysUntilExpiry}`,
    `Reminder window: ${payload.reminderDays}-day threshold`,
    ``,
    `Please renew the license before trip assignment is blocked.`,
  ].join("\n");
}
