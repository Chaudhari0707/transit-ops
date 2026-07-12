import { Console, Effect, runScript } from "./runtime";
import {
  enqueueLicenseExpiryReminders,
  loadNotificationJobConfig,
} from "@/modules/notifications/plugins/license-expiry/server";

const program = Effect.gen(function* () {
  const config = loadNotificationJobConfig();

  if (!config.enabled) {
    yield* Console.log("Notifications disabled (NOTIFICATIONS_ENABLED=false). Skipping enqueue.");
    return;
  }

  yield* Console.log(
    `Enqueue license reminders (days=${config.reminderDays.join(",")}, schedule=${config.scheduleTime} ${config.timezone})`,
  );

  const result = yield* Effect.tryPromise({
    try: () => enqueueLicenseExpiryReminders(),
    catch: (error) =>
      new Error(error instanceof Error ? error.message : "Failed to enqueue license reminders."),
  });

  yield* Console.log(
    `Scanned ${result.scanned}; enqueued ${result.enqueued}; duplicates ${result.skippedDuplicate}; no recipient ${result.skippedNoRecipient}`,
  );
});

await runScript(program, "notifications:enqueue failed:");
