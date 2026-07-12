import { Console, Effect, runScript } from "./runtime";
import {
  drainNotificationOutbox,
  loadNotificationJobConfig,
} from "@/modules/notifications/plugins/license-expiry/server";

const program = Effect.gen(function* () {
  const config = loadNotificationJobConfig();

  if (!config.enabled) {
    yield* Console.log("Notifications disabled (NOTIFICATIONS_ENABLED=false). Skipping drain.");
    return;
  }

  yield* Console.log(`Drain outbox (mailMode=${config.mailMode})`);

  const result = yield* Effect.tryPromise({
    try: () => drainNotificationOutbox(),
    catch: (error) =>
      new Error(error instanceof Error ? error.message : "Failed to drain notification outbox."),
  });

  yield* Console.log(
    `Processed ${result.processed}; sent ${result.sent}; failed ${result.failed}`,
  );
});

await runScript(program, "notifications:drain failed:");
