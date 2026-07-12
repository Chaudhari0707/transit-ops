import { Console, Effect, runScript } from "./runtime";
import {
  drainNotificationOutbox,
  enqueueLicenseExpiryReminders,
  loadNotificationJobConfig,
} from "@/modules/notifications/plugins/license-expiry/server";

const program = Effect.gen(function* () {
  const config = loadNotificationJobConfig();

  if (!config.enabled) {
    yield* Console.log("Notifications disabled (NOTIFICATIONS_ENABLED=false). Skipping run.");
    return;
  }

  yield* Console.log(
    `Daily notifications run (schedule hint ${config.scheduleTime} ${config.timezone})`,
  );

  const enqueue = yield* Effect.tryPromise({
    try: () => enqueueLicenseExpiryReminders(),
    catch: (error) =>
      new Error(error instanceof Error ? error.message : "Failed to enqueue license reminders."),
  });

  yield* Console.log(
    `Enqueue: scanned ${enqueue.scanned}; enqueued ${enqueue.enqueued}; duplicates ${enqueue.skippedDuplicate}; no recipient ${enqueue.skippedNoRecipient}`,
  );

  const drain = yield* Effect.tryPromise({
    try: () => drainNotificationOutbox(),
    catch: (error) =>
      new Error(error instanceof Error ? error.message : "Failed to drain notification outbox."),
  });

  yield* Console.log(
    `Drain: processed ${drain.processed}; sent ${drain.sent}; failed ${drain.failed}`,
  );
});

await runScript(program, "notifications:run failed:");
