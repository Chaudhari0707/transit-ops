import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { notificationOutbox } from "@/lib/db/schema/support";
import { loadNotificationJobConfig } from "@/modules/notifications/plugins/license-expiry/_lib/config";
import {
  buildLicenseExpiryEmail,
  sendViaMailMode,
} from "@/modules/notifications/plugins/license-expiry/_lib/mailer";
import { listActiveDriversWithLicense } from "@/modules/notifications/plugins/license-expiry/_lib/scan-drivers";
import { LICENSE_EXPIRY_TEMPLATE_KEY } from "@/modules/notifications/plugins/license-expiry/index";
import {
  buildLicenseExpiryPayload,
  daysUntilExpiry,
  matchingReminderDay,
  resolveRecipientEmail,
} from "@/modules/notifications/plugins/license-expiry/runtime";
import type {
  DrainResult,
  EnqueueResult,
  LicenseExpiryPayload,
  OutboxStatusCounts,
} from "@/modules/notifications/plugins/license-expiry/_types/notifications";
import { todayUtcDate } from "@/modules/drivers/_lib/rules";

export async function hasDuplicateLicenseReminder(input: {
  recipientEmail: string;
  driverId: string;
  reminderDays: number;
  licenseExpiryDate: string;
}): Promise<boolean> {
  const rows = await getDb()
    .select({ id: notificationOutbox.id })
    .from(notificationOutbox)
    .where(
      and(
        eq(notificationOutbox.templateKey, LICENSE_EXPIRY_TEMPLATE_KEY),
        eq(notificationOutbox.recipientEmail, input.recipientEmail),
        inArray(notificationOutbox.status, ["pending", "sent"]),
        sql`${notificationOutbox.payloadJson}->>'driverId' = ${input.driverId}`,
        sql`${notificationOutbox.payloadJson}->>'reminderDays' = ${String(input.reminderDays)}`,
        sql`${notificationOutbox.payloadJson}->>'licenseExpiryDate' = ${input.licenseExpiryDate}`,
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function enqueueLicenseExpiryReminders(
  todayIso = todayUtcDate(),
): Promise<EnqueueResult> {
  const config = loadNotificationJobConfig();

  if (!config.enabled) {
    return { scanned: 0, enqueued: 0, skippedDuplicate: 0, skippedNoRecipient: 0 };
  }

  const candidates = await listActiveDriversWithLicense(todayIso);
  let enqueued = 0;
  let skippedDuplicate = 0;
  let skippedNoRecipient = 0;

  for (const candidate of candidates) {
    const reminderDays = matchingReminderDay(
      candidate.licenseExpiryDate,
      config.reminderDays,
      todayIso,
    );
    if (reminderDays === null) {
      continue;
    }

    const recipientEmail = resolveRecipientEmail(
      candidate.linkedUserEmail,
      config.fallbackEmail,
    );
    if (!recipientEmail) {
      skippedNoRecipient += 1;
      continue;
    }

    const duplicate = await hasDuplicateLicenseReminder({
      recipientEmail,
      driverId: candidate.driverId,
      reminderDays,
      licenseExpiryDate: candidate.licenseExpiryDate,
    });
    if (duplicate) {
      skippedDuplicate += 1;
      continue;
    }

    const daysUntil = daysUntilExpiry(candidate.licenseExpiryDate, todayIso);
    const payload = buildLicenseExpiryPayload(candidate, reminderDays, daysUntil);

    await getDb().insert(notificationOutbox).values({
      channel: "email",
      templateKey: LICENSE_EXPIRY_TEMPLATE_KEY,
      recipientEmail,
      payloadJson: payload,
      status: "pending",
      scheduledFor: new Date(),
    });

    enqueued += 1;
  }

  return {
    scanned: candidates.length,
    enqueued,
    skippedDuplicate,
    skippedNoRecipient,
  };
}

export async function drainNotificationOutbox(limit = 50): Promise<DrainResult> {
  const config = loadNotificationJobConfig();

  if (!config.enabled) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  const now = new Date();
  const pending = await getDb()
    .select()
    .from(notificationOutbox)
    .where(
      and(eq(notificationOutbox.status, "pending"), lte(notificationOutbox.scheduledFor, now)),
    )
    .orderBy(asc(notificationOutbox.scheduledFor))
    .limit(limit);

  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      if (row.templateKey === LICENSE_EXPIRY_TEMPLATE_KEY) {
        const payload = row.payloadJson as LicenseExpiryPayload;
        const email = buildLicenseExpiryEmail(row.recipientEmail, config.fromEmail, payload);
        await sendViaMailMode(config.mailMode, email, config.resendApiKey);
      } else {
        throw new Error(`Unsupported template_key: ${row.templateKey}`);
      }

      await getDb()
        .update(notificationOutbox)
        .set({
          status: "sent",
          sentAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(notificationOutbox.id, row.id));

      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Send failed";
      await getDb()
        .update(notificationOutbox)
        .set({
          status: "failed",
          lastError: message.slice(0, 2000),
          updatedAt: new Date(),
        })
        .where(eq(notificationOutbox.id, row.id));
      failed += 1;
    }
  }

  return { processed: pending.length, sent, failed };
}

export async function getOutboxStatusCounts(): Promise<OutboxStatusCounts> {
  const rows = await getDb()
    .select({
      status: notificationOutbox.status,
      count: sql<number>`count(*)::int`,
    })
    .from(notificationOutbox)
    .groupBy(notificationOutbox.status);

  const counts: OutboxStatusCounts = {
    pending: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  };

  for (const row of rows) {
    counts[row.status] = row.count;
  }

  return counts;
}
