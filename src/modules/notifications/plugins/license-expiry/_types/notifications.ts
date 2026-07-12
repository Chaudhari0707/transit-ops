export type DrainResult = {
  failed: number;
  processed: number;
  sent: number;
};

export type DriverLicenseCandidate = {
  driverId: string;
  fullName: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  linkedUserEmail: string | null;
};

export type EnqueueResult = {
  enqueued: number;
  scanned: number;
  skippedDuplicate: number;
  skippedNoRecipient: number;
};

export type LicenseExpiryPayload = {
  daysUntilExpiry: number;
  driverId: string;
  driverName: string;
  licenseExpiryDate: string;
  licenseNumber: string;
  reminderDays: number;
};

export type MailMode = "log" | "resend";

export type NotificationJobConfig = {
  enabled: boolean;
  fallbackEmail: string;
  fromEmail: string;
  mailMode: MailMode;
  reminderDays: number[];
  resendApiKey: string | null;
  /** UTC wall clock HH:MM for scheduled daily runs. */
  scheduleTime: string;
  timezone: string;
};

export type OutboxStatusCounts = {
  cancelled: number;
  failed: number;
  pending: number;
  sent: number;
};

export type SendEmailInput = {
  from: string;
  subject: string;
  text: string;
  to: string;
};

export type SendEmailResult = {
  providerMessageId: string | null;
};
