import type { NotificationJobConfig } from "@/modules/notifications/plugins/license-expiry/_types/notifications";
import {
  assertJobConfig,
  parseEnabled,
  parseMailMode,
  parseReminderDays,
  parseScheduleTime,
} from "@/modules/notifications/plugins/license-expiry/runtime";

function readEnv(name: string): string | undefined {
  return Bun.env[name];
}

export function loadNotificationJobConfig(
  env: Record<string, string | undefined> = Bun.env as Record<string, string | undefined>,
): NotificationJobConfig {
  const read = (name: string) => env[name] ?? readEnv(name);

  const config: NotificationJobConfig = {
    enabled: parseEnabled(read("NOTIFICATIONS_ENABLED")),
    reminderDays: parseReminderDays(read("NOTIFICATIONS_REMINDER_DAYS")),
    scheduleTime: parseScheduleTime(read("NOTIFICATIONS_SCHEDULE_TIME")),
    timezone: (read("NOTIFICATIONS_TIMEZONE") ?? "UTC").trim() || "UTC",
    fallbackEmail: (
      read("NOTIFICATIONS_FALLBACK_EMAIL") ||
      read("AUTH_ADMIN_EMAIL") ||
      "admin@example.com"
    ).trim(),
    mailMode: parseMailMode(read("NOTIFICATIONS_MAIL_MODE")),
    fromEmail: (read("NOTIFICATIONS_FROM_EMAIL") ?? "TransitOps <noreply@example.com>").trim(),
    resendApiKey: (read("RESEND_API_KEY") ?? "").trim() || null,
  };

  assertJobConfig(config);
  return config;
}
