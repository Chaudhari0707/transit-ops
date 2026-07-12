import {
  LICENSE_EXPIRY_PLUGIN_ID,
  LICENSE_EXPIRY_TEMPLATE_KEY,
} from "@/modules/notifications/plugins/license-expiry/index";

/**
 * Plug-in manifest — no server-only imports.
 * Schedule + mail settings are env-driven so ops can change them without code edits.
 */
export const licenseExpiryPluginManifest = {
  id: LICENSE_EXPIRY_PLUGIN_ID,
  templateKey: LICENSE_EXPIRY_TEMPLATE_KEY,
  envKeys: [
    "NOTIFICATIONS_ENABLED",
    "NOTIFICATIONS_REMINDER_DAYS",
    "NOTIFICATIONS_SCHEDULE_TIME",
    "NOTIFICATIONS_TIMEZONE",
    "NOTIFICATIONS_FALLBACK_EMAIL",
    "NOTIFICATIONS_MAIL_MODE",
    "NOTIFICATIONS_FROM_EMAIL",
    "RESEND_API_KEY",
  ],
  scripts: {
    enqueue: "notifications:enqueue",
    drain: "notifications:drain",
    run: "notifications:run",
    status: "notifications:status",
  },
} as const;
