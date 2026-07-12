/**
 * Long-running helper: every minute, when UTC clock matches NOTIFICATIONS_SCHEDULE_TIME,
 * runs enqueue + drain once for that minute.
 *
 * Prefer OS cron + `bun run notifications:run` in production.
 */
import {
  drainNotificationOutbox,
  enqueueLicenseExpiryReminders,
  isScheduledTimeNow,
  loadNotificationJobConfig,
} from "@/modules/notifications/plugins/license-expiry/server";

const SLEEP_MS = 60_000;

let lastRunKey: string | null = null;

async function tick() {
  const config = loadNotificationJobConfig();
  if (!config.enabled) {
    console.log("[notifications:worker] disabled");
    return;
  }

  const now = new Date();
  if (!isScheduledTimeNow(config.scheduleTime, now)) {
    return;
  }

  const runKey = now.toISOString().slice(0, 16);
  if (lastRunKey === runKey) {
    return;
  }
  lastRunKey = runKey;

  console.log(`[notifications:worker] schedule hit ${config.scheduleTime} UTC — running`);
  const enqueue = await enqueueLicenseExpiryReminders();
  const drain = await drainNotificationOutbox();
  console.log(
    `[notifications:worker] enqueued=${enqueue.enqueued} sent=${drain.sent} failed=${drain.failed}`,
  );
}

console.log(
  `[notifications:worker] watching schedule=${loadNotificationJobConfig().scheduleTime} UTC (ctrl+c to stop)`,
);

await tick();
setInterval(() => {
  void tick().catch((error) => {
    console.error("[notifications:worker]", error instanceof Error ? error.message : error);
  });
}, SLEEP_MS);
