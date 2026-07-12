import { Console, Effect, runScript } from "./runtime";
import {
  getOutboxStatusCounts,
  isScheduledTimeNow,
  loadNotificationJobConfig,
} from "@/modules/notifications/plugins/license-expiry/server";
import { licenseExpiryPluginManifest } from "@/modules/notifications/plugins/license-expiry/plugin-manifest";

const program = Effect.gen(function* () {
  const config = loadNotificationJobConfig();
  const counts = yield* Effect.tryPromise({
    try: () => getOutboxStatusCounts(),
    catch: (error) =>
      new Error(error instanceof Error ? error.message : "Failed to load outbox status."),
  });

  yield* Console.log("\n📬  Notification jobs\n" + "═".repeat(50));
  yield* Console.log(`   Plugin          : ${licenseExpiryPluginManifest.id}`);
  yield* Console.log(`   Enabled         : ${config.enabled}`);
  yield* Console.log(`   Reminder days   : ${config.reminderDays.join(", ")}`);
  yield* Console.log(`   Schedule time   : ${config.scheduleTime} (${config.timezone})`);
  yield* Console.log(`   Due now (UTC)   : ${isScheduledTimeNow(config.scheduleTime)}`);
  yield* Console.log(`   Mail mode       : ${config.mailMode}`);
  yield* Console.log(`   Fallback email  : ${config.fallbackEmail}`);
  yield* Console.log(`   From            : ${config.fromEmail}`);
  yield* Console.log("\n   Outbox counts");
  yield* Console.log(`     pending       : ${counts.pending}`);
  yield* Console.log(`     sent          : ${counts.sent}`);
  yield* Console.log(`     failed        : ${counts.failed}`);
  yield* Console.log(`     cancelled     : ${counts.cancelled}`);
  yield* Console.log(
    "\n   Ops: bun run notifications:run  (wire OS cron near NOTIFICATIONS_SCHEDULE_TIME)\n",
  );
});

await runScript(program, "notifications:status failed:");
